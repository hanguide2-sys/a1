"use client";

import { Fragment, useEffect } from "react";
import { amount, num1, pct, pp } from "@/lib/format";
import { Card, StatusBadge, gapColor } from "./ui";
import { useData } from "./Providers";

const COLS = 13;

export function CompareTable() {
  const { dash, expanded, toggleExpanded, focusSiteId, filters } = useData();

  // 점검 순위에서 넘어왔으면 그 줄이 보이는 곳으로 화면을 내립니다.
  useEffect(() => {
    if (!focusSiteId) return;
    document.getElementById(`row-${focusSiteId}`)?.scrollIntoView({ block: "center" });
  }, [focusSiteId, dash]);

  if (!dash) return null;
  const rows = dash.siteMetrics;
  const a = dash.agg;

  return (
    <Card
      title={
        <>
          현장별 비교표 <span className="ml-2 rounded-sm bg-hover px-1.5 py-0.5 text-[11px] font-semibold text-muted">{rows.length}곳</span>
        </>
      }
      right={<span className="text-xs text-subtle">금액 단위: 백만원 · 공정차이 = 실제 − 계획(pp) · 줄을 누르면 기록이 펼쳐집니다</span>}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">선택한 범위에 해당하는 현장이 없습니다.</p>
      ) : (
        <div className="-m-4 overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-[13px]">
            <thead>
              <tr className="h-9 border-b border-line-strong bg-head text-xs font-semibold text-navy-deep">
                <th className="w-8 px-2" aria-label="펼침" />
                <th className="px-2 text-left">현장</th>
                <th className="px-2 text-left">지역</th>
                <th className="px-2 text-left">공사 유형</th>
                <th className="px-2 text-left">당월 주요 공종</th>
                <th className="px-2 text-right">계약금액(백만원)</th>
                <th className="px-2 text-right">누적기성액(백만원)</th>
                <th className="px-2 text-right">기성률</th>
                <th className="px-2 text-right">당월기성액(백만원)</th>
                <th className="px-2 text-right">계획 공정률</th>
                <th className="px-2 text-right">실제 공정률</th>
                <th className="px-2 text-right">공정차이</th>
                <th className="px-2 text-center">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const id = m.row.siteId;
                const open = expanded.has(id);
                const focused = focusSiteId === id;
                return (
                  <Fragment key={id}>
                    <tr
                      id={`row-${id}`}
                      data-focused={focused ? "true" : undefined}
                      className={`h-10 cursor-pointer border-b border-line hover:bg-hover ${
                        focused
                          ? "bg-selected shadow-[inset_3px_0_0_0_#1e3a8a]"
                          : m.status === "점검"
                            ? "bg-bad-bg/40"
                            : ""
                      }`}
                      onClick={() => toggleExpanded(id)}
                    >
                      <td className="px-2 text-center">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={`detail-${id}`}
                          aria-label={`${id} 현장 기록 ${open ? "접기" : "펼치기"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(id);
                          }}
                          className="grid h-6 w-6 place-items-center rounded-sm text-muted hover:bg-line"
                        >
                          <span aria-hidden>{open ? "▼" : "▶"}</span>
                        </button>
                      </td>
                      <td className="px-2 font-medium">
                        <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-sm bg-hover text-[11px] font-bold text-navy-deep">
                          {id}
                        </span>
                        {m.row.siteName.replace("[가상] ", "")}
                      </td>
                      <td className="px-2">{m.row.region}</td>
                      <td className="px-2">{m.row.projectType}</td>
                      <td className="px-2">{m.row.currentWork}</td>
                      <td className="num px-2 text-right">{amount(m.contract10)}</td>
                      <td className="num px-2 text-right">{num1(m.earned10)}</td>
                      <td className="num px-2 text-right">{pct(m.rate10)}</td>
                      <td className="num px-2 text-right">{num1(m.monthly10)}</td>
                      <td className="num px-2 text-right">{pct(m.planned10)}</td>
                      <td className="num px-2 text-right font-medium">{pct(m.actual10)}</td>
                      <td className={`num px-2 text-right font-semibold ${gapColor(m.gap10)}`}>{pp(m.gap10)}</td>
                      <td className="px-2 text-center">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                    {open ? (
                      <tr id={`detail-${id}`} className="border-b border-line-strong">
                        <td colSpan={COLS} className="bg-head p-0">
                          <div className="border-l-[3px] border-navy p-4">
                            <div className="mb-3 text-sm font-bold text-navy-deep">
                              [현장 {id}] {m.row.siteName.replace("[가상] ", "")} · {filters.month} 기록
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              <section aria-label="공사기간" className="rounded-md border border-line bg-white p-3">
                                <h3 className="mb-2 text-xs font-bold text-navy">공사기간</h3>
                                <dl className="space-y-1">
                                  <div className="flex justify-between gap-2">
                                    <dt className="text-muted">착공일</dt>
                                    <dd className="num font-medium">{m.row.startDate}</dd>
                                  </div>
                                  <div className="flex justify-between gap-2">
                                    <dt className="text-muted">계약상 준공일(예정)</dt>
                                    <dd className="num font-medium">{m.row.contractEndDate}</dd>
                                  </div>
                                  <div className="flex justify-between gap-2">
                                    <dt className="text-muted">특이사항 분류</dt>
                                    <dd className="font-medium">{m.row.issueCategory}</dd>
                                  </div>
                                </dl>
                              </section>
                              <section aria-label="기록된 상황" className="rounded-md border border-line bg-white p-3">
                                <h3 className="mb-2 text-xs font-bold text-navy">기록된 상황</h3>
                                <p className="leading-5">{m.row.issueSummary}</p>
                              </section>
                              <section aria-label="기록된 대응 계획" className="rounded-md border border-line bg-white p-3">
                                <h3 className="mb-2 text-xs font-bold text-navy">기록된 대응 계획</h3>
                                <p className="leading-5">{m.row.actionPlan}</p>
                              </section>
                            </div>
                            <p className="mt-3 text-xs text-subtle">
                              선택 월의 기록이며 원인이나 완료를 확정하지 않습니다. 계약상 준공일은 예정 일정이며 실제 완료일이 아닙니다.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="h-10 bg-head font-semibold text-navy-deep">
                <td />
                <td className="px-2">{rows.length === 1 ? "선택 현장" : `전체 합계 / 가중평균 (${rows.length}곳)`}</td>
                <td className="px-2" colSpan={3} />
                <td className="num px-2 text-right">{amount(a.contract10)}</td>
                <td className="num px-2 text-right">{num1(a.earned10)}</td>
                <td className="num px-2 text-right">{pct(a.rate10)}</td>
                <td className="num px-2 text-right">{num1(a.monthly10)}</td>
                <td className="num px-2 text-right">{pct(a.planned10)}</td>
                <td className="num px-2 text-right">{pct(a.actual10)}</td>
                <td className={`num px-2 text-right ${gapColor(a.gap10)}`}>{pp(a.gap10)}</td>
                <td className="num px-2 text-center text-xs text-muted">
                  {a.counts["정상"]}·{a.counts["주의"]}·{a.counts["점검"]}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
