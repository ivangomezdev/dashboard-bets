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
import { formatMoney, mxnToUsd } from "@/lib/format";

const DAILY_RESULT_OVERRIDES_USD = {
  "2026-07-16": 21,
  "2026-07-18": -12,
  "2026-07-20": 13
};
const CONFIGURATION_DATES = ["2026-08-02", "2026-08-03", "2026-08-04"];
const CONFIGURATION_DATE_SET = new Set(CONFIGURATION_DATES);
const MONTH_LABELS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic"
];

function formatChartDate(date) {
  const [, month, day] = String(date).split("-");
  return `${Number(day)} ${MONTH_LABELS[Number(month) - 1] || ""}`.trim();
}

function ChartDateTick({ x, y, payload }) {
  const isConfiguration = CONFIGURATION_DATE_SET.has(payload.value);

  return (
    <text x={x} y={y + 12} fill="#605b54" fontSize={12} textAnchor="middle">
      <tspan x={x}>{formatChartDate(payload.value)}</tspan>
      {isConfiguration ? (
        <tspan x={x} dy="1.25em" fill="#8a6d3b" fontSize={10} fontWeight={700}>
          Configuración
        </tspan>
      ) : null}
    </text>
  );
}

export default function DailyChart({ daily }) {
  const configurationDays = CONFIGURATION_DATES.map((date) => ({
    date,
    count: 0,
    profitMxn: 0,
    profitUsd: 0,
    isConfiguration: true
  }));
  const recentDays = [
    ...daily.filter((day) => !CONFIGURATION_DATE_SET.has(day.date)),
    ...configurationDays
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-13)
    .map((day) => ({
      ...day,
      profitUsd: DAILY_RESULT_OVERRIDES_USD[day.date] ?? mxnToUsd(day.profitMxn)
    }));

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
          <BarChart data={recentDays} margin={{ top: 10, right: 10, left: 0, bottom: 28 }}>
            <CartesianGrid stroke="#e6e1d8" vertical={false} />
            <XAxis
              dataKey="date"
              interval={0}
              tick={<ChartDateTick />}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#605b54", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={72}
              tickFormatter={(value) => `$${Number(value || 0).toFixed(0)}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(21, 33, 45, 0.06)" }}
              formatter={(value, name, item) =>
                item?.payload?.isConfiguration
                  ? ["Sin apuestas", "Configuración"]
                  : [
                      formatMoney(value, "USD"),
                      name === "profitUsd" ? "Resultado USD" : name
                    ]
              }
              labelFormatter={(label) => `Dia ${label}`}
              contentStyle={{
                border: "1px solid #d9d2c5",
                borderRadius: 8,
                boxShadow: "0 12px 30px rgba(24, 23, 21, 0.12)"
              }}
            />
            <Bar dataKey="profitUsd" radius={[6, 6, 0, 0]} maxBarSize={42}>
              {recentDays.map((day) => (
                <Cell
                  key={day.date}
                  fill={day.isConfiguration ? "#b79a63" : day.profitUsd >= 0 ? "#287a5f" : "#ba3f45"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
