"use client";

import { pct, pp } from "@/lib/format";
import { Card, StatusBadge, gapColor } from "./ui";
import { useData } from "./Providers";

/** 첫 화면에서 큰 숫자 바로 아래에 보이는 12개 현장 요약표(질문 3 답 C) */
export function SiteSummaryTable() {
  const { dash } = useData();
  if (!dash) return null;
  const rows = dash.siteMetrics;
  const a = dash.agg;
  return (
    <Card
      title={
        <>
          현장별 공정·기성 요약 <span className="ml-2 rounded-sm bg-hover px-1.5 py-0.5 text-[11px] font-semibold text-muted">{rows.length}곳</span>
        </>
      }
      right={<span className="text-xs text-subtle">단위: 공정률·기성률 %, 공정차이 pp</span>}
      className="overflow-hidden"
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">선택한 범위에 해당하는 현장이 없습니다.</p>
      ) : (
        <div className="-m-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="h-9 border-b border-line-strong bg-head text-xs font-semibold text-navy-deep">
                <th className="px-3 text-left">현장</th>
                <th className="px-3 text-right">계획 공정률</th>
                <th className="px-3 text-right">실제 공정률</th>
                <th className="px-3 text-right">공정차이</th>
                <th className="px-3 text-right">기성률</th>
                <th className="px-3 text-center">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr
                  key={m.row.siteId}
                  className={`h-10 border-b border-line hover:bg-hover ${m.status === "점검" ? "bg-bad-bg/40" : ""}`}
                >
                  <td className="px-3">
                    <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-sm bg-hover text-[11px] font-bold text-navy-deep">
                      {m.row.siteId}
                    </span>
                    {m.row.siteName.replace("[가상] ", "")}
                  </td>
                  <td className="num px-3 text-right">{pct(m.planned10)}</td>
                  <td className="num px-3 text-right font-medium">{pct(m.actual10)}</td>
                  <td className={`num px-3 text-right font-semibold ${gapColor(m.gap10)}`}>{pp(m.gap10)}</td>
                  <td className="num px-3 text-right">{pct(m.rate10)}</td>
                  <td className="px-3 text-center">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="h-10 bg-head text-[13px] font-semibold text-navy-deep">
                <td className="px-3">{rows.length === 1 ? "선택 현장" : `전체 합계 / 가중평균 (${rows.length}곳)`}</td>
                <td className="num px-3 text-right">{pct(a.planned10)}</td>
                <td className="num px-3 text-right">{pct(a.actual10)}</td>
                <td className={`num px-3 text-right ${gapColor(a.gap10)}`}>{pp(a.gap10)}</td>
                <td className="num px-3 text-right">{pct(a.rate10)}</td>
                <td className="num px-3 text-center text-xs text-muted">
                  정상{a.counts["정상"]} · 주의{a.counts["주의"]} · 점검{a.counts["점검"]}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
