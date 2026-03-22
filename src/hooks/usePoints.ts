import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useFinancialData } from "./useFinancialData";

// Points are scarce — only real financial discipline earns them
export const POINTS_RULES = [
  { id: "bill_paid", label: "Pagar uma conta em dia", points: 3, icon: "💳", desc: "Marque uma conta como paga no app" },
  { id: "save_10", label: "Economizar 10% da renda", points: 5, icon: "🐷", desc: "Ter pelo menos 10% da receita sobrando no mês" },
  { id: "save_20", label: "Economizar 20% da renda", points: 8, icon: "🏆", desc: "Ter pelo menos 20% da receita sobrando no mês" },
  { id: "invest_deposit", label: "Depositar em meta de investimento", points: 4, icon: "📈", desc: "Adicionar qualquer valor a uma meta" },
  { id: "month_green", label: "Fechar mês no verde", points: 10, icon: "✅", desc: "Terminar o mês com saldo positivo e gastos < receita" },
  { id: "streak_7", label: "7 dias registrando gastos", points: 3, icon: "🔥", desc: "Registrar ao menos 1 transação por dia, 7 dias seguidos" },
  { id: "no_impulse", label: "Mês sem compra impulsiva", points: 7, icon: "🧘", desc: "Não ultrapassar o limite diário em nenhum dia do mês" },
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
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const currentPoints = profile?.points || 0;
  const log = getLog();

  const awardPoints = useCallback(async (ruleId: string, description?: string) => {
    const rule = POINTS_RULES.find(r => r.id === ruleId);
    if (!rule) return 0;

    const freshLog = getLog();
    const today = new Date().toISOString().slice(0, 10);
    const monthKey = today.slice(0, 7);

    const monthlyRules = ["save_10", "save_20", "month_green", "no_impulse"];
    if (monthlyRules.includes(ruleId) && freshLog.some(e => e.ruleId === ruleId && e.date.startsWith(monthKey))) return 0;

    if (ruleId === "bill_paid" && description) {
      if (freshLog.some(e => e.ruleId === ruleId && e.date === today && e.description === description)) return 0;
    } else {
      const dailyRules = ["invest_deposit", "streak_7"];
      if (dailyRules.includes(ruleId) && freshLog.some(e => e.ruleId === ruleId && e.date === today)) return 0;
    }

    const entry: PointsEntry = { ruleId, points: rule.points, date: today, description: description || rule.label };
    const newLog = [...freshLog, entry];
    saveLog(newLog);

    const freshPoints = profileRef.current?.points || 0;
    const newTotal = freshPoints + rule.points;
    await updateProfile({ points: newTotal });
    window.dispatchEvent(new Event("sparky-points-updated"));

    return rule.points;
  }, [updateProfile]);

  const removePoints = useCallback(async (ruleId: string, description?: string) => {
    const rule = POINTS_RULES.find(r => r.id === ruleId);
    if (!rule) return 0;

    const freshLog = getLog();
    let idx = -1;
    for (let i = freshLog.length - 1; i >= 0; i--) {
      if (freshLog[i].ruleId === ruleId) {
        if (description && freshLog[i].description !== description) continue;
        idx = i;
        break;
      }
    }
    if (idx === -1) return 0;

    freshLog.splice(idx, 1);
    saveLog(freshLog);

    const freshPoints = profileRef.current?.points || 0;
    const newTotal = Math.max(0, freshPoints - rule.points);
    await updateProfile({ points: newTotal });
    window.dispatchEvent(new Event("sparky-points-updated"));

    return rule.points;
  }, [updateProfile]);

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
    removePoints,
    rules: POINTS_RULES,
    log,
  };
};
