"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Status } from "@/lib/types";

const BADGE: Record<Status, string> = {
  정상: "border-ok-line bg-ok-bg text-ok",
  주의: "border-warn-line bg-warn-bg text-warn",
  점검: "border-bad-line bg-bad-bg text-bad",
};

const DOT: Record<Status, string> = {
  정상: "bg-ok",
  주의: "bg-warn",
  점검: "bg-bad",
};

/** 상태는 색만이 아니라 글자로도 보여 줍니다. */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-sm border px-1.5 text-[11px] font-bold ${BADGE[status]}`}
    >
      {status}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  return <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${DOT[status]}`} />;
}

export function gapColor(gap10: number | null): string {
  if (gap10 === null) return "text-subtle";
  if (gap10 < 0) return "text-bad";
  if (gap10 > 0) return "text-ok";
  return "text-ink";
}

export function Card({
  title,
  right,
  children,
  className = "",
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-line bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-bold text-navy-deep">{title}</h2>
          {right}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** 자료를 가져오기 전에 모든 페이지에서 보여 주는 안내("자료 없음" 상태) */
export function EmptyData({ what = "현황" }: { what?: string }) {
  return (
    <div
      role="status"
      className="mx-auto mt-10 max-w-xl rounded-md border border-line bg-white p-8 text-center shadow-[0_1px_3px_0_rgba(15,23,42,0.08)]"
    >
      <div className="text-lg font-bold text-navy-deep">아직 자료가 없습니다</div>
      <p className="mt-2 text-sm text-muted">
        {what}을(를) 보려면 먼저 자료 가져오기에서 CSV 또는 JSON 파일을 골라 주세요. 새로고침하면 자료가 사라지므로 파일을 다시 가져와야 합니다.
      </p>
      <Link
        href="/import"
        className="mt-5 inline-flex h-9 items-center rounded-md bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"
      >
        자료 가져오기로 이동
      </Link>
    </div>
  );
}

export function Notice({
  tone,
  title,
  children,
}: {
  tone: "info" | "warn" | "error";
  title?: string;
  children: ReactNode;
}) {
  const style =
    tone === "error"
      ? "border-bad-line bg-bad-bg text-bad"
      : tone === "warn"
        ? "border-warn-line bg-warn-bg text-warn"
        : "border-line bg-selected text-navy-deep";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${style}`}>
      {title ? <div className="font-bold">{title}</div> : null}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}
