export const GOAL_DEPOSIT_TYPE = "goal_deposit" as const;

const GOAL_CATEGORY = "Meta";
const GOAL_DESCRIPTION_PREFIX = "Depósito:";
const SCHEDULED_CATEGORIES = ["Assinatura", "Fatura", "Conta"] as const;
const SCHEDULED_PREFIXES = ["Assinatura:", "Fatura:", "Conta de "] as const;

export interface FinancialTransactionLike {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
}

export const readPaidBillIds = (): string[] => {
  try {
    const stored = localStorage.getItem("sparky-paid-bills");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const isGoalDepositTransaction = (transaction: FinancialTransactionLike) =>
  transaction.type === GOAL_DEPOSIT_TYPE ||
  transaction.category === GOAL_CATEGORY ||
  transaction.description.startsWith(GOAL_DESCRIPTION_PREFIX);

export const isScheduledExpenseTransaction = (transaction: FinancialTransactionLike) =>
  transaction.type === "expense" &&
  !isGoalDepositTransaction(transaction) &&
  (SCHEDULED_CATEGORIES.includes(transaction.category as (typeof SCHEDULED_CATEGORIES)[number]) ||
    SCHEDULED_PREFIXES.some((prefix) => transaction.description.startsWith(prefix)));

export const isDiscretionaryExpenseTransaction = (transaction: FinancialTransactionLike) =>
  transaction.type === "expense" &&
  !isGoalDepositTransaction(transaction) &&
  !isScheduledExpenseTransaction(transaction);

const isInMonth = (transaction: FinancialTransactionLike, now: Date) => {
  const date = new Date(transaction.date);
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

export const getGoalReservedTotal = (transactions: FinancialTransactionLike[]) =>
  transactions.filter(isGoalDepositTransaction).reduce((sum, transaction) => sum + transaction.amount, 0);

export const getPendingExpenseSummary = (
  transactions: FinancialTransactionLike[],
  options: { now?: Date; paidBillIds?: string[] } = {},
) => {
  const now = options.now ?? new Date();
  const paidSet = new Set(options.paidBillIds ?? []);

  const bills = transactions.filter(
    (transaction) => isInMonth(transaction, now) && isScheduledExpenseTransaction(transaction),
  );

  const paidBills = bills.filter((bill) => bill.id && paidSet.has(bill.id));
  const pendingBills = bills.filter((bill) => !bill.id || !paidSet.has(bill.id));

  const paidTotal = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
  const pendingTotal = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);

  return {
    bills,
    paidBills,
    pendingBills,
    paidTotal,
    pendingTotal,
    pendingCount: pendingBills.length,
    allPaid: pendingBills.length === 0,
  };
};

export const getNormalizedMonthlyTotals = (
  transactions: FinancialTransactionLike[],
  options: { now?: Date; paidBillIds?: string[] } = {},
) => {
  const now = options.now ?? new Date();
  const paidSet = new Set(options.paidBillIds ?? []);

  let income = 0;
  let expenses = 0;

  transactions.forEach((transaction) => {
    if (!isInMonth(transaction, now)) return;

    if (transaction.type === "income") {
      income += transaction.amount;
      return;
    }

    if (isDiscretionaryExpenseTransaction(transaction)) {
      expenses += transaction.amount;
      return;
    }

    if (isScheduledExpenseTransaction(transaction) && transaction.id && paidSet.has(transaction.id)) {
      expenses += transaction.amount;
    }
  });

  return {
    income,
    expenses,
    balance: income - expenses,
  };
};

export const getDailyBudget = (
  balance: number,
  pendingTotal: number,
  reservePct: number,
  now: Date = new Date(),
) => {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate());
  const reserve = Math.max(0, balance * reservePct);
  const spendablePool = Math.max(0, balance - pendingTotal - reserve);

  return {
    reserve,
    daysLeft,
    dailyBudget: daysLeft > 0 ? spendablePool / daysLeft : 0,
  };
};