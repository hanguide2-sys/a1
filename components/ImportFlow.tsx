"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { monthList, siteInfos } from "@/lib/calc";
import { amount } from "@/lib/format";
import type { ImportResult } from "@/lib/types";
import { importText } from "@/lib/validate";
import { useData } from "./Providers";
import { Card, Notice } from "./ui";

const MAX_BYTES = 2 * 1024 * 1024;
const PREVIEW_ROWS = 10;
const MAX_ERRORS_SHOWN = 10;

type Picked = { fileName: string; result: ImportResult };
type Step = { kind: "pick" } | { kind: "result"; picked: Picked } | { kind: "rejected"; fileName: string; message: string } | { kind: "done"; rows: number; fileName: string };

export function ImportFlow() {
  const { rows, sourceName, replaceData } = useData();
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const name = file.name;
    const lower = name.toLowerCase();
    const format = lower.endsWith(".csv") ? "csv" : lower.endsWith(".json") ? "json" : null;
    if (!format) {
      setStep({ kind: "rejected", fileName: name, message: "CSV 또는 JSON 파일만 가져올 수 있습니다." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStep({ kind: "rejected", fileName: name, message: "파일이 너무 큽니다. 2MB 이하의 파일만 가져올 수 있습니다." });
      return;
    }
    if (file.size === 0) {
      setStep({ kind: "rejected", fileName: name, message: "빈 파일입니다." });
      return;
    }
    // 파일은 이 브라우저 안에서만 읽습니다. 서버로 보내지 않습니다.
    const text = await file.text();
    setStep({ kind: "result", picked: { fileName: name, result: importText(text, format) } });
  };

  const reset = () => {
    setStep({ kind: "pick" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const keepNote = rows
    ? `지금 자료(${sourceName ?? "가져온 파일"}, ${rows.length}행)는 그대로 유지됩니다.`
    : "지금은 가져온 자료가 없으므로 아무것도 바뀌지 않았습니다.";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card title="자료 가져오기">
        <ol className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-muted" aria-label="진행 순서">
          {["① 파일 고르기", "② 검사 결과·미리보기", "③ 완료"].map((s, i) => {
            const active = step.kind === "pick" || step.kind === "rejected" ? 0 : step.kind === "result" ? 1 : 2;
            return (
              <li
                key={s}
                aria-current={i === active ? "step" : undefined}
                className={`rounded-md border px-3 py-1.5 ${i === active ? "border-navy bg-selected text-navy" : "border-line bg-white"}`}
              >
                {s}
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-muted" data-testid="current-data">
          {rows ? (
            <>
              지금 자료: <b className="text-ink">{sourceName}</b> · {rows.length}행 · {siteInfos(rows).length}개 현장 ·{" "}
              {monthList(rows)[0]}~{monthList(rows).slice(-1)[0]}
            </>
          ) : (
            "지금 가져온 자료가 없습니다."
          )}
        </p>

        {step.kind === "pick" || step.kind === "rejected" ? (
          <div className="mt-4">
            <input
              ref={inputRef}
              id="data-file"
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="sr-only"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <label
              htmlFor="data-file"
              className="inline-flex h-10 cursor-pointer items-center rounded-md bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep focus-within:outline-2"
            >
              파일 고르기 (CSV 또는 JSON)
            </label>
            <p className="mt-2 text-xs text-subtle">
              파일은 이 컴퓨터의 브라우저 안에서만 읽습니다. 검사를 통과해도 &quot;이 자료로 바꾸기&quot;를 누르기 전에는 지금 자료가 바뀌지 않습니다.
            </p>
            {step.kind === "rejected" ? (
              <div className="mt-4">
                <Notice tone="error" title={`가져오기 오류 — ${step.fileName}`}>
                  <p>{step.message}</p>
                  <p className="mt-1 font-semibold">{keepNote}</p>
                </Notice>
              </div>
            ) : null}
          </div>
        ) : null}

        {step.kind === "result" ? <ResultView picked={step.picked} keepNote={keepNote} onCancel={reset} onApply={() => {
          const { fileName, result } = step.picked;
          replaceData(result.rows, result.warnings, fileName);
          setStep({ kind: "done", rows: result.rows.length, fileName });
          if (inputRef.current) inputRef.current.value = "";
        }} /> : null}

        {step.kind === "done" ? (
          <div className="mt-4 space-y-3">
            <Notice tone="info" title={`${step.rows}행으로 바꿨습니다`}>
              <span data-testid="import-done">{step.fileName}의 자료로 전체를 바꿨습니다. 이전 자료와 합치지 않았습니다.</span>
            </Notice>
            <div className="flex gap-2">
              <Link
                href="/"
                className="inline-flex h-9 items-center rounded-md bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"
              >
                현황 요약으로 이동
              </Link>
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-9 items-center rounded-md border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-hover"
              >
                다른 파일 가져오기
              </button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function ResultView({
  picked,
  keepNote,
  onCancel,
  onApply,
}: {
  picked: Picked;
  keepNote: string;
  onCancel: () => void;
  onApply: () => void;
}) {
  const { fileName, result } = picked;

  if (!result.ok) {
    const shown = result.errors.slice(0, MAX_ERRORS_SHOWN);
    return (
      <div className="mt-4 space-y-3" data-testid="import-error">
        <Notice tone="error" title={`가져오기 오류 — ${fileName}`}>
          <p>아래 문제를 고친 파일을 다시 골라 주세요. 어떤 값도 0으로 바꾸지 않았고, 반영하지 않았습니다.</p>
          <p className="mt-1 font-semibold">{keepNote}</p>
        </Notice>
        <ul className="divide-y divide-line rounded-md border border-line bg-white text-sm">
          {shown.map((e, i) => (
            <li key={i} className="px-3 py-2">
              <span className="mr-2 inline-block min-w-[3.5rem] font-bold text-bad">
                {e.line !== undefined ? `${e.line}행` : "파일"}
              </span>
              {e.column ? <span className="mr-2 rounded-sm bg-hover px-1.5 py-0.5 text-xs font-semibold">{e.column}</span> : null}
              {e.message}
            </li>
          ))}
          {result.errors.length > shown.length ? (
            <li className="px-3 py-2 text-muted">외 {result.errors.length - shown.length}건</li>
          ) : null}
        </ul>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-md border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-hover"
        >
          다른 파일 고르기
        </button>
      </div>
    );
  }

  const ids = new Set(result.rows.map((r) => r.siteId));
  const months = monthList(result.rows);
  const preview = result.rows.slice(0, PREVIEW_ROWS);
  return (
    <div className="mt-4 space-y-3" data-testid="import-ok">
      <Notice tone="info" title={`검사 통과 — ${fileName}`}>
        <span data-testid="import-summary">
          {result.rows.length}행 · {ids.size}개 현장 · {months[0]}~{months[months.length - 1]} ({result.format.toUpperCase()})
        </span>
        <ul className="mt-1 list-disc pl-5 text-xs">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          <li>아래 &quot;이 자료로 바꾸기&quot;를 누르면 지금 자료 전체가 이 자료로 바뀝니다(합치지 않음).</li>
        </ul>
      </Notice>
      {result.warnings.length > 0 ? (
        <Notice tone="warn" title="경고 — 확인 가능한 행만 집계합니다">
          <ul className="list-disc pl-5">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="num w-full min-w-[760px] border-collapse text-xs">
          <caption className="bg-head px-3 py-2 text-left font-semibold text-navy-deep">
            미리보기 (처음 {preview.length}행 / 전체 {result.rows.length}행)
          </caption>
          <thead>
            <tr className="h-8 border-y border-line-strong bg-head">
              {["월", "현장", "현장명", "계약금액", "계획", "실제", "누적기성액", "지역", "유형", "주요 공종"].map((h) => (
                <th key={h} className="px-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((r) => (
              <tr key={`${r.month}${r.siteId}`} className="h-8 border-b border-line">
                <td className="px-2">{r.month}</td>
                <td className="px-2">{r.siteId}</td>
                <td className="px-2">{r.siteName}</td>
                <td className="px-2">{amount(Math.round(r.contractAmount * 10))}</td>
                <td className="px-2">{r.plannedProgress}%</td>
                <td className="px-2">{r.actualProgress}%</td>
                <td className="px-2">{r.cumulativeEarned}</td>
                <td className="px-2">{r.region}</td>
                <td className="px-2">{r.projectType}</td>
                <td className="px-2">{r.currentWork}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-9 items-center rounded-md bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"
        >
          이 자료로 바꾸기
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-md border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-hover"
        >
          취소
        </button>
      </div>
      <p className="text-xs text-subtle">취소하면 아무것도 바뀌지 않고 파일 고르기로 돌아갑니다. {keepNote}</p>
    </div>
  );
}
