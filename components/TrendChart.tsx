"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { num1, pct, pp, NA } from "@/lib/format";
import { Card, gapColor } from "./ui";
import { useData } from "./Providers";

type ChartRow = {
  month: string;
  label: string;
  /** 그래프에 그리는 값(% 단위). 자료가 없으면 null */
  planPct: number | null;
  actualPct: number | null;
  /** 막대에 그리는 값(백만원). 계산 불가·자료 없음이면 null */
  monthly: number | null;
  planText: string;
  actualText: string;
  gapText: string;
  earnedText: string;
  rateText: string;
  monthlyText: string;
  selected: boolean;
};

type TipProps = { active?: boolean; payload?: readonly { payload?: ChartRow }[] };

function ChartTooltip({ active, payload }: TipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="num rounded-md border border-line-strong bg-white p-3 text-xs shadow-md">
      <div className="mb-1 font-bold text-navy-deep">{row.month} 월말</div>
      <div>계획 공정률 {row.planText}</div>
      <div>실제 공정률 {row.actualText}</div>
      <div>공정차이 {row.gapText}</div>
      <div>누적기성액 {row.earnedText}</div>
      <div>기성률 {row.rateText}</div>
      <div className="font-semibold">당월기성액 {row.monthlyText}</div>
    </div>
  );
}

export function TrendChart() {
  const { dash, filters } = useData();
  if (!dash) return null;

  const data: ChartRow[] = dash.trend.map((t) => {
    const a = t.agg;
    const empty = a.siteCount === 0;
    const text = (s: string) => (empty ? "자료 없음" : s);
    return {
      month: t.month,
      label: `${t.month.slice(2, 4)}.${t.month.slice(5)}`,
      planPct: a.planned10 === null ? null : a.planned10 / 10,
      actualPct: a.actual10 === null ? null : a.actual10 / 10,
      monthly: a.monthly10 === null ? null : a.monthly10 / 10,
      planText: text(pct(a.planned10)),
      actualText: text(pct(a.actual10)),
      gapText: text(pp(a.gap10)),
      earnedText: text(`${num1(a.earned10)} 백만원`),
      rateText: text(pct(a.rate10)),
      monthlyText: text(a.monthly10 === null ? NA : `${num1(a.monthly10)} 백만원`),
      selected: t.month === filters.month,
    };
  });
  const naMonths = dash.trend.filter((t) => t.agg.siteCount > 0 && t.agg.monthly10 === null).map((t) => t.month);
  const emptyMonths = dash.trend.filter((t) => t.agg.siteCount === 0).map((t) => t.month);

  return (
    <Card
      title="월별 공정 진도율 추이 및 월별 기성액"
      right={
        <span className="text-xs text-subtle">
          {dash.months[0]} ~ {filters.month} (선택 월까지)
        </span>
      }
    >
      {dash.scope.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">선택한 범위에 해당하는 현장이 없어 그래프를 그릴 수 없습니다.</p>
      ) : (
        <>
          <div className="h-[320px] w-full" role="img" aria-label="계획·실제 공정률 선 그래프와 월별 당월기성액 막대 그래프">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} tickLine={false} />
                <YAxis
                  yAxisId="pct"
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  width={44}
                />
                <YAxis
                  yAxisId="money"
                  orientation="right"
                  domain={[0, (max: number) => Math.max(1000, Math.ceil((max * 2) / 1000) * 1000)]}
                  tickFormatter={(v: number) => v.toLocaleString("en-US")}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  width={64}
                />
                <Tooltip content={(p) => <ChartTooltip {...(p as unknown as TipProps)} />} />
                <Legend
                  verticalAlign="top"
                  height={28}
                  formatter={(v) => <span className="text-xs text-muted">{v}</span>}
                />
                <Bar yAxisId="money" dataKey="monthly" name="당월기성액(백만원)" fill="#bfd0f5" isAnimationActive={false}>
                  {data.map((d) => (
                    <Cell key={d.month} fill={d.selected ? "#1e3a8a" : "#bfd0f5"} />
                  ))}
                </Bar>
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="planPct"
                  name="계획 공정률(%)"
                  stroke="#64748b"
                  strokeDasharray="5 4"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="actualPct"
                  name="실제 공정률(%)"
                  stroke="#00236f"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-0.5 text-xs text-muted" data-testid="trend-notes">
            {naMonths.map((m) => (
              <li key={m}>
                {m} 당월기성액: <b className="text-ink">{NA}</b> (바로 전월 자료가 없어 막대를 그리지 않았습니다. 누적액으로 대신하지 않습니다.)
              </li>
            ))}
            {emptyMonths.map((m) => (
              <li key={m}>{m}: 자료 없음</li>
            ))}
          </ul>

          <details open className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-navy">월별 수치를 표로 보기</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="num w-full min-w-[720px] border-collapse text-xs" data-testid="trend-table">
                <thead>
                  <tr className="h-8 border-b border-line-strong bg-head text-navy-deep">
                    <th className="px-2 text-left">월</th>
                    <th className="px-2 text-right">계획 공정률</th>
                    <th className="px-2 text-right">실제 공정률</th>
                    <th className="px-2 text-right">공정차이</th>
                    <th className="px-2 text-right">누적기성액</th>
                    <th className="px-2 text-right">기성률</th>
                    <th className="px-2 text-right">당월기성액</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.trend.map((t) => {
                    const a = t.agg;
                    const empty = a.siteCount === 0;
                    return (
                      <tr
                        key={t.month}
                        className={`h-8 border-b border-line ${t.month === filters.month ? "bg-selected font-semibold" : ""}`}
                      >
                        <td className="px-2">{t.month}</td>
                        <td className="px-2 text-right">{empty ? "자료 없음" : pct(a.planned10)}</td>
                        <td className="px-2 text-right">{empty ? "자료 없음" : pct(a.actual10)}</td>
                        <td className={`px-2 text-right ${gapColor(a.gap10)}`}>{empty ? "자료 없음" : pp(a.gap10)}</td>
                        <td className="px-2 text-right">{empty ? "자료 없음" : num1(a.earned10)}</td>
                        <td className="px-2 text-right">{empty ? "자료 없음" : pct(a.rate10)}</td>
                        <td className="px-2 text-right">{empty ? "자료 없음" : num1(a.monthly10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Card>
  );
}
