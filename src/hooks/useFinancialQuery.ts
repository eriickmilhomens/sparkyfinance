import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useCallback, useMemo, useState } from "react";
import {
  getDailyBudget,
  getGoalReservedTotal,
  getNormalizedMonthlyTotals,
  isDiscretionaryExpenseTransaction,
  readPaidBillIds,
} from "@/lib/financialCalculations";
import { BILLING_SYNC_EVENT, getBillingSummary } from "@/lib/billing";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "goal_deposit";
  category: string;
  cardId?: string;
}

export interface FinancialData {
  balance: number;
  income: number;
  expenses: number;
  scheduled: number;
  transactions: Transaction[];
}

export const FINANCIAL_QUERY_KEY = ["financial-data"] as const;

const isDemo = () => localStorage.getItem("sparky-demo-mode") === "true";
const STORAGE_KEY = "sparky-financial-data";
const DAILY_BUDGET_STATE_KEY = "sparky-daily-budget-state";

const defaultData: FinancialData = {
  balance: 0,
  income: 0,
  expenses: 0,
  scheduled: 0,
  transactions: [],
};

interface DailyBudgetSnapshot {
  date: string;
  reservePct: number;
  dailyBudget: number;
  baseDailyBudget: number;
  rolloverBonus: number;
  daysLeft: number;
  reserve: number;
}

const getDayKey = (date: Date) => date.toISOString().slice(0, 10);

const readDailyBudgetSnapshot = () => {
  try {
    const stored = localStorage.getItem(DAILY_BUDGET_STATE_KEY);
    return stored ? (JSON.parse(stored) as DailyBudgetSnapshot) : null;
  } catch {
    return null;
  }
};

const getPreviousDayDiscretionarySpend = (transactions: Transaction[], now: Date) => {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  return transactions
    .filter((transaction) => {
      if (!isDiscretionaryExpenseTransaction(transaction)) return false;
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate < end;
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
};

const resolveStaticDailyBudget = (
  transactions: Transaction[],
  available: number,
  reservePct: number,
  now: Date,
) => {
  const todayKey = getDayKey(now);
  const snapshot = readDailyBudgetSnapshot();

  if (snapshot?.date === todayKey && snapshot.reservePct === reservePct) {
    return snapshot;
  }

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), now.getMinutes());
  const yesterdayKey = getDayKey(yesterday);
  const yesterdaySpend = getPreviousDayDiscretionarySpend(transactions, now);
  const yesterdayUnspent =
    snapshot?.date === yesterdayKey ? Math.max(0, snapshot.dailyBudget - yesterdaySpend) : 0;

  const computed = getDailyBudget(Math.max(0, available), 0, reservePct, now, yesterdayUnspent);
  const nextSnapshot: DailyBudgetSnapshot = {
    date: todayKey,
    reservePct,
    dailyBudget: computed.dailyBudget,
    baseDailyBudget: computed.baseDailyBudget,
    rolloverBonus: computed.rolloverBonus,
    daysLeft: computed.daysLeft,
    reserve: computed.reserve,
  };

  localStorage.setItem(DAILY_BUDGET_STATE_KEY, JSON.stringify(nextSnapshot));
  return nextSnapshot;
};

async function fetchFinancialData(): Promise<FinancialData> {
  if (isDemo()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { ...defaultData };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...defaultData };

  const { data: txs, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Transactions fetch error:", error.message);
    return { ...defaultData };
  }

  const transactions: Transaction[] = (txs || []).map((t: any) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: Number(t.amount),
    type: t.type as "income" | "expense" | "goal_deposit",
    category: t.category,
    cardId: t.card_id || undefined,
  }));

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let income = 0;
  let expenses = 0;
  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate.getMonth() === month && transactionDate.getFullYear() === year) {
      if (transaction.type === "income") income += transaction.amount;
      else if (transaction.type === "expense") expenses += transaction.amount;
    }
  });

  return { balance: income - expenses, income, expenses, scheduled: 0, transactions };
}

export const useFinancialQuery = () => {
  const queryClient = useQueryClient();
  const [billingRevision, setBillingRevision] = useState(0);

  const queryResult = useQuery({
    queryKey: FINANCIAL_QUERY_KEY,
    queryFn: fetchFinancialData,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    placeholderData: defaultData,
  });

  const data = useMemo(() => {
    const baseData = queryResult.data ?? defaultData;
    const { income, expenses, balance } = getNormalizedMonthlyTotals(baseData.transactions, {
      now: new Date(),
      paidBillIds: readPaidBillIds(),
    });

    return {
      ...baseData,
      income,
      expenses,
      balance,
    };
  }, [queryResult.data, billingRevision]);

  const loading = queryResult.isLoading;

  useEffect(() => {
    if (isDemo()) return;

    const channel = supabase
      .channel("transactions-realtime-query")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
      })
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    });

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (isDemo() && queryResult.data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queryResult.data));
    }
  }, [queryResult.data]);

  useEffect(() => {
    const handler = () => {
      setBillingRevision((current) => current + 1);
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    };

    window.addEventListener("storage", handler);
    window.addEventListener(BILLING_SYNC_EVENT, handler);
    window.addEventListener("sparky-paid-bills-updated", handler);
    window.addEventListener("sparky-cards-updated", handler);

    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(BILLING_SYNC_EVENT, handler);
      window.removeEventListener("sparky-paid-bills-updated", handler);
      window.removeEventListener("sparky-cards-updated", handler);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!isDemo()) return;
    const handler = () => queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    window.addEventListener("storage", handler);
    window.addEventListener("sparky-data-cleared", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("sparky-data-cleared", handler);
    };
  }, [queryClient]);

  const computed = useMemo(() => {
    const now = new Date();
    const paidBillIds = readPaidBillIds();
    const billingSummary = getBillingSummary(data.transactions, { now, paidBillIds });
    const totalGoalReserved = getGoalReservedTotal(data.transactions);
    const available = data.balance - billingSummary.pendingTotal - totalGoalReserved;

    let reservePct = 0.20;
    try { reservePct = parseInt(localStorage.getItem("sparky-reserve-pct") || "20") / 100; } catch {}

    const dailyBudgetState = resolveStaticDailyBudget(data.transactions, available, reservePct, now);

    return {
      available,
      daysLeft: dailyBudgetState.daysLeft,
      dailyBudget: dailyBudgetState.dailyBudget,
      baseDailyBudget: dailyBudgetState.baseDailyBudget,
      rolloverBonus: dailyBudgetState.rolloverBonus,
      pendingTotal: billingSummary.pendingTotal,
      pendingCount: billingSummary.pendingCount,
      paidTotal: billingSummary.paidTotal,
      totalBills: billingSummary.totalBills,
      pendingItems: billingSummary.pendingItems,
      allPaid: billingSummary.allPaid,
      totalGoalReserved,
    };
  }, [data, billingRevision]);

  const addMutation = useMutation({
    onMutate: async (tx: Omit<Transaction, "id">) => {
      if (isDemo()) return {};

      await queryClient.cancelQueries({ queryKey: FINANCIAL_QUERY_KEY });
      const previousData = queryClient.getQueryData<FinancialData>(FINANCIAL_QUERY_KEY);
      const optimisticTransaction: Transaction = { ...tx, id: crypto.randomUUID() };

      queryClient.setQueryData<FinancialData>(FINANCIAL_QUERY_KEY, (old) => {
        const current = old ?? defaultData;
        const income = tx.type === "income" ? current.income + tx.amount : current.income;
        const expenses = tx.type === "expense" ? current.expenses + tx.amount : current.expenses;

        return {
          ...current,
          transactions: [optimisticTransaction, ...current.transactions],
          income,
          expenses,
          balance: income - expenses,
        };
      });

      return { previousData };
    },
    mutationFn: async (tx: Omit<Transaction, "id">) => {
      if (isDemo()) {
        const newTx = { ...tx, id: crypto.randomUUID() };
        queryClient.setQueryData<FinancialData>(FINANCIAL_QUERY_KEY, (old) => {
          if (!old) return { ...defaultData, transactions: [newTx] };
          const newIncome = tx.type === "income" ? old.income + tx.amount : old.income;
          const newExpenses = tx.type === "expense" ? old.expenses + tx.amount : old.expenses;
          return {
            ...old,
            transactions: [newTx, ...old.transactions],
            income: newIncome,
            expenses: newExpenses,
            balance: newIncome - newExpenses,
          };
        });
        return newTx.id;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: inserted, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          card_id: tx.cardId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return inserted?.id;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(FINANCIAL_QUERY_KEY, context.previousData);
      }
    },
    onSuccess: () => {
      if (!isDemo()) queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (isDemo()) {
        queryClient.setQueryData<FinancialData>(FINANCIAL_QUERY_KEY, (old) => {
          if (!old) return old!;
          const oldTx = old.transactions.find((transaction) => transaction.id === id);
          if (!oldTx) return old;
          const newAmount = updates.amount ?? oldTx.amount;
          const diff = newAmount - oldTx.amount;
          const newTransactions = old.transactions.map((transaction) => transaction.id === id ? { ...transaction, ...updates } : transaction);
          let newIncome = old.income;
          let newExpenses = old.expenses;
          if (oldTx.type === "income") newIncome += diff;
          else newExpenses += diff;
          return {
            ...old,
            transactions: newTransactions,
            income: Math.max(0, newIncome),
            expenses: Math.max(0, newExpenses),
            balance: Math.max(0, newIncome) - Math.max(0, newExpenses),
          };
        });
        return;
      }

      const dbUpdates: any = {};
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.date !== undefined) dbUpdates.date = updates.date;

      const { error } = await supabase.from("transactions").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (!isDemo()) queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) {
        queryClient.setQueryData<FinancialData>(FINANCIAL_QUERY_KEY, (old) => {
          if (!old) return old!;
          const tx = old.transactions.find((transaction) => transaction.id === id);
          if (!tx) return old;
          const newTransactions = old.transactions.filter((transaction) => transaction.id !== id);
          const newIncome = tx.type === "income" ? old.income - tx.amount : old.income;
          const newExpenses = tx.type === "expense" ? old.expenses - tx.amount : old.expenses;
          return {
            ...old,
            transactions: newTransactions,
            income: Math.max(0, newIncome),
            expenses: Math.max(0, newExpenses),
            balance: Math.max(0, newIncome) - Math.max(0, newExpenses),
          };
        });
        return;
      }

      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (!isDemo()) queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    },
  });

  const addTransaction = useCallback(async (tx: Omit<Transaction, "id">) => {
    return addMutation.mutateAsync(tx);
  }, [addMutation]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    return updateMutation.mutateAsync({ id, updates });
  }, [updateMutation]);

  const deleteTransaction = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const updateData = useCallback(async (partial: Partial<FinancialData>) => {
    if (isDemo()) {
      queryClient.setQueryData<FinancialData>(FINANCIAL_QUERY_KEY, (old) => ({ ...(old ?? defaultData), ...partial }));
      return;
    }

    if (partial.transactions) {
      const currentIds = new Set(data.transactions.map((transaction) => transaction.id));
      const newIds = new Set(partial.transactions.map((transaction) => transaction.id));
      const toInsert = partial.transactions.filter((transaction) => !currentIds.has(transaction.id));
      const toDelete = data.transactions.filter((transaction) => !newIds.has(transaction.id));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const tx of toInsert) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          card_id: tx.cardId || null,
        });
      }
      for (const tx of toDelete) {
        await supabase.from("transactions").delete().eq("id", tx.id);
      }
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    }
  }, [data.transactions, queryClient]);

  const clearAll = useCallback(async () => {
    if (isDemo()) {
      queryClient.setQueryData<FinancialData>(FINANCIAL_QUERY_KEY, { ...defaultData });
      const keys = [
        "sparky-balance", "sparky-transactions", "sparky-cards",
        "sparky-credit-cards", "sparky-budget", "sparky-goals",
        "sparky-chat-history", "sparky-investments", "sparky-planning",
        "sparky-income", "sparky-expenses", "sparky-sync-data",
        "sparky-open-finance-cache", "sparky-chat-style",
        "sparky-investment-goals", "sparky-points-log", DAILY_BUDGET_STATE_KEY,
        "sparky-paid-bills", STORAGE_KEY,
      ];
      keys.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      window.dispatchEvent(new Event("sparky-data-cleared"));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("transactions").delete().eq("user_id", user.id);
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
    }
  }, [queryClient]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY });
  }, [queryClient]);

  return {
    data,
    available: computed.available,
    daysLeft: computed.daysLeft,
    dailyBudget: computed.dailyBudget,
    baseDailyBudget: computed.baseDailyBudget,
    rolloverBonus: computed.rolloverBonus,
    pendingTotal: computed.pendingTotal,
    pendingCount: computed.pendingCount,
    paidTotal: computed.paidTotal,
    totalBills: computed.totalBills,
    pendingItems: computed.pendingItems,
    allPaid: computed.allPaid,
    totalGoalReserved: computed.totalGoalReserved,
    loading,
    updateData,
    clearAll,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
  };
};

export const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
