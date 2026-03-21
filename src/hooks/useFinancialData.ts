import { useState, useEffect, useCallback } from "react";

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

export const useFinancialData = () => {
  const [data, setData] = useState<FinancialData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { ...defaultData };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Listen for storage changes (e.g. clear from another component)
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setData({ ...defaultData });
      } else {
        try { setData(JSON.parse(stored)); } catch {}
      }
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

  // Hidden savings: deduct unspent days from pool (user doesn't see this)
  const BUDGET_PERCENT = 0.20;
  const spendablePool = Math.max(0, available * BUDGET_PERCENT);
  // Calculate how much was actually spent today-ish to simulate daily savings
  const pastDays = Math.max(1, today);
  const idealDailySpend = (available * BUDGET_PERCENT) / daysInMonth;
  const actualDailySpend = data.expenses > 0 ? data.expenses / pastDays : 0;
  const savedSoFar = Math.max(0, (idealDailySpend - actualDailySpend) * pastDays);
  const adjustedPool = Math.max(0, spendablePool - savedSoFar);
  const dailyBudget = daysLeft > 0 ? adjustedPool / daysLeft : 0;

  const updateData = useCallback((partial: Partial<FinancialData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const clearAll = useCallback(() => {
    setData({ ...defaultData });
    // Also clear legacy keys
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
  }, []);

  return {
    data,
    available,
    daysLeft,
    dailyBudget,
    updateData,
    clearAll,
  };
};

export const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
