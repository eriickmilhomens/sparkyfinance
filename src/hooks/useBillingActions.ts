import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialData } from "@/hooks/useFinancialData";
import { usePoints } from "@/hooks/usePoints";
import {
  clearPaidBillState,
  loadCreditCards,
  loadSubscriptions,
  saveCreditCards,
  saveSubscriptions,
  setPaidBillState,
} from "@/lib/billing";
import type { Transaction } from "@/hooks/useFinancialQuery";

const FINANCIAL_QUERY_KEY = ["financial-data"] as const;

const findPaymentTransaction = (
  transactions: Transaction[],
  description: string,
  category: string,
) => {
  return [...transactions]
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.description === description &&
        transaction.category === category,
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

export const useBillingActions = () => {
  const queryClient = useQueryClient();
  const { data, addTransaction, deleteTransaction } = useFinancialData();
  const { awardPoints, removePoints } = usePoints();

  const syncFinancialState = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEY }),
      queryClient.refetchQueries({ queryKey: FINANCIAL_QUERY_KEY, type: "active" }),
    ]);
  }, [queryClient]);

  const payPlannedExpense = useCallback(
    async (billId: string, description: string) => {
      setPaidBillState(billId, true);
      await awardPoints("bill_paid", `Pagou: ${description}`);
      await syncFinancialState();
    },
    [awardPoints, syncFinancialState],
  );

  const paySubscription = useCallback(
    async (subscriptionId: string) => {
      const subscriptions = loadSubscriptions();
      const subscription = subscriptions.find((item) => item.id === subscriptionId);

      if (!subscription) {
        throw new Error("Assinatura não encontrada.");
      }

      if (subscription.paid) {
        return subscription;
      }

      const previousSubscriptions = subscriptions;
      const optimisticSubscriptions = subscriptions.map((item) =>
        item.id === subscriptionId ? { ...item, paid: true } : item,
      );

      saveSubscriptions(optimisticSubscriptions);
      clearPaidBillState(subscriptionId);

      try {
        const paymentTransactionId = await addTransaction({
          date: new Date().toISOString(),
          description: `Assinatura: ${subscription.name}`,
          amount: subscription.amount,
          type: "expense",
          category: "Assinatura",
        });

        saveSubscriptions(
          optimisticSubscriptions.map((item) =>
            item.id === subscriptionId ? { ...item, paymentTransactionId } : item,
          ),
        );

        await awardPoints("bill_paid", `Pagou assinatura: ${subscription.name}`);
        await syncFinancialState();
        return subscription;
      } catch (error) {
        saveSubscriptions(previousSubscriptions);
        await syncFinancialState();
        throw error;
      }
    },
    [addTransaction, awardPoints, syncFinancialState],
  );

  const unpaySubscription = useCallback(
    async (subscriptionId: string) => {
      const subscriptions = loadSubscriptions();
      const subscription = subscriptions.find((item) => item.id === subscriptionId);

      if (!subscription) {
        throw new Error("Assinatura não encontrada.");
      }

      if (!subscription.paid) {
        return subscription;
      }

      const previousSubscriptions = subscriptions;
      const revertedSubscriptions = subscriptions.map((item) =>
        item.id === subscriptionId ? { ...item, paid: false, paymentTransactionId: undefined } : item,
      );

      saveSubscriptions(revertedSubscriptions);
      clearPaidBillState(subscriptionId);

      try {
        const paymentDescription = `Assinatura: ${subscription.name}`;
        const paymentTransaction = subscription.paymentTransactionId
          ? { id: subscription.paymentTransactionId }
          : findPaymentTransaction(data.transactions, paymentDescription, "Assinatura");

        if (paymentTransaction?.id) {
          await deleteTransaction(paymentTransaction.id);
        }

        await removePoints("bill_paid", `Pagou assinatura: ${subscription.name}`);
        await syncFinancialState();
        return subscription;
      } catch (error) {
        saveSubscriptions(previousSubscriptions);
        await syncFinancialState();
        throw error;
      }
    },
    [data.transactions, deleteTransaction, removePoints, syncFinancialState],
  );

  const payCardInvoice = useCallback(
    async (cardInvoiceId: string, customAmount?: number) => {
      const cardId = cardInvoiceId.replace(/^card-invoice-/, "");
      const cards = loadCreditCards();
      const card = cards.find((item) => item.id === cardId);

      if (!card || card.invoiceAmount <= 0) {
        throw new Error("Não há fatura a pagar.");
      }

      const amount = customAmount ?? card.invoiceAmount;

      if (!amount || amount <= 0) {
        throw new Error("Informe um valor válido.");
      }

      if (amount > card.invoiceAmount) {
        throw new Error("O valor não pode ser maior que a fatura.");
      }

      if (data.balance < amount) {
        throw new Error("Saldo insuficiente para pagar a fatura.");
      }

      const previousCards = cards;
      const now = new Date();
      const remaining = Math.max(0, card.invoiceAmount - amount);
      const monthLabel = now.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      const dateLabel = now.toLocaleDateString("pt-BR");

      saveCreditCards(
        cards.map((item) =>
          item.id === cardId
            ? {
                ...item,
                invoiceAmount: remaining,
                usedAmount: Math.max(0, item.usedAmount - amount),
                paidInvoices: [...item.paidInvoices, { month: monthLabel, amount, paidAt: dateLabel }],
                transactions: remaining === 0 ? [] : item.transactions,
              }
            : item,
        ),
      );

      clearPaidBillState(`card-invoice-${cardId}`);

      try {
        await addTransaction({
          date: now.toISOString(),
          description: `Fatura: ${card.cardName || card.bankName}`,
          amount,
          type: "expense",
          category: "Fatura",
        });

        await awardPoints("bill_paid", `Fatura: ${card.cardName || card.bankName}`);
        await syncFinancialState();

        return {
          amount,
          remaining,
          cardName: card.cardName || card.bankName,
        };
      } catch (error) {
        saveCreditCards(previousCards);
        await syncFinancialState();
        throw error;
      }
    },
    [addTransaction, awardPoints, data.balance, syncFinancialState],
  );

  return {
    payPlannedExpense,
    paySubscription,
    unpaySubscription,
    payCardInvoice,
  };
};
