import { describe, expect, it } from "vitest";
import {
  GOAL_DEPOSIT_TYPE,
  getDailyBudget,
  getGoalReservedTotal,
  getNormalizedMonthlyTotals,
  getPendingExpenseSummary,
} from "@/lib/financialCalculations";

const march = "2026-03-10T12:00:00.000Z";
const now = new Date("2026-03-20T12:00:00.000Z");

describe("financialCalculations", () => {
  it("ignora depósito em meta no saldo real e soma apenas no reservado", () => {
    const transactions = [
      { id: "income-1", date: march, description: "Salário", amount: 5000, type: "income", category: "Receita" },
      { id: "expense-1", date: march, description: "Mercado", amount: 800, type: "expense", category: "Alimentação" },
      { id: "goal-1", date: march, description: "Depósito: Reserva", amount: 500, type: GOAL_DEPOSIT_TYPE, category: "Meta" },
    ];

    const totals = getNormalizedMonthlyTotals(transactions, { now, paidBillIds: [] });

    expect(totals.income).toBe(5000);
    expect(totals.expenses).toBe(800);
    expect(totals.balance).toBe(4200);
    expect(getGoalReservedTotal(transactions)).toBe(500);
  });

  it("mantém contas planejadas fora do saldo real até serem pagas", () => {
    const transactions = [
      { id: "income-1", date: march, description: "Salário", amount: 4000, type: "income", category: "Receita" },
      { id: "bill-1", date: march, description: "Conta de luz", amount: 300, type: "expense", category: "Conta" },
      { id: "sub-1", date: march, description: "Assinatura: Streaming", amount: 50, type: "expense", category: "Assinatura" },
    ];

    const unpaidTotals = getNormalizedMonthlyTotals(transactions, { now, paidBillIds: [] });
    const paidTotals = getNormalizedMonthlyTotals(transactions, { now, paidBillIds: ["bill-1", "sub-1"] });
    const pending = getPendingExpenseSummary(transactions, { now, paidBillIds: [] });

    expect(unpaidTotals.balance).toBe(4000);
    expect(paidTotals.balance).toBe(3650);
    expect(pending.pendingTotal).toBe(350);
    expect(pending.pendingCount).toBe(2);
  });

  it("calcula o pode gastar hoje sem descontar metas", () => {
    const { dailyBudget, daysLeft, reserve } = getDailyBudget(4200, 700, 0.2, now);

    expect(daysLeft).toBe(11);
    expect(reserve).toBe(840);
    expect(dailyBudget).toBeCloseTo((4200 - 700 - 840) / 11, 5);
  });
});