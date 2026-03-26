import type { BillingCard, BillingSnapshot, BillingSubscription } from "@/hooks/useBillingSnapshot";
import { getPendingExpenseSummary, type FinancialTransactionLike } from "@/lib/financialCalculations";

export const PAID_BILLS_STORAGE_KEY = "sparky-paid-bills";
export const SUBSCRIPTIONS_STORAGE_KEY = "sparky-subscriptions";
export const CREDIT_CARDS_STORAGE_KEY = "sparky-credit-cards";

type StoredSubscription = BillingSubscription & {
  logo?: string;
  color?: string;
  paid?: boolean;
};

type PaidInvoiceRecord = {
  amount?: number;
  paidAt?: string;
  month?: string;
  cycleKey?: string;
};

type StoredCard = BillingCard & {
  paidInvoices?: PaidInvoiceRecord[];
};

export interface BillingOverviewItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  source: "transaction" | "card" | "subscription";
  paid: boolean;
}

export interface BillingOverview {
  pendingBills: BillingOverviewItem[];
  paidBills: BillingOverviewItem[];
  pendingTotal: number;
  paidTotal: number;
  pendingCount: number;
  allPaid: boolean;
  settledTransactionIds: string[];
}

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getBillingCycleKey = (date: Date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const getSubscriptionPaymentId = (subscriptionId: string, date: Date = new Date()) =>
  `subscription:${subscriptionId}:${getBillingCycleKey(date)}`;

export const getCardInvoicePaymentId = (cardId: string, date: Date = new Date()) =>
  `card-invoice:${cardId}:${getBillingCycleKey(date)}`;

const getLegacyCardPaymentId = (cardId: string) => `card-invoice-${cardId}`;

const normalizeDueDate = (dueDay: number, date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(1, dueDay || 1), daysInMonth);

  return new Date(year, month, safeDay, 12, 0, 0, 0).toISOString();
};

const getCardPaidAmount = (card: BillingCard, date: Date) => {
  const history = ((card as StoredCard).paidInvoices ?? []).slice().reverse();
  const cycleKey = getBillingCycleKey(date);
  const cycleRecord = history.find((record) => record.cycleKey === cycleKey);
  const lastRecord = history.find((record) => Number(record.amount) > 0);

  return Number(cycleRecord?.amount ?? lastRecord?.amount ?? 0);
};

export const readPaidBillIds = () => readJson<string[]>(PAID_BILLS_STORAGE_KEY, []);

export const writePaidBillIds = (ids: string[]) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  writeJson(PAID_BILLS_STORAGE_KEY, uniqueIds);
  window.dispatchEvent(new Event("sparky-paid-bills-updated"));
  return uniqueIds;
};

export const addPaidBillIds = (ids: string[]) => writePaidBillIds([...readPaidBillIds(), ...ids]);

export const removePaidBillIds = (ids: string[]) => {
  const idsToRemove = new Set(ids);
  return writePaidBillIds(readPaidBillIds().filter((id) => !idsToRemove.has(id)));
};

export const readStoredSubscriptions = () => readJson<StoredSubscription[]>(SUBSCRIPTIONS_STORAGE_KEY, []);

export const writeStoredSubscriptions = (subscriptions: StoredSubscription[]) => {
  writeJson(SUBSCRIPTIONS_STORAGE_KEY, subscriptions);
  window.dispatchEvent(new Event("sparky-subscriptions-updated"));
  return subscriptions;
};

export const readStoredCards = () => readJson<StoredCard[]>(CREDIT_CARDS_STORAGE_KEY, []);

export const writeStoredCards = (cards: StoredCard[]) => {
  writeJson(CREDIT_CARDS_STORAGE_KEY, cards);
  window.dispatchEvent(new Event("sparky-cards-updated"));
  return cards;
};

export const isSubscriptionPaid = (
  subscription: BillingSubscription,
  paidBillIds: string[] | Set<string>,
  date: Date = new Date(),
) => {
  const paidSet = paidBillIds instanceof Set ? paidBillIds : new Set(paidBillIds);

  return (
    Boolean((subscription as StoredSubscription).paid) ||
    paidSet.has(getSubscriptionPaymentId(subscription.id, date)) ||
    paidSet.has(subscription.id)
  );
};

export const isCardInvoicePaid = (
  card: BillingCard,
  paidBillIds: string[] | Set<string>,
  date: Date = new Date(),
) => {
  const paidSet = paidBillIds instanceof Set ? paidBillIds : new Set(paidBillIds);

  return (
    paidSet.has(getCardInvoicePaymentId(card.id, date)) ||
    paidSet.has(getLegacyCardPaymentId(card.id))
  );
};

export const getSettledTransactionIds = (
  transactions: FinancialTransactionLike[],
  snapshot: BillingSnapshot,
  date: Date = new Date(),
) => {
  const explicitPaidIds = snapshot.paidBillIds.filter(
    (id) => !id.startsWith("subscription:") && !id.startsWith("card-invoice:"),
  );
  const resolvedPaidIds = new Set(explicitPaidIds);
  const paidSet = new Set(snapshot.paidBillIds);

  const paidSubscriptionDescriptions = new Set(
    snapshot.subscriptions
      .filter((subscription) => isSubscriptionPaid(subscription, paidSet, date))
      .map((subscription) => `Assinatura: ${subscription.name}`),
  );

  const paidCardDescriptions = new Set(
    snapshot.cards
      .filter(
        (card) =>
          isCardInvoicePaid(card, paidSet, date) ||
          (Number(card.invoiceAmount) === 0 && getCardPaidAmount(card, date) > 0),
      )
      .map((card) => `Fatura: ${card.cardName || card.bankName}`),
  );

  transactions.forEach((transaction) => {
    if (!transaction.id) return;

    if (
      transaction.category === "Assinatura" &&
      paidSubscriptionDescriptions.has(transaction.description)
    ) {
      resolvedPaidIds.add(transaction.id);
    }

    if (transaction.category === "Fatura" && paidCardDescriptions.has(transaction.description)) {
      resolvedPaidIds.add(transaction.id);
    }
  });

  return [...resolvedPaidIds];
};

export const buildBillingOverview = (
  transactions: FinancialTransactionLike[],
  snapshot: BillingSnapshot,
  date: Date = new Date(),
): BillingOverview => {
  const settledTransactionIds = getSettledTransactionIds(transactions, snapshot, date);
  const transactionSummary = getPendingExpenseSummary(transactions, {
    now: date,
    paidBillIds: settledTransactionIds,
  });
  const paidSet = new Set(snapshot.paidBillIds);

  const transactionPending: BillingOverviewItem[] = transactionSummary.pendingBills.map((bill) => ({
    id: bill.id || crypto.randomUUID(),
    description: bill.description,
    amount: bill.amount,
    date: bill.date,
    category: bill.category,
    source: "transaction",
    paid: false,
  }));

  const transactionPaid: BillingOverviewItem[] = transactionSummary.paidBills.map((bill) => ({
    id: bill.id || crypto.randomUUID(),
    description: bill.description,
    amount: bill.amount,
    date: bill.date,
    category: bill.category,
    source: "transaction",
    paid: true,
  }));

  const subscriptionPending: BillingOverviewItem[] = snapshot.subscriptions
    .filter((subscription) => !isSubscriptionPaid(subscription, paidSet, date))
    .map((subscription) => ({
      id: subscription.id,
      description: `Assinatura: ${subscription.name}`,
      amount: Number(subscription.amount) || 0,
      date: normalizeDueDate(subscription.dueDay, date),
      category: "Assinatura",
      source: "subscription",
      paid: false,
    }));

  const subscriptionPaid: BillingOverviewItem[] = snapshot.subscriptions
    .filter((subscription) => isSubscriptionPaid(subscription, paidSet, date))
    .map((subscription) => ({
      id: subscription.id,
      description: `Assinatura: ${subscription.name}`,
      amount: Number(subscription.amount) || 0,
      date: normalizeDueDate(subscription.dueDay, date),
      category: "Assinatura",
      source: "subscription",
      paid: true,
    }));

  const cardPending: BillingOverviewItem[] = snapshot.cards
    .filter((card) => {
      const amount = Number(card.invoiceAmount) || 0;
      return amount > 0 && !isCardInvoicePaid(card, paidSet, date);
    })
    .map((card) => ({
      id: `card-invoice-${card.id}`,
      description: `Fatura: ${card.cardName || card.bankName}`,
      amount: Number(card.invoiceAmount) || 0,
      date: normalizeDueDate(card.dueDay, date),
      category: "Fatura",
      source: "card" as const,
      paid: false,
    }));

  const cardPaid: BillingOverviewItem[] = snapshot.cards
    .filter(
      (card) =>
        isCardInvoicePaid(card, paidSet, date) ||
        (Number(card.invoiceAmount) === 0 && getCardPaidAmount(card, date) > 0),
    )
    .map((card) => ({
      id: `card-invoice-${card.id}`,
      description: `Fatura: ${card.cardName || card.bankName}`,
      amount: getCardPaidAmount(card, date),
      date: normalizeDueDate(card.dueDay, date),
      category: "Fatura",
      source: "card" as const,
      paid: true,
    }))
    .filter((card) => card.amount > 0);

  const pendingBills = [...transactionPending, ...subscriptionPending, ...cardPending].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
  const paidBills = [...subscriptionPaid, ...cardPaid, ...transactionPaid].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );

  const pendingTotal = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidTotal = paidBills.reduce((sum, bill) => sum + bill.amount, 0);

  return {
    pendingBills,
    paidBills,
    pendingTotal,
    paidTotal,
    pendingCount: pendingBills.length,
    allPaid: pendingBills.length === 0,
    settledTransactionIds,
  };
};