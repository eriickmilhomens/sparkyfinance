const LOCAL_DATA_OWNER_KEY = "sparky-data-owner";
const DEMO_DATA_OWNER = "demo";

const USER_LOCAL_DATA_KEYS = [
  "sparky-financial-data",
  "sparky-balance",
  "sparky-transactions",
  "sparky-cards",
  "sparky-credit-cards",
  "sparky-budget",
  "sparky-budgets",
  "sparky-goals",
  "sparky-investments",
  "sparky-investment-goals",
  "sparky-planning",
  "sparky-income",
  "sparky-expenses",
  "sparky-chat-history",
  "sparky-chat-style",
  "sparky-sync-data",
  "sparky-sync-status",
  "sparky-daily-snapshot",
  "sparky-daily-budget-state",
  "sparky-open-finance-cache",
  "sparky-points-log",
  "sparky-paid-bills",
  "sparky-docs",
  "sparky-subscriptions",
  "sparky-current-user-id",
  "sparky-demo-profile",
  "sparky-reserve-pct",
];

const hasStoredUserData = () =>
  USER_LOCAL_DATA_KEYS.some((key) => localStorage.getItem(key) !== null);

export const clearUserLocalData = () => {
  USER_LOCAL_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("sparky-data-cleared"));
};

export const syncLocalDataOwner = (userId: string) => {
  const previousOwner = localStorage.getItem(LOCAL_DATA_OWNER_KEY);

  if (previousOwner !== userId && (previousOwner !== null || hasStoredUserData())) {
    clearUserLocalData();
  }

  localStorage.setItem(LOCAL_DATA_OWNER_KEY, userId);
};

export const markDemoLocalDataOwner = () => {
  localStorage.setItem(LOCAL_DATA_OWNER_KEY, DEMO_DATA_OWNER);
};
