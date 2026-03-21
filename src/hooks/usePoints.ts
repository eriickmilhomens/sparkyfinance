import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useFinancialData } from "./useFinancialData";

// Points are scarce — only real financial discipline earns them
export const POINTS_RULES = [
  { id: "bill_paid", label: "Pagar uma conta em dia", points: 2, icon: "💳", desc: "Marque uma conta como paga no app" },
  { id: "save_10", label: "Economizar 10% da renda", points: 3, icon: "🐷", desc: "Ter pelo menos 10% da receita sobrando no mês" },
  { id: "save_20", label: "Economizar 20% da renda", points: 5, icon: "🏆", desc: "Ter pelo menos 20% da receita sobrando no mês" },
  { id: "invest_deposit", label: "Depositar em meta de investimento", points: 2, icon: "📈", desc: "Adicionar qualquer valor a uma meta" },
  { id: "month_green", label: "Fechar mês no verde", points: 5, icon: "✅", desc: "Terminar o mês com saldo positivo e gastos < receita" },
  { id: "streak_7", label: "7 dias registrando gastos", points: 1, icon: "🔥", desc: "Registrar ao menos 1 transação por dia, 7 dias seguidos" },
  { id: "no_impulse", label: "Mês sem compra impulsiva", points: 3, icon: "🧘", desc: "Não ultrapassar o limite diário em nenhum dia do mês" },
];

const POINTS_LOG_KEY = "sparky-points-log";

interface PointsEntry {
  ruleId: string;
  points: number;
  date: string;
  description: string;
}

const getLog = (): PointsEntry[] => {
  try { return JSON.parse(localStorage.getItem(POINTS_LOG_KEY) || "[]"); } catch { return []; }
};

const saveLog = (log: PointsEntry[]) => {
  localStorage.setItem(POINTS_LOG_KEY, JSON.stringify(log));
};

export const usePoints = () => {
  const { profile, updateProfile, isDemo } = useProfile();
  const { data } = useFinancialData();

  const currentPoints = profile?.points || 0;
  const log = getLog();

  // Check if a rule was already awarded today or this month
  const wasAwardedToday = (ruleId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    return log.some(e => e.ruleId === ruleId && e.date === today);
  };

  const wasAwardedThisMonth = (ruleId: string) => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return log.some(e => e.ruleId === ruleId && e.date.startsWith(monthKey));
  };

  const awardPoints = useCallback(async (ruleId: string, description?: string) => {
    const rule = POINTS_RULES.find(r => r.id === ruleId);
    if (!rule) return 0;

    // Prevent double-awarding
    const monthlyRules = ["save_10", "save_20", "month_green", "no_impulse"];
    if (monthlyRules.includes(ruleId) && wasAwardedThisMonth(ruleId)) return 0;

    const dailyRules = ["bill_paid", "invest_deposit", "streak_7"];
    if (dailyRules.includes(ruleId) && wasAwardedToday(ruleId)) return 0;

    const entry: PointsEntry = {
      ruleId,
      points: rule.points,
      date: new Date().toISOString().slice(0, 10),
      description: description || rule.label,
    };

    const newLog = [...log, entry];
    saveLog(newLog);

    // Update profile points in database
    const newTotal = currentPoints + rule.points;
    if (!isDemo && profile) {
      await updateProfile({ points: newTotal });
    }

    return rule.points;
  }, [currentPoints, profile, isDemo, updateProfile, log]);

  // Calculate monthly earnings
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyEarnings = log
    .filter(e => e.date.startsWith(monthKey))
    .reduce((sum, e) => sum + e.points, 0);

  // Get recent activity
  const recentActivity = log.slice(-10).reverse();

  return {
    currentPoints,
    monthlyEarnings,
    recentActivity,
    awardPoints,
    rules: POINTS_RULES,
    log,
  };
};
