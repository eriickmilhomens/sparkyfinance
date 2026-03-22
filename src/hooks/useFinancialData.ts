import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const STORAGE_KEY = "sparky-financial-data";

const defaultData: FinancialData = {
  balance: 0,
  income: 0,
  expenses: 0,
  scheduled: 0,
  transactions: [],
};

const isDemo = () => localStorage.getItem("sparky-demo-mode") === "true";

export const useFinancialData = () => {
  const [data, setData] = useState<FinancialData>(() => {
    if (isDemo()) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return { ...defaultData };
  });
  const [loading, setLoading] = useState(!isDemo());
  const userIdRef = useRef<string | null>(null);

  // Fetch transactions from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (isDemo()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      const { data: txs, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Transactions fetch error:", error.message);
        return;
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

      // Compute current month totals
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

      const balance = income - expenses;

      setData({ balance, income, expenses, scheduled: 0, transactions });
    } catch (err) {
      console.error("Financial data fetch exception:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + realtime subscription
  useEffect(() => {
    if (isDemo()) {
      setLoading(false);
      return;
    }

    fetchFromSupabase();

    // Realtime subscription
    const channel = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        fetchFromSupabase();
      })
      .subscribe();

    // Also re-fetch on auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchFromSupabase();
    });

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [fetchFromSupabase]);

  // Demo mode: persist to localStorage
  useEffect(() => {
    if (isDemo()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  // Listen for demo data cleared events
  useEffect(() => {
    if (!isDemo()) return;
    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setData({ ...defaultData });
      else { try { setData(JSON.parse(stored)); } catch {} }
    };
    window.addEventListener("storage", handler);
    window.addEventListener("sparky-data-cleared", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("sparky-data-cleared", handler);
    };
  }, []);

  const available = data.balance - data.scheduled;

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const today = new Date().getDate();
  const daysLeft = Math.max(1, daysInMonth - today);

  const BUDGET_PERCENT = 0.20;
  const spendablePool = Math.max(0, available * BUDGET_PERCENT);
  const pastDays = Math.max(1, today);
  const idealDailySpend = (available * BUDGET_PERCENT) / daysInMonth;
  const actualDailySpend = data.expenses > 0 ? data.expenses / pastDays : 0;
  const savedSoFar = Math.max(0, (idealDailySpend - actualDailySpend) * pastDays);
  const adjustedPool = Math.max(0, spendablePool - savedSoFar);
  const dailyBudget = daysLeft > 0 ? adjustedPool / daysLeft : 0;

  // Add transaction to Supabase
  const addTransaction = useCallback(async (tx: Omit<Transaction, "id">) => {
    if (isDemo()) {
      const newTx = { ...tx, id: crypto.randomUUID() };
      setData(prev => {
        const newTransactions = [newTx, ...prev.transactions];
        const newIncome = tx.type === "income" ? prev.income + tx.amount : prev.income;
        const newExpenses = tx.type === "expense" ? prev.expenses + tx.amount : prev.expenses;
        const newBalance = tx.type === "income" ? prev.balance + tx.amount : prev.balance - tx.amount;
        return { ...prev, transactions: newTransactions, income: newIncome, expenses: newExpenses, balance: newBalance };
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
    // Realtime will refresh, but also fetch immediately
    await fetchFromSupabase();
    return inserted?.id;
  }, [fetchFromSupabase]);

  // Update transaction
  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (isDemo()) {
      setData(prev => {
        const oldTx = prev.transactions.find(t => t.id === id);
        if (!oldTx) return prev;
        const newAmount = updates.amount ?? oldTx.amount;
        const diff = newAmount - oldTx.amount;
        const newTransactions = prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t);
        let newBalance = prev.balance;
        let newIncome = prev.income;
        let newExpenses = prev.expenses;
        if (oldTx.type === "income") { newBalance += diff; newIncome += diff; }
        else { newBalance -= diff; newExpenses += diff; }
        return { ...prev, transactions: newTransactions, balance: newBalance, income: Math.max(0, newIncome), expenses: Math.max(0, newExpenses) };
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
    await fetchFromSupabase();
  }, [fetchFromSupabase]);

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string) => {
    if (isDemo()) {
      setData(prev => {
        const tx = prev.transactions.find(t => t.id === id);
        if (!tx) return prev;
        const newTransactions = prev.transactions.filter(t => t.id !== id);
        const newIncome = tx.type === "income" ? prev.income - tx.amount : prev.income;
        const newExpenses = tx.type === "expense" ? prev.expenses - tx.amount : prev.expenses;
        const newBalance = tx.type === "income" ? prev.balance - tx.amount : prev.balance + tx.amount;
        return { ...prev, transactions: newTransactions, income: Math.max(0, newIncome), expenses: Math.max(0, newExpenses), balance: newBalance };
      });
      return;
    }

    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    await fetchFromSupabase();
  }, [fetchFromSupabase]);

  // Legacy updateData for demo compatibility
  const updateData = useCallback((partial: Partial<FinancialData>) => {
    if (isDemo()) {
      setData(prev => ({ ...prev, ...partial }));
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (isDemo()) {
      setData({ ...defaultData });
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

    // Delete all user transactions from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("transactions").delete().eq("user_id", user.id);
      await fetchFromSupabase();
    }
  }, [fetchFromSupabase]);

  return {
    data,
    available,
    daysLeft,
    dailyBudget,
    loading,
    updateData,
    clearAll,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchFromSupabase,
  };
};

export const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
