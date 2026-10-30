"use client";

import { useMemo, useState } from "react";
import { FAIL_MESSAGES, QUESTION_MAX, type AiRef } from "@/lib/aiContext";
import { indexRows, metricsForMonth } from "@/lib/calc";
import { num1, pct, pp } from "@/lib/format";
import { ALL } from "@/lib/types";
import { useData } from "./Providers";
import { Card, Notice } from "./ui";

const EXAMPLES = [
  "점검 현장 D, I, K 중 공정차이가 가장 큰 곳은?",
  "경기 현장끼리 기성률을 비교해 줘.",
  "D와 I의 기록된 대응 계획은 어떻게 다른가?",
];

const FIELD_LABELS: Record<string, string> = {
  issueSummary: "기록된 상황(issueSummary)",
  actionPlan: "기록된 대응 계획(actionPlan)",
  issueCategory: "특이사항 분류(issueCategory)",
  currentWork: "당월 주요 공종(currentWork)",
  plannedProgress: "계획 공정률(plannedProgress)",
  actualProgress: "실제 공정률(actualProgress)",
  cumulativeEarned: "누적기성액(cumulativeEarned)",
  contractAmount: "계약금액(contractAmount)",
  contractEndDate: "계약상 준공일(contractEndDate)",
  startDate: "착공일(startDate)",
};

function scopeLabel(f: { month: string; region: string; type: string; siteId: string }, n: number): string {
  return [
    f.month,
    f.region === ALL ? "전체 지역" : f.region,
    f.type === ALL ? "전체 유형" : f.type,
    f.siteId === ALL ? "전체 현장" : `${f.siteId} 현장`,
    `${n}곳`,
  ].join(" · ");
}

export function AskPanel() {
  const { rows, dash, filters, ai, askAi } = useData();
  const [text, setText] = useState("");
  const index = useMemo(() => (rows ? indexRows(rows) : null), [rows]);
  if (!rows || !dash || !index) return null;

  const busy = ai.status === "loading";
  const canSend = !busy && text.trim().length > 0 && text.length <= QUESTION_MAX;
  const send = () => {
    if (canSend) void askAi(text);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <div className="space-y-4">
        <Card title="지금 범위">
          <p className="text-sm font-semibold text-navy-deep" data-testid="ask-scope">
            {scopeLabel(filters, dash.scope.length)}
          </p>
          <p className="mt-2 text-xs text-subtle">
            월·지역·유형·현장은 위 필터에서 바꿉니다. 범위를 바꾸면 이전 답변이 지워집니다.
          </p>
        </Card>
        <Card title="예시 질문 (현장끼리 비교)">
          <ul className="space-y-2">
            {EXAMPLES.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => setText(q)}
                  className="w-full rounded-md border border-line bg-head px-3 py-2 text-left text-[13px] hover:bg-selected"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-subtle">누르면 입력칸에 채워집니다. 보내려면 &quot;질문하기&quot;를 누르세요.</p>
        </Card>
        <Card title="AI 설명 원칙">
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
            <li>숫자는 프로그램이 계산하고, AI는 그 숫자와 기록을 근거로 설명합니다.</li>
            <li>기록된 상황·대응 계획은 원인 확정이나 완료 사실이 아닙니다.</li>
            <li>실제 준공일·미수금·기상 실측은 자료에 없어 답하지 않습니다.</li>
            <li>AI 연결이 실패해도 대시보드와 CSV는 계속 쓸 수 있습니다.</li>
          </ul>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="AI에게 묻기">
          <label htmlFor="question" className="text-xs font-semibold text-muted">
            질문 (최대 {QUESTION_MAX}자)
          </label>
          <textarea
            id="question"
            value={text}
            maxLength={QUESTION_MAX}
            rows={3}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="현장 간 비교 질문을 입력하세요. (예: D와 I의 기성률 차이를 비교해 줘)"
            className="mt-1 w-full rounded-md border border-line-strong p-2 text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="num text-xs text-subtle">
              {text.length}/{QUESTION_MAX} · Enter로 보내기, Shift+Enter로 줄바꿈
            </span>
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              className="inline-flex h-9 items-center rounded-md bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
            >
              질문하기
            </button>
          </div>
        </Card>

        <div aria-live="polite" className="space-y-3">
          {ai.status === "loading" ? (
            <Notice tone="info" title="AI 답변 기다리는 중…">
              <span data-testid="ai-loading">대시보드와 CSV는 계속 쓸 수 있습니다. 질문: {ai.question}</span>
            </Notice>
          ) : null}

          {ai.status === "info" ? (
            <Notice tone="warn" title="안내">
              <span data-testid="ai-info">{ai.message}</span>
            </Notice>
          ) : null}

          {ai.status === "error" ? (
            <Notice tone="error" title="AI 연결 실패">
              <p data-testid="ai-error">{FAIL_MESSAGES[ai.reason]}</p>
              <p className="mt-1">대시보드와 CSV는 계속 쓸 수 있습니다.</p>
              <button
                type="button"
                onClick={() => void askAi(ai.question)}
                className="mt-2 inline-flex h-8 items-center rounded-md border border-bad-line bg-white px-3 text-[13px] font-semibold text-bad hover:bg-bad-bg"
              >
                다시 묻기
              </button>
            </Notice>
          ) : null}

          {ai.status === "done" ? (
            <Card
              title="답변"
              right={
                ai.mock ? (
                  <span className="rounded-sm border border-warn-line bg-warn-bg px-2 py-0.5 text-xs font-bold text-warn">
                    모의 응답
                  </span>
                ) : null
              }
            >
              <p className="mb-2 text-xs font-semibold text-muted">질문: {ai.question}</p>
              <p className="whitespace-pre-wrap text-sm leading-6" data-testid="ai-answer">
                {ai.answer}
              </p>
              <Evidence refs={ai.references} index={index} />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Evidence({ refs, index }: { refs: AiRef[]; index: ReturnType<typeof indexRows> }) {
  const { dash } = useData();
  if (!dash) return null;
  const rowRefs = refs.filter((r): r is Extract<AiRef, { kind: "row" }> => r.kind === "row");
  const summaryMonths = refs
    .filter((r): r is Extract<AiRef, { kind: "monthlySummary" }> => r.kind === "monthlySummary")
    .flatMap((r) => r.months);
  return (
    <div className="mt-4 border-t border-line pt-3" data-testid="ai-evidence">
      <h3 className="text-xs font-bold text-navy-deep">근거 (프로그램이 계산한 값을 그대로 보여 줍니다)</h3>
      {rowRefs.length === 0 && summaryMonths.length === 0 ? (
        <p className="mt-1 text-xs text-muted">표시할 근거가 없습니다.</p>
      ) : null}
      {rowRefs.length > 0 ? (
        <div className="mt-2 overflow-x-auto">
          <table className="num w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="h-8 border-b border-line-strong bg-head text-navy-deep">
                <th className="px-2 text-left">기준 월</th>
                <th className="px-2 text-left">현장</th>
                <th className="px-2 text-right">계획</th>
                <th className="px-2 text-right">실제</th>
                <th className="px-2 text-right">공정차이</th>
                <th className="px-2 text-right">기성률</th>
                <th className="px-2 text-left">참고한 기록 필드</th>
              </tr>
            </thead>
            <tbody>
              {rowRefs.map((r) => {
                const m = metricsForMonth(index, [r.siteId], r.month)[0];
                return (
                  <tr key={`${r.month}${r.siteId}`} className="border-b border-line align-top">
                    <td className="px-2 py-1.5">{r.month}</td>
                    <td className="px-2 py-1.5 font-semibold">{r.siteId}</td>
                    <td className="px-2 py-1.5 text-right">{m ? pct(m.planned10) : "-"}</td>
                    <td className="px-2 py-1.5 text-right">{m ? pct(m.actual10) : "-"}</td>
                    <td className="px-2 py-1.5 text-right">{m ? pp(m.gap10) : "-"}</td>
                    <td className="px-2 py-1.5 text-right">{m ? pct(m.rate10) : "-"}</td>
                    <td className="px-2 py-1.5 font-sans">
                      {r.fields.length > 0 ? r.fields.map((f) => FIELD_LABELS[f] ?? f).join(", ") : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {summaryMonths.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="num w-full min-w-[520px] border-collapse text-xs">
            <caption className="py-1 text-left font-semibold text-navy-deep">월별 요약 (같은 범위)</caption>
            <thead>
              <tr className="h-8 border-b border-line-strong bg-head text-navy-deep">
                <th className="px-2 text-left">월</th>
                <th className="px-2 text-right">공정차이</th>
                <th className="px-2 text-right">기성률</th>
                <th className="px-2 text-right">당월기성액</th>
              </tr>
            </thead>
            <tbody>
              {[...new Set(summaryMonths)].sort().map((month) => {
                const t = dash.trend.find((x) => x.month === month);
                return (
                  <tr key={month} className="border-b border-line">
                    <td className="px-2 py-1.5">{month}</td>
                    <td className="px-2 py-1.5 text-right">{t ? pp(t.agg.gap10) : "-"}</td>
                    <td className="px-2 py-1.5 text-right">{t ? pct(t.agg.rate10) : "-"}</td>
                    <td className="px-2 py-1.5 text-right">{t ? num1(t.agg.monthly10) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
