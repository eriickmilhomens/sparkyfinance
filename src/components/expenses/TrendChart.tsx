import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface TrendChartProps {
  title: string;
  data: { name: string; value: number }[];
  color: string;
  gradientId: string;
  legend?: string;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

const TrendChart = ({ title, data, color, gradientId, legend }: TrendChartProps) => {
  return (
    <div className="card-zelo fade-in-up">
      <p className="text-xs font-display font-semibold text-muted-foreground mb-1">{title}</p>
      {legend && <p className="text-[10px] text-muted-foreground/70 mb-3">{legend}</p>}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "11px",
                color: "hsl(var(--foreground))",
                boxShadow: "0 8px 24px hsl(0 0% 0% / 0.15)",
              }}
              formatter={(v: number) => [`R$ ${fmt(v)}`, ""]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;
