// Re-export everything from the new React Query-based implementation
// This file exists for backward compatibility with all existing imports
export { useFinancialQuery as useFinancialData, fmt } from "./useFinancialQuery";
export type { Transaction, FinancialData } from "./useFinancialQuery";
