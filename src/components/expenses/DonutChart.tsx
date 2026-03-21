import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useFinancialData } from "@/hooks/useFinancialData";

const PALETTE = [
  "hsl(217 91% 60%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)",
  "hsl(45 93% 47%)", "hsl(199 89% 48%)", "hsl(271 76% 53%)", "hsl(330 81% 60%)",
  "hsl(262 83% 58%)", "hsl(160 60% 45%)", "hsl(20 80% 55%)", "hsl(290 60% 50%)",
  "hsl(50 80% 50%)", "hsl(180 70% 45%)",
];

const GRAY = "hsl(0 0% 22%)";

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
    .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.value - a.value);

  const total = categoryData.reduce((sum, d) => sum + d.value, 0);

  // Always show donut — fully gray when empty, gray slice for "remaining" when partial
  const chartData = total === 0
    ? [{ name: "Sem gastos", value: 1, color: GRAY }]
    : [...categoryData, ...(categoryData.length < 6 ? [{ name: "__gray", value: total * 0.001, color: GRAY }] : [])];

  return (
    <div className="card-zelo fade-in-up border-l-primary">
      <p className="text-xs font-semibold text-muted-foreground mb-1">Distribuição de Gastos</p>
      <p className="text-[10px] text-muted-foreground/70 mb-3">
        {total === 0
          ? "Nenhuma despesa registrada ainda."
          : <>Total gasto: <span className="text-foreground font-medium">R$ {fmtNum(total)}</span></>
        }
      </p>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="h-32 w-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={34}
                  outerRadius={56}
                  paddingAngle={total === 0 ? 0 : 3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={entry.name === "Sem gastos" ? 0.4 : entry.name === "__gray" ? 0.15 : 1} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {total === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">R$ 0,00</span>
              </div>
            )}
          </div>
          {total > 0 && (
            <p className="text-center text-[10px] text-muted-foreground mt-1">
              Total: <span className="text-foreground font-bold text-xs tabular-nums">R$ {fmtNum(total)}</span>
            </p>
          )}
        </div>
        {total > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default DonutChart;
