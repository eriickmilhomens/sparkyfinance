import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useCallback, useMemo } from "react";
import {
  getDailyBudget,
  getGoalReservedTotal,
  getNormalizedMonthlyTotals,
  isDiscretionaryExpenseTransaction,
} from "@/lib/financialCalculations";
import { useBillingSnapshot } from "@/hooks/useBillingSnapshot";
import { buildBillingOverview, getSettledTransactionIds } from "@/lib/billingState";

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

const QUERY_KEY = ["financial-data"];
const STORAGE_KEY = "sparky-financial-data";
const isDemo = () => localStorage.getItem("sparky-demo-mode") === "true";

const defaultData: FinancialData = {
  balance: 0,
  income: 0,
  expenses: 0,
  scheduled: 0,
  transactions: [],
};

async function fetchFinancialData(): Promise<FinancialData> {
  if (isDemo()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { ...defaultData };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { ...defaultData };
  const user = session.user;

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
    const date = new Date(transaction.date);
    if (date.getMonth() !== month || date.getFullYear() !== year) return;
    if (transaction.type === "income") income += transaction.amount;
    if (transaction.type === "expense") expenses += transaction.amount;
  });

  return { balance: income - expenses, income, expenses, scheduled: 0, transactions };
}

export const useFinancialQuery = () => {
  const queryClient = useQueryClient();
  const billingSnapshot = useBillingSnapshot();
  const todayKey = new Date().toISOString().slice(0, 10);

  const queryResult = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchFinancialData,
    placeholderData: defaultData,
  });

  const stableNow = useMemo(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now;
  }, [todayKey]);

  const settledTransactionIds = useMemo(
    () => getSettledTransactionIds(queryResult.data?.transactions ?? defaultData.transactions, billingSnapshot, stableNow),
    [queryResult.data?.transactions, billingSnapshot, stableNow],
  );

  const data = useMemo(() => {
    const baseData = queryResult.data ?? defaultData;
    const { income, expenses, balance } = getNormalizedMonthlyTotals(baseData.transactions, {
      now: stableNow,
      paidBillIds: settledTransactionIds,
    });

    return {
      ...baseData,
      income,
      expenses,
      balance,
    };
  }, [queryResult.data, settledTransactionIds, stableNow]);

  const loading = queryResult.isLoading;

  useEffect(() => {
    if (isDemo()) return;

    const channel = supabase
      .channel("transactions-realtime-query")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (isDemo() && queryResult.data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queryResult.data));
    }
  }, [queryResult.data]);

  useEffect(() => {
    if (!isDemo()) return;

    const handler = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    window.addEventListener("storage", handler);
    window.addEventListener("sparky-data-cleared", handler);

    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("sparky-data-cleared", handler);
    };
  }, [queryClient]);

  const computed = useMemo(() => {
    const billingOverview = buildBillingOverview(data.transactions, billingSnapshot, stableNow);
    const pendingTotal = billingOverview.pendingTotal;
    const pendingCount = billingOverview.pendingCount;
    const allPaid = billingOverview.allPaid;
    const totalGoalReserved = getGoalReservedTotal(data.transactions);
    const available = data.balance - pendingTotal - totalGoalReserved;

    let reservePct = 0.2;
    try {
      reservePct = parseInt(localStorage.getItem("sparky-reserve-pct") || "20", 10) / 100;
    } catch {}

    const yesterday = new Date(stableNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    const yesterdayDiscretionary = data.transactions
      .filter(
        (transaction) =>
          isDiscretionaryExpenseTransaction(transaction) &&
          transaction.date.slice(0, 10) === yesterdayKey,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const { dailyBudget: yesterdayBaseBudget } = getDailyBudget(
      data.balance,
      pendingTotal,
      reservePct,
      yesterday,
    );
    const yesterdayUnspent = Math.max(0, yesterdayBaseBudget - yesterdayDiscretionary);
    const { daysLeft, dailyBudget, baseDailyBudget, rolloverBonus } = getDailyBudget(
      data.balance,
      pendingTotal,
      reservePct,
      stableNow,
      yesterdayUnspent,
    );

    return {
      available,
      daysLeft,
      dailyBudget,
      baseDailyBudget,
      rolloverBonus,
      pendingTotal,
      pendingCount,
      allPaid,
      totalGoalReserved,
    };
  }, [data, stableNow, billingSnapshot]);

  const addMutation = useMutation({
    mutationFn: async (tx: Omit<Transaction, "id">) => {
      if (isDemo()) {
        const newTx = { ...tx, id: crypto.randomUUID() };
        queryClient.setQueryData<FinancialData>(QUERY_KEY, (old) => {
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

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Not authenticated");

      const { data: inserted, error } = await supabase
        .from("transactions")
        .insert({
          user_id: session.user.id,
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
    onSuccess: () => {
      if (!isDemo()) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (isDemo()) {
        queryClient.setQueryData<FinancialData>(QUERY_KEY, (old) => {
          if (!old) return old!;
          const oldTx = old.transactions.find((transaction) => transaction.id === id);
          if (!oldTx) return old;

          const newAmount = updates.amount ?? oldTx.amount;
          const diff = newAmount - oldTx.amount;
          const newTransactions = old.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction,
          );

          let newIncome = old.income;
          let newExpenses = old.expenses;
          if (oldTx.type === "income") newIncome += diff;
          else if (oldTx.type === "expense") newExpenses += diff;

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

      const dbUpdates: Record<string, unknown> = {};
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.date !== undefined) dbUpdates.date = updates.date;

      const { error } = await supabase.from("transactions").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (!isDemo()) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) {
        queryClient.setQueryData<FinancialData>(QUERY_KEY, (old) => {
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
      if (!isDemo()) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, "id">) => addMutation.mutateAsync(tx),
    [addMutation],
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) =>
      updateMutation.mutateAsync({ id, updates }),
    [updateMutation],
  );

  const deleteTransaction = useCallback(
    async (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  const updateData = useCallback(
    async (partial: Partial<FinancialData>) => {
      if (isDemo()) {
        queryClient.setQueryData<FinancialData>(QUERY_KEY, (old) => ({
          ...(old ?? defaultData),
          ...partial,
        }));
        return;
      }

      if (!partial.transactions) return;

      const currentIds = new Set(data.transactions.map((transaction) => transaction.id));
      const newIds = new Set(partial.transactions.map((transaction) => transaction.id));
      const toInsert = partial.transactions.filter((transaction) => !currentIds.has(transaction.id));
      const toDelete = data.transactions.filter((transaction) => !newIds.has(transaction.id));

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      for (const transaction of toInsert) {
        await supabase.from("transactions").insert({
          user_id: session.user.id,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          card_id: transaction.cardId || null,
        });
      }

      for (const transaction of toDelete) {
        await supabase.from("transactions").delete().eq("id", transaction.id);
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    [data.transactions, queryClient],
  );

  const clearAll = useCallback(async () => {
    if (isDemo()) {
      queryClient.setQueryData<FinancialData>(QUERY_KEY, { ...defaultData });
      const keys = [
        "sparky-balance",
        "sparky-transactions",
        "sparky-cards",
        "sparky-credit-cards",
        "sparky-budget",
        "sparky-goals",
        "sparky-chat-history",
        "sparky-investments",
        "sparky-planning",
        "sparky-income",
        "sparky-expenses",
        "sparky-sync-data",
        "sparky-open-finance-cache",
        "sparky-chat-style",
        "sparky-investment-goals",
        "sparky-points-log",
        "sparky-paid-bills",
        STORAGE_KEY,
      ];
      keys.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      window.dispatchEvent(new Event("sparky-data-cleared"));
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from("transactions").delete().eq("user_id", session.user.id);
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
