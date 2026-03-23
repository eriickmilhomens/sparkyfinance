import { clearUserLocalData, markDemoLocalDataOwner } from "@/lib/userLocalData";

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

  // Expense transactions spread across different days
  const numExpenses = rand(12, 22);
  let remainingExpenses = expenses;
  for (let i = 0; i < numExpenses; i++) {
    const isLast = i === numExpenses - 1;
    const cat = pick(CATEGORIES);
    const maxAmt = isLast ? remainingExpenses : Math.min(remainingExpenses, rand(15, Math.floor(expenses * 0.2)));
    const amount = isLast ? remainingExpenses : Math.max(5, maxAmt);
    remainingExpenses = Math.max(0, remainingExpenses - amount);
    const day = rand(1, Math.min(now.getDate(), 28));
    txs.push({
      id: uuid(),
      date: new Date(year, month, day, rand(8, 22), rand(0, 59)).toISOString(),
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

  return selected.map((bank) => {
    const limit = Math.min(rand(2000, 10000), 15000);
    const used = rand(Math.floor(limit * 0.15), Math.floor(limit * 0.55));
    const numTxs = rand(3, 6);
    const txs: any[] = [];
    let remaining = used;
    for (let i = 0; i < numTxs; i++) {
      const isLast = i === numTxs - 1;
      const cat = pick(CATEGORIES);
      const amount = isLast ? remaining : rand(10, Math.floor(remaining * 0.5));
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

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthName = lastMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

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
      paidInvoices: [
        { month: lastMonthName, amount: rand(200, 1500), paidAt: lastMonth.toISOString() },
      ],
      futureInvoices: [
        { month: "Próximo mês", amount: rand(100, 800) },
      ],
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
    budget: rand(Math.floor(expenses * pcts[i] * 0.9), Math.floor(expenses * pcts[i] * 1.6)),
    spent: rand(Math.floor(expenses * pcts[i] * 0.2), Math.floor(expenses * pcts[i] * 0.95)),
  }));
}

function generateGoals(): any[] {
  const templates = [
    { type: "emergency", name: "Reserva de Emergência" },
    { type: "travel", name: "Viagem de Férias" },
    { type: "investment", name: "Investimento CDB" },
    { type: "personal", name: "Notebook Novo" },
  ];
  const num = rand(2, 4);
  return [...templates].sort(() => Math.random() - 0.5).slice(0, num).map((t) => {
    const target = rand(1000, 8000);
    return {
      id: uuid(),
      ...t,
      targetAmount: Math.min(target, 15000),
      savedAmount: rand(Math.floor(target * 0.1), Math.floor(target * 0.7)),
    };
  });
}

interface GeneratedSub {
  id: string;
  name: string;
  logo: string;
  amount: number;
  dueDay: number;
  paid: boolean;
  color: string;
}

function generateSubscriptions(): { subs: GeneratedSub[]; paidBillIds: string[] } {
  const SUBS_POOL = [
    { name: "Netflix", logo: "N", color: "bg-red-600", amount: [32.90, 39.90, 55.90] },
    { name: "Spotify", logo: "S", color: "bg-green-500", amount: [21.90, 34.90] },
    { name: "Disney+", logo: "D+", color: "bg-blue-700", amount: [27.90, 33.90, 43.90] },
    { name: "Amazon Prime", logo: "AP", color: "bg-sky-500", amount: [14.90, 19.90] },
    { name: "YouTube Premium", logo: "YT", color: "bg-red-500", amount: [24.90, 34.90] },
    { name: "iCloud", logo: "iC", color: "bg-gray-500", amount: [3.50, 9.90, 34.90] },
    { name: "HBO Max", logo: "HB", color: "bg-purple-700", amount: [29.90, 34.90, 49.90] },
    { name: "Crunchyroll", logo: "CR", color: "bg-orange-500", amount: [14.99, 24.99] },
    { name: "Xbox Game Pass", logo: "XB", color: "bg-green-600", amount: [29.90, 44.90] },
    { name: "PlayStation Plus", logo: "PS", color: "bg-blue-600", amount: [34.90, 49.90] },
    { name: "Adobe", logo: "Ad", color: "bg-red-700", amount: [43.00, 109.00] },
    { name: "ChatGPT Plus", logo: "AI", color: "bg-emerald-600", amount: [100.00] },
  ];

  const numSubs = rand(3, 6);
  const selected = [...SUBS_POOL].sort(() => Math.random() - 0.5).slice(0, numSubs);
  const paidBillIds: string[] = [];

  const subs = selected.map((s) => {
    const id = uuid();
    const isPaid = Math.random() > 0.5;
    if (isPaid) paidBillIds.push(id);
    return {
      id,
      name: s.name,
      logo: s.logo,
      amount: pick(s.amount),
      dueDay: pick([1, 5, 10, 15, 20, 25, 28]),
      paid: isPaid,
      color: s.color,
    };
  });

  return { subs, paidBillIds };
}

export function seedDemoData() {
  clearUserLocalData();
  markDemoLocalDataOwner();
  localStorage.setItem("sparky-demo-seed-version", Date.now().toString());

  const income = rand(3500, 7500);
  const expenses = rand(Math.floor(income * 0.35), Math.floor(income * 0.65));
  const balance = Math.min(rand(Math.floor(income * 0.7), Math.floor(income * 1.3)), 15000);
  const { subs, paidBillIds } = generateSubscriptions();
  const unpaidSubsTotal = subs
    .filter(s => !paidBillIds.includes(s.id))
    .reduce((sum, s) => sum + s.amount, 0);
  const scheduled = Math.round(unpaidSubsTotal);
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
  localStorage.setItem("sparky-subscriptions", JSON.stringify(subs));
  localStorage.setItem("sparky-paid-bills", JSON.stringify(paidBillIds));
  localStorage.removeItem("sparky-chat-history");
  localStorage.removeItem("sparky-chat-history-demo");

  // Dispatch event to notify all listeners
  window.dispatchEvent(new Event("sparky-data-cleared"));
}
