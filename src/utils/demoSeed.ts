/**
 * Generates random realistic financial data for demo mode.
 * Each session produces different values.
 */

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const uuid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const CATEGORIES = [
  "Alimentação", "Transporte", "Moradia", "Lazer", "Saúde",
  "Educação", "Contas", "Cuidados Pessoais", "Transferência", "Outros",
];

const DESCRIPTIONS: Record<string, string[]> = {
  "Alimentação": ["Supermercado Extra", "iFood", "Padaria Real", "Restaurante Sabor", "Açaí Mania"],
  "Transporte": ["Uber", "99", "Combustível Shell", "Estacionamento", "Recarga Bilhete"],
  "Moradia": ["Aluguel", "Condomínio", "IPTU", "Manutenção casa"],
  "Lazer": ["Netflix", "Spotify", "Cinema", "Bar com amigos", "Ingresso show"],
  "Saúde": ["Farmácia", "Consulta médica", "Academia", "Plano de saúde"],
  "Educação": ["Curso Udemy", "Livro Amazon", "Mensalidade faculdade"],
  "Contas": ["Conta de luz", "Conta de água", "Internet", "Gás"],
  "Cuidados Pessoais": ["Barbearia", "Perfumaria", "Skincare"],
  "Transferência": ["Pix para João", "Pix para Maria", "Transferência bancária"],
  "Outros": ["Presente aniversário", "Doação", "Assinatura app"],
};

function generateTransactions(income: number, expenses: number): any[] {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const txs: any[] = [];

  // Income transactions
  const incomeItems = rand(1, 3);
  let remainingIncome = income;
  for (let i = 0; i < incomeItems; i++) {
    const isLast = i === incomeItems - 1;
    const amount = isLast ? remainingIncome : rand(Math.floor(remainingIncome * 0.3), Math.floor(remainingIncome * 0.7));
    remainingIncome -= amount;
    txs.push({
      id: uuid(),
      date: new Date(year, month, rand(1, 10)).toISOString(),
      description: pick(["Salário", "Freelance", "Transferência recebida", "Comissão", "Rendimentos"]),
      amount,
      type: "income",
      category: "Receita",
    });
  }

  // Expense transactions (spread across categories)
  const numExpenses = rand(8, 18);
  let remainingExpenses = expenses;
  const usedCategories = new Set<string>();
  for (let i = 0; i < numExpenses; i++) {
    const isLast = i === numExpenses - 1;
    const cat = pick(CATEGORIES);
    usedCategories.add(cat);
    const maxAmt = isLast ? remainingExpenses : Math.min(remainingExpenses, rand(15, Math.floor(expenses * 0.25)));
    const amount = isLast ? remainingExpenses : Math.max(5, maxAmt);
    remainingExpenses = Math.max(0, remainingExpenses - amount);
    txs.push({
      id: uuid(),
      date: new Date(year, month, rand(1, Math.min(now.getDate(), 28))).toISOString(),
      description: pick(DESCRIPTIONS[cat] || DESCRIPTIONS["Outros"]),
      amount,
      type: "expense",
      category: cat,
    });
    if (remainingExpenses <= 0 && !isLast) break;
  }

  return txs;
}

function generateCreditCards(): any[] {
  const banks = [
    { bankName: "Nubank", cardName: "Nubank Platinum", cardFlag: "Mastercard" },
    { bankName: "Inter", cardName: "Inter Gold", cardFlag: "Visa" },
    { bankName: "Itaú", cardName: "Itaú Personnalité", cardFlag: "Visa" },
    { bankName: "C6 Bank", cardName: "C6 Carbon", cardFlag: "Mastercard" },
    { bankName: "Bradesco", cardName: "Bradesco Elo", cardFlag: "Elo" },
  ];

  const numCards = rand(1, 3);
  const selected = [...banks].sort(() => Math.random() - 0.5).slice(0, numCards);

  return selected.map(bank => {
    const limit = rand(1500, 8000);
    const used = rand(Math.floor(limit * 0.1), Math.floor(limit * 0.6));
    const numTxs = rand(2, 5);
    const txs: any[] = [];
    let remaining = used;
    for (let i = 0; i < numTxs; i++) {
      const isLast = i === numTxs - 1;
      const cat = pick(CATEGORIES);
      const amount = isLast ? remaining : rand(10, Math.floor(remaining * 0.6));
      remaining = Math.max(0, remaining - amount);
      txs.push({
        id: uuid(),
        desc: pick(DESCRIPTIONS[cat] || DESCRIPTIONS["Outros"]),
        value: amount,
        date: new Date().toISOString(),
        category: cat,
      });
      if (remaining <= 0 && !isLast) break;
    }
    return {
      id: uuid(),
      ...bank,
      cardType: "Crédito",
      limit,
      usedAmount: used,
      invoiceAmount: used,
      dueDay: pick([5, 10, 15, 20, 25]),
      closeDay: pick([1, 5, 10, 15, 20]),
      transactions: txs,
      paidInvoices: [],
      futureInvoices: [],
    };
  });
}

function generateBudgets(expenses: number): any[] {
  const cats = [
    { name: "Moradia", color: "hsl(var(--primary))" },
    { name: "Alimentação", color: "hsl(var(--success))" },
    { name: "Transporte", color: "hsl(var(--warning))" },
    { name: "Lazer", color: "hsl(var(--info))" },
    { name: "Outros", color: "hsl(var(--destructive))" },
  ];
  const pcts = [0.35, 0.25, 0.15, 0.15, 0.10];
  return cats.map((c, i) => ({
    ...c,
    budget: rand(Math.floor(expenses * pcts[i] * 0.8), Math.floor(expenses * pcts[i] * 1.5)),
    spent: rand(0, Math.floor(expenses * pcts[i] * 0.9)),
  }));
}

function generateGoals(): any[] {
  const templates = [
    { type: "emergency", name: "Reserva de Emergência" },
    { type: "travel", name: "Viagem de Férias" },
    { type: "investment", name: "Investimento CDB" },
    { type: "personal", name: "Notebook Novo" },
  ];
  const num = rand(1, 3);
  return [...templates].sort(() => Math.random() - 0.5).slice(0, num).map(t => {
    const target = rand(500, 5000);
    return {
      id: uuid(),
      ...t,
      targetAmount: target,
      savedAmount: rand(Math.floor(target * 0.05), Math.floor(target * 0.65)),
    };
  });
}

export function seedDemoData() {
  const income = rand(2800, 6500);
  const expenses = rand(Math.floor(income * 0.3), Math.floor(income * 0.7));
  const balance = rand(Math.floor(income * 0.6), Math.floor(income * 1.4));
  const scheduled = rand(Math.floor(expenses * 0.2), Math.floor(expenses * 0.6));
  const transactions = generateTransactions(income, expenses);

  const financialData = {
    balance,
    income,
    expenses,
    scheduled,
    transactions,
  };

  localStorage.setItem("sparky-financial-data", JSON.stringify(financialData));
  localStorage.setItem("sparky-credit-cards", JSON.stringify(generateCreditCards()));
  localStorage.setItem("sparky-budgets", JSON.stringify(generateBudgets(expenses)));
  localStorage.setItem("sparky-investment-goals", JSON.stringify(generateGoals()));

  // Clear demo AI chats on each new demo session
  localStorage.removeItem("sparky-chat-history");

  // Dispatch event so hooks pick up the changes
  window.dispatchEvent(new Event("sparky-data-cleared"));
}
