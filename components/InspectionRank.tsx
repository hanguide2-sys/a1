"use client";

import { useRouter } from "next/navigation";
import { inspectionRank } from "@/lib/calc";
import { pct, pp } from "@/lib/format";
import { Card, StatusDot } from "./ui";
import { useData } from "./Providers";

/** 점검 순위: 점검 현장만, 공정차이가 작은 순. 한 줄을 누르면 비교표에서 그 줄이 펼쳐집니다(질문 5 답 A). */
export function InspectionRank() {
  const { dash, focusSite } = useData();
  const router = useRouter();
  if (!dash) return null;
  const rank = inspectionRank(dash.siteMetrics);
  const a = dash.agg;

  return (
    <div className="space-y-4">
      <Card title="점검 집중 현장 순위" right={<span className="text-xs text-subtle">공정차이가 작은 순</span>}>
        {rank.length === 0 ? (
          <div role="status" data-testid="no-inspection">
            <div className="text-sm font-bold text-navy-deep">점검 대상 없음</div>
            <p className="mt-1 text-sm text-muted">
              {a.siteCount === 0
                ? "선택한 범위에 해당하는 현장이 없습니다."
                : `선택한 범위에 점검 현장이 없습니다. (정상 ${a.counts["정상"]}곳 · 주의 ${a.counts["주의"]}곳)`}
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {rank.map((m, i) => (
              <li key={m.row.siteId}>
                <button
                  type="button"
                  onClick={() => {
                    focusSite(m.row.siteId);
                    router.push("/compare");
                  }}
                  className="w-full rounded-md border border-bad-line bg-bad-bg/60 p-3 text-left hover:bg-bad-bg"
                  aria-label={`${i + 1}위 현장 ${m.row.siteId} ${m.row.siteName.replace("[가상] ", "")}, 비교표에서 기록 보기`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold text-navy-deep">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-bad text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      [현장 {m.row.siteId}] {m.row.siteName.replace("[가상] ", "")}
                    </div>
                    <div className="num text-base font-bold text-bad">{pp(m.gap10)}</div>
                  </div>
                  <div className="num mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-muted">
                    <span>
                      계획 {pct(m.planned10)} vs 실제 {pct(m.actual10)}
                    </span>
                    <span>기성률 {pct(m.rate10)}</span>
                  </div>
                  <div className="mt-1.5 text-xs font-semibold text-navy">비교표에서 기록 보기 →</div>
                </button>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="현장 관리 상태 현황" right={<span className="text-xs text-subtle">총 {a.siteCount}곳</span>}>
        {a.siteCount === 0 ? (
          <p className="text-sm text-muted">선택한 범위에 해당하는 현장이 없습니다.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(
              [
                ["정상", "공정차이 0pp 이상"],
                ["주의", "−5pp 초과 0pp 미만"],
                ["점검", "−5pp 이하"],
              ] as const
            ).map(([s, desc]) => (
              <li key={s} className="flex items-center justify-between rounded-md bg-head px-3 py-2">
                <span className="flex items-center gap-2 font-semibold">
                  <StatusDot status={s} /> {s}
                  <span className="text-xs font-normal text-subtle">{desc}</span>
                </span>
                <span className="num font-bold">{a.counts[s]}곳</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
