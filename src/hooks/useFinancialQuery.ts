import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useCallback, useMemo } from "react";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
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

const isDemo = () => localStorage.getItem("sparky-demo-mode") === "true";

const STORAGE_KEY = "sparky-financial-data";

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
    type: t.type as "income" | "expense",
    category: t.category,
    cardId: t.card_id || undefined,
  }));

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let income = 0;
  let expenses = 0;
  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      if (t.type === "income") income += t.amount;
      else expenses += t.amount;
    }
  });

  return { balance: income - expenses, income, expenses, scheduled: 0, transactions };
}

export const useFinancialQuery = () => {
  const queryClient = useQueryClient();
  const userIdRef = useRef<string | null>(null);

  const queryResult = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchFinancialData,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    placeholderData: defaultData,
  });

  const data = queryResult.data ?? defaultData;
  const loading = queryResult.isLoading;

  // Realtime subscription for instant updates
  useEffect(() => {
    if (isDemo()) return;

    const channel = supabase
      .channel("transactions-realtime-query")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) userIdRef.current = user.id;
    });

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Demo mode: persist to localStorage
  useEffect(() => {
    if (isDemo() && queryResult.data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queryResult.data));
    }
  }, [queryResult.data]);

  // Demo events
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

  // Computed values
  const computed = useMemo(() => {
    // Read subscriptions for A Pagar
    let unpaidSubsTotal = 0;
    try {
      const subs = JSON.parse(localStorage.getItem("sparky-subscriptions") || "[]");
      const paidBills = JSON.parse(localStorage.getItem("sparky-paid-bills") || "[]");
      unpaidSubsTotal = subs
        .filter((s: any) => !paidBills.includes(s.id))
        .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
    } catch {}

    const aPagar = data.scheduled > 0 ? data.scheduled : unpaidSubsTotal;
    const available = data.balance - aPagar;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const today = now.getDate();
    const daysLeft = Math.max(1, daysInMonth - today);

    // Reserve percentage from user settings
    let reservePct = 0.20;
    try { reservePct = parseInt(localStorage.getItem("sparky-reserve-pct") || "20") / 100; } catch {}

    const reserve = Math.max(0, data.balance * reservePct);
    const spendablePool = Math.max(0, data.balance - reserve - aPagar);

    // 30% accumulation rule
    const ACCUMULATION_RATE = 0.30;
    const expectedDailySpend = spendablePool / daysInMonth;
    const pastDays = Math.max(1, today);
    const actualDailySpend = data.expenses > 0 ? data.expenses / pastDays : 0;
    const savedPerDay = Math.max(0, expectedDailySpend - actualDailySpend);
    const accumulatedSavings = savedPerDay * pastDays * ACCUMULATION_RATE;
    const adjustedPool = Math.max(0, spendablePool - accumulatedSavings);
    const dailyBudget = daysLeft > 0 ? adjustedPool / daysLeft : 0;

    return { available, daysLeft, dailyBudget };
  }, [data]);

  // Mutations with optimistic updates
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
    onSuccess: () => {
      if (!isDemo()) queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (isDemo()) {
        queryClient.setQueryData<FinancialData>(QUERY_KEY, (old) => {
          if (!old) return old!;
          const oldTx = old.transactions.find(t => t.id === id);
          if (!oldTx) return old;
          const newAmount = updates.amount ?? oldTx.amount;
          const diff = newAmount - oldTx.amount;
          const newTransactions = old.transactions.map(t => t.id === id ? { ...t, ...updates } : t);
          let newIncome = old.income;
          let newExpenses = old.expenses;
          if (oldTx.type === "income") newIncome += diff;
          else newExpenses += diff;
          return { ...old, transactions: newTransactions, income: Math.max(0, newIncome), expenses: Math.max(0, newExpenses), balance: Math.max(0, newIncome) - Math.max(0, newExpenses) };
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
      if (!isDemo()) queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) {
        queryClient.setQueryData<FinancialData>(QUERY_KEY, (old) => {
          if (!old) return old!;
          const tx = old.transactions.find(t => t.id === id);
          if (!tx) return old;
          const newTransactions = old.transactions.filter(t => t.id !== id);
          const newIncome = tx.type === "income" ? old.income - tx.amount : old.income;
          const newExpenses = tx.type === "expense" ? old.expenses - tx.amount : old.expenses;
          return { ...old, transactions: newTransactions, income: Math.max(0, newIncome), expenses: Math.max(0, newExpenses), balance: Math.max(0, newIncome) - Math.max(0, newExpenses) };
        });
        return;
      }

      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (!isDemo()) queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const addTransaction = useCallback(async (tx: Omit<Transaction, "id">) => {
    return addMutation.mutateAsync(tx);
  }, [addMutation.mutateAsync]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    return updateMutation.mutateAsync({ id, updates });
  }, [updateMutation.mutateAsync]);

  const deleteTransaction = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation.mutateAsync]);

  const updateData = useCallback(async (partial: Partial<FinancialData>) => {
    if (isDemo()) {
      queryClient.setQueryData<FinancialData>(QUERY_KEY, (old) => ({ ...(old ?? defaultData), ...partial }));
      return;
    }

    if (partial.transactions) {
      const currentIds = new Set(data.transactions.map(t => t.id));
      const newIds = new Set(partial.transactions.map(t => t.id));
      const toInsert = partial.transactions.filter(t => !currentIds.has(t.id));
      const toDelete = data.transactions.filter(t => !newIds.has(t.id));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const tx of toInsert) {
        await supabase.from("transactions").insert({
          user_id: user.id, date: tx.date, description: tx.description,
          amount: tx.amount, type: tx.type, category: tx.category, card_id: tx.cardId || null,
        });
      }
      for (const tx of toDelete) {
        await supabase.from("transactions").delete().eq("id", tx.id);
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  }, [data.transactions, queryClient]);

  const clearAll = useCallback(async () => {
    if (isDemo()) {
      queryClient.setQueryData<FinancialData>(QUERY_KEY, { ...defaultData });
      const keys = [
        "sparky-balance", "sparky-transactions", "sparky-cards",
        "sparky-credit-cards", "sparky-budget", "sparky-goals",
        "sparky-chat-history", "sparky-investments", "sparky-planning",
        "sparky-income", "sparky-expenses", "sparky-sync-data",
        "sparky-open-finance-cache", "sparky-chat-style",
        "sparky-investment-goals", "sparky-points-log",
        "sparky-paid-bills", STORAGE_KEY,
      ];
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      window.dispatchEvent(new Event("sparky-data-cleared"));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("transactions").delete().eq("user_id", user.id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  }, [queryClient]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  return {
    data,
    available: computed.available,
    daysLeft: computed.daysLeft,
    dailyBudget: computed.dailyBudget,
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
