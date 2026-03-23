import { useSyncExternalStore } from "react";

export interface BillingSubscription {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  paid: boolean;
}

export interface BillingCard {
  id: string;
  bankName: string;
  cardName: string;
  invoiceAmount: number;
  usedAmount: number;
  dueDay: number;
}

export interface BillingSnapshot {
  paidBillIds: string[];
  subscriptions: BillingSubscription[];
  cards: BillingCard[];
}

const EMPTY_SNAPSHOT: BillingSnapshot = {
  paidBillIds: [],
  subscriptions: [],
  cards: [],
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

let cachedSerialized = JSON.stringify(EMPTY_SNAPSHOT);
let cachedSnapshot = EMPTY_SNAPSHOT;

const getSnapshot = (): BillingSnapshot => {
  const nextSnapshot: BillingSnapshot = {
    paidBillIds: readJson<string[]>("sparky-paid-bills", []),
    subscriptions: readJson<BillingSubscription[]>("sparky-subscriptions", []),
    cards: readJson<BillingCard[]>("sparky-credit-cards", []),
  };

  const serialized = JSON.stringify(nextSnapshot);
  if (serialized === cachedSerialized) {
    return cachedSnapshot;
  }

  cachedSerialized = serialized;
  cachedSnapshot = nextSnapshot;
  return cachedSnapshot;
};

const subscribe = (onStoreChange: () => void) => {
  const handler = () => onStoreChange();

  window.addEventListener("storage", handler);
  window.addEventListener("sparky-paid-bills-updated", handler);
  window.addEventListener("sparky-cards-updated", handler);
  window.addEventListener("sparky-data-cleared", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("sparky-paid-bills-updated", handler);
    window.removeEventListener("sparky-cards-updated", handler);
    window.removeEventListener("sparky-data-cleared", handler);
  };
};

export const useBillingSnapshot = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);
