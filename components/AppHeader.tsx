"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "./Providers";

const MENU = [
  { href: "/", label: "현황 요약" },
  { href: "/compare", label: "현장별 비교표" },
  { href: "/import", label: "자료 가져오기" },
  { href: "/ask", label: "AI에게 묻기" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { dash, filters, sourceName } = useData();
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1480px] flex-wrap items-center gap-x-8 gap-y-2 px-6">
        <div className="flex items-center gap-3 py-3">
          <div
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-md bg-navy text-sm font-bold text-white"
          >
            공
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-navy-deep">현장 공정·기성 대시보드</div>
            <div className="text-[11px] text-subtle">교육용 가상 자료</div>
          </div>
        </div>
        {/* 같은 페이지 안에서 이동해야 가져온 자료가 사라지지 않으므로 Link만 씁니다. */}
        <nav aria-label="주 메뉴" className="flex gap-1">
          {MENU.map((m) => {
            const active = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 px-3 py-4 text-sm font-semibold ${
                  active ? "border-navy text-navy" : "border-transparent text-muted hover:text-navy"
                }`}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted">
          {dash ? (
            <span className="rounded-md border border-line bg-head px-3 py-1.5 font-medium">
              {filters.month} 월말 기준 ({dash.infos.length}개 현장 자료{sourceName ? ` · ${sourceName}` : ""})
            </span>
          ) : (
            <span className="rounded-md border border-line bg-head px-3 py-1.5">자료 없음</span>
          )}
        </div>
      </div>
    </header>
  );
}
