"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatMoney } from "@/lib/format";

export default function DailyChart({ daily }) {
  const recentDays = daily.slice(-18);

  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Diario</span>
          <h2>Ganancia y perdida</h2>
        </div>
      </div>
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={recentDays} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e6e1d8" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#605b54", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#605b54", fontSize: 12 }} tickLine={false} axisLine={false} width={72} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              cursor={{ fill: "rgba(21, 33, 45, 0.06)" }}
              formatter={(value, name) => [formatMoney(value), name === "profitMxn" ? "Resultado MXN" : name]}
              labelFormatter={(label) => `Dia ${label}`}
              contentStyle={{
                border: "1px solid #d9d2c5",
                borderRadius: 8,
                boxShadow: "0 12px 30px rgba(24, 23, 21, 0.12)"
              }}
            />
            <Bar dataKey="profitMxn" radius={[6, 6, 0, 0]} maxBarSize={42}>
              {recentDays.map((day) => (
                <Cell key={day.date} fill={day.profitMxn >= 0 ? "#287a5f" : "#ba3f45"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
