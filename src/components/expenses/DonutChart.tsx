import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useFinancialData, fmt as fmtCurrency } from "@/hooks/useFinancialData";

const CATEGORY_COLORS: Record<string, string> = {
  "Moradia": "hsl(217 91% 60%)",
  "Alimentação": "hsl(142 71% 45%)",
  "Transporte": "hsl(38 92% 50%)",
  "Lazer": "hsl(0 84% 60%)",
  "Contas": "hsl(45 93% 47%)",
  "Internet": "hsl(199 89% 48%)",
  "Mercado": "hsl(142 71% 45%)",
  "Delivery": "hsl(0 72% 51%)",
  "Cartão": "hsl(271 76% 53%)",
  "Transferência": "hsl(217 91% 60%)",
  "Cuidados Pessoais": "hsl(330 81% 60%)",
  "Investimento": "hsl(262 83% 58%)",
  "Outros": "hsl(239 84% 67%)",
};

const getColor = (name: string) => CATEGORY_COLORS[name] || `hsl(${Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360} 70% 55%)`;

const fmtNum = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

const DonutChart = () => {
  const { data: financialData } = useFinancialData();

  const categoryMap = new Map<string, number>();
  financialData.transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      const cat = t.category || "Outros";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
    });

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value, color: getColor(name) }))
    .sort((a, b) => b.value - a.value);

  const total = categoryData.reduce((sum, d) => sum + d.value, 0);

  // Empty state: show a full gray donut
  if (total === 0) {
    const emptyData = [{ name: "Sem dados", value: 1, color: "hsl(0 0% 25%)" }];
    return (
      <div className="card-zelo fade-in-up">
        <p className="text-xs font-semibold text-muted-foreground mb-1">Distribuição de Gastos</p>
        <p className="text-[10px] text-muted-foreground/70 mb-3">Nenhuma despesa registrada ainda.</p>
        <div className="flex items-center justify-center">
          <div className="h-32 w-32 relative opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={emptyData} innerRadius={34} outerRadius={56} paddingAngle={0} dataKey="value" strokeWidth={0}>
                  <Cell fill="hsl(0 0% 25%)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">R$ 0,00</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-zelo fade-in-up">
      <p className="text-xs font-semibold text-muted-foreground mb-1">Distribuição de Gastos</p>
      <p className="text-[10px] text-muted-foreground/70 mb-3">
        Total gasto: <span className="text-foreground font-medium">R$ {fmtNum(total)}</span>
      </p>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="h-32 w-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={34} outerRadius={56} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-1">
            Total: <span className="text-foreground font-bold text-xs tabular-nums">R$ {fmtNum(total)}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2.5 flex-1">
          {categoryData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
              <span className="text-xs text-muted-foreground flex-1">{entry.name}</span>
              <div className="text-right">
                <span className="text-xs font-semibold tabular-nums">R$ {fmtNum(entry.value)}</span>
                <span className="text-[9px] text-muted-foreground ml-1">
                  {((entry.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
