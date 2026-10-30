"use client";

import { amount, num1, pct, pp, NA } from "@/lib/format";
import { gapColor } from "./ui";
import { useData } from "./Providers";

function Kpi({
  label,
  value,
  valueClass = "text-navy-deep",
  children,
}: {
  label: string;
  value: string;
  valueClass?: string;
  children?: React.ReactNode;
}) {
  const isNa = value === NA;
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)]">
      <div className="text-xs font-semibold tracking-wide text-muted">{label}</div>
      <div
        className={`num mt-2 font-bold ${isNa ? "text-xl text-subtle" : `text-[30px] leading-9 ${valueClass}`}`}
        data-testid="kpi-value"
      >
        {value}
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-muted">{children}</div>
    </div>
  );
}

export function KpiCards() {
  const { dash } = useData();
  if (!dash) return null;
  const a = dash.agg;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi label="전체 기성률 (금액 기준)" value={pct(a.rate10)}>
        <div className="num">
          누적기성액 {num1(a.earned10)} / 계약금액 {amount(a.contract10)} (백만원)
        </div>
        <div className="num font-semibold text-ink">당월기성액 {num1(a.monthly10)} 백만원</div>
        <div className="text-subtle">누적기성액은 수금액이 아닙니다. 당월기성액은 전월 누적 대비 늘어난 금액입니다.</div>
      </Kpi>
      <Kpi label="계획 공정률 (계약금액 가중평균)" value={pct(a.planned10)}>
        <div>월말 누적 계획공정률</div>
      </Kpi>
      <Kpi label="실제 공정률 (계약금액 가중평균)" value={pct(a.actual10)}>
        <div>월말 누적 실제공정률 (공정 기준)</div>
      </Kpi>
      <Kpi label="전체 공정차이 (실제 − 계획)" value={pp(a.gap10)} valueClass={gapColor(a.gap10)}>
        {a.siteCount > 0 ? (
          <div className="num font-semibold text-ink" data-testid="status-counts">
            정상 {a.counts["정상"]} · 주의 {a.counts["주의"]} · 점검 {a.counts["점검"]}
          </div>
        ) : (
          <div>선택한 범위에 해당하는 자료가 없습니다.</div>
        )}
      </Kpi>
    </div>
  );
}
