import { type FinancialTransactionLike, getPendingExpenseSummary, readPaidBillIds } from "@/lib/financialCalculations";

export const BILLING_SYNC_EVENT = "sparky-billing-updated";

const PAID_BILLS_KEY = "sparky-paid-bills";
const SUBSCRIPTIONS_KEY = "sparky-subscriptions";
const CREDIT_CARDS_KEY = "sparky-credit-cards";

export type BillingSource = "transaction" | "subscription" | "card";

export interface BillingItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  source: BillingSource;
}

export interface SubscriptionRecord {
  id: string;
  name: string;
  logo: string;
  amount: number;
  dueDay: number;
  paid: boolean;
  color: string;
  paymentTransactionId?: string;
}

interface CardTransactionRecord {
  id: string;
  desc: string;
  value: number;
  date: string;
  category: string;
}

interface PaidInvoiceRecord {
  month: string;
  amount: number;
  paidAt: string;
}

interface FutureInvoiceRecord {
  month: string;
  amount: number;
}

export interface CreditCardRecord {
  id: string;
  bankName: string;
  cardName: string;
  cardType?: string;
  cardFlag?: string;
  limit: number;
  usedAmount: number;
  invoiceAmount: number;
  dueDay: number;
  closeDay: number;
  transactions: CardTransactionRecord[];
  paidInvoices: PaidInvoiceRecord[];
  futureInvoices: FutureInvoiceRecord[];
}

const safeParse = <T,>(value: string | null, fallback: T): T => {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const getDueDateIso = (dueDay: number, now: Date) => {
  const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay || 10);
  if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
  return dueDate.toISOString();
};

const parsePtBrDate = (value: string) => {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const emitBillingSync = () => {
  window.dispatchEvent(new Event(BILLING_SYNC_EVENT));
  window.dispatchEvent(new Event("sparky-paid-bills-updated"));
  window.dispatchEvent(new Event("sparky-cards-updated"));
};

export const loadSubscriptions = () =>
  safeParse<SubscriptionRecord[]>(localStorage.getItem(SUBSCRIPTIONS_KEY), []);

export const saveSubscriptions = (subscriptions: SubscriptionRecord[]) => {
  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  emitBillingSync();
};

export const loadCreditCards = () =>
  safeParse<CreditCardRecord[]>(localStorage.getItem(CREDIT_CARDS_KEY), []);

export const saveCreditCards = (cards: CreditCardRecord[]) => {
  localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(cards));
  emitBillingSync();
};

export const setPaidBillState = (id: string, paid: boolean) => {
  const next = new Set(readPaidBillIds());
  if (paid) next.add(id);
  else next.delete(id);

  localStorage.setItem(PAID_BILLS_KEY, JSON.stringify([...next]));
  emitBillingSync();
};

export const clearPaidBillState = (id: string) => {
  setPaidBillState(id, false);
};

export const getBillingSummary = (
  transactions: FinancialTransactionLike[],
  options: { now?: Date; paidBillIds?: string[] } = {},
) => {
  const now = options.now ?? new Date();
  const paidBillIds = options.paidBillIds ?? readPaidBillIds();
  const paidSet = new Set(paidBillIds);
  const txSummary = getPendingExpenseSummary(transactions, { now, paidBillIds });
  const subscriptions = loadSubscriptions();
  const creditCards = loadCreditCards();

  const pendingItems: BillingItem[] = [
    ...txSummary.pendingBills.map((bill) => ({
      id: bill.id || crypto.randomUUID(),
      description: bill.description,
      amount: bill.amount,
      date: bill.date,
      category: bill.category,
      source: "transaction" as const,
    })),
    ...subscriptions
      .filter((subscription) => !subscription.paid)
      .map((subscription) => ({
        id: subscription.id,
        description: `Assinatura: ${subscription.name}`,
        amount: Number(subscription.amount) || 0,
        date: getDueDateIso(subscription.dueDay, now),
        category: "Assinatura",
        source: "subscription" as const,
      })),
    ...creditCards
      .filter((card) => Number(card.invoiceAmount) > 0 && !paidSet.has(`card-invoice-${card.id}`))
      .map((card) => ({
        id: `card-invoice-${card.id}`,
        description: `Fatura: ${card.cardName || card.bankName}`,
        amount: Number(card.invoiceAmount) || 0,
        date: getDueDateIso(card.dueDay, now),
        category: "Fatura",
        source: "card" as const,
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const paidSubscriptionsTotal = subscriptions
    .filter((subscription) => subscription.paid)
    .reduce((sum, subscription) => sum + (Number(subscription.amount) || 0), 0);

  const paidCardsTotal = creditCards.reduce((sum, card) => {
    const paidThisMonth = card.paidInvoices.filter((invoice) => {
      const paidAt = parsePtBrDate(invoice.paidAt);
      return paidAt && paidAt.getMonth() == now.getMonth() && paidAt.getFullYear() == now.getFullYear();
    });
    return sum + paidThisMonth.reduce((invoiceSum, invoice) => invoiceSum + (Number(invoice.amount) || 0), 0);
  }, 0);

  const pendingTotal = pendingItems.reduce((sum, item) => sum + item.amount, 0);
  const paidTotal = txSummary.paidTotal + paidSubscriptionsTotal + paidCardsTotal;

  return {
    pendingItems,
    pendingTotal,
    pendingCount: pendingItems.length,
    paidTotal,
    totalBills: pendingTotal + paidTotal,
    allPaid: pendingItems.length === 0,
  };
};
