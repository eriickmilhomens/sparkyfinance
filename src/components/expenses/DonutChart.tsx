import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useFinancialData, fmt as fmtCurrency } from "@/hooks/useFinancialData";

const defaultCategories = [
  { name: "Moradia", color: "hsl(217 91% 60%)" },
  { name: "Alimentação", color: "hsl(142 71% 45%)" },
  { name: "Transporte", color: "hsl(38 92% 50%)" },
  { name: "Lazer", color: "hsl(0 84% 60%)" },
  { name: "Outros", color: "hsl(239 84% 67%)" },
];

const fmtNum = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

const DonutChart = () => {
  const { data: financialData } = useFinancialData();
  const totalExpenses = financialData.expenses;

  // Distribute expenses across categories proportionally (placeholder logic)
  const categoryData = totalExpenses > 0
    ? [
        { name: "Moradia", value: Math.round(totalExpenses * 0.35), color: "hsl(217 91% 60%)" },
        { name: "Alimentação", value: Math.round(totalExpenses * 0.25), color: "hsl(142 71% 45%)" },
        { name: "Transporte", value: Math.round(totalExpenses * 0.18), color: "hsl(38 92% 50%)" },
        { name: "Lazer", value: Math.round(totalExpenses * 0.12), color: "hsl(0 84% 60%)" },
        { name: "Outros", value: Math.round(totalExpenses * 0.10), color: "hsl(239 84% 67%)" },
      ]
    : defaultCategories.map(c => ({ ...c, value: 0 }));

  const total = categoryData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="card-zelo fade-in-up">
        <p className="text-xs font-semibold text-muted-foreground mb-1">Distribuição de Gastos</p>
        <p className="text-[11px] text-muted-foreground py-6 text-center">Nenhuma despesa registrada ainda.</p>
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
                  {total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0}%
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
