"use client";

import { useState } from "react";
import { sitesByRegionType } from "@/lib/calc";
import { buildCsv, csvFileName } from "@/lib/csvExport";
import { ALL, PROJECT_TYPES, REGIONS } from "@/lib/types";
import { useData } from "./Providers";
import { Notice } from "./ui";

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-muted">
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 min-w-[9rem] rounded-md border border-line-strong bg-white px-2 text-[13px] font-medium text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar() {
  const { rows, dash, filters, setFilters, filterNotice, warnings } = useData();
  const [exportError, setExportError] = useState<string | null>(null);
  if (!rows || !dash) return null;

  const present = new Set(dash.infos.flatMap((s) => [s.region, s.projectType]));
  const regionOptions = [
    { value: ALL, label: "전체 지역" },
    ...REGIONS.filter((r) => present.has(r)).map((r) => ({ value: r, label: r })),
  ];
  const typeOptions = [
    { value: ALL, label: "전체 유형" },
    ...PROJECT_TYPES.filter((t) => present.has(t)).map((t) => ({ value: t, label: t })),
  ];
  const siteOptions = [
    { value: ALL, label: `전체 현장 (${sitesByRegionType(dash.infos, filters).length}곳)` },
    ...sitesByRegionType(dash.infos, filters).map((s) => ({
      value: s.siteId,
      label: `${s.siteId} · ${s.siteName.replace("[가상] ", "")}`,
    })),
  ];
  const monthOptions = dash.months.map((m) => ({ value: m, label: m }));

  const exportDisabled = dash.siteMetrics.length === 0;
  const onExport = () => {
    setExportError(null);
    try {
      const { text } = buildCsv(rows, filters);
      const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = csvFileName(filters);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("파일을 만들지 못했습니다. 다시 눌러 주세요.");
    }
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="rounded-md border border-line bg-white p-3 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-xs font-bold text-navy-deep">분석 필터</span>
          <Select label="기준월" value={filters.month} onChange={(v) => setFilters({ month: v })} options={monthOptions} />
          <Select label="지역" value={filters.region} onChange={(v) => setFilters({ region: v })} options={regionOptions} />
          <Select label="공사 유형" value={filters.type} onChange={(v) => setFilters({ type: v })} options={typeOptions} />
          <Select label="현장" value={filters.siteId} onChange={(v) => setFilters({ siteId: v })} options={siteOptions} />
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="ml-auto inline-flex h-8 items-center rounded-md bg-navy px-3 text-[13px] font-semibold text-white hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
          >
            CSV 내보내기
          </button>
        </div>
        {exportDisabled ? (
          <p className="mt-2 text-xs text-subtle">내보낼 자료가 없습니다. 지금 범위에 해당하는 현장이 없습니다.</p>
        ) : null}
      </div>
      {filterNotice ? <Notice tone="info">{filterNotice}</Notice> : null}
      {exportError ? <Notice tone="error">{exportError}</Notice> : null}
      {warnings.length > 0 ? (
        <Notice tone="warn" title="가져온 자료에 빠진 월이 있습니다. 확인 가능한 행만 집계합니다.">
          <ul className="list-disc pl-5">
            {warnings.slice(0, 5).map((w) => (
              <li key={w}>{w}</li>
            ))}
            {warnings.length > 5 ? <li>외 {warnings.length - 5}건</li> : null}
          </ul>
        </Notice>
      ) : null}
      {dash.missingInMonth.length > 0 && dash.scope.length > 0 ? (
        <Notice tone="warn">
          {filters.month} 자료가 없는 현장: {dash.missingInMonth.join(", ")}. 확인 가능한 행만 집계했습니다.
        </Notice>
      ) : null}
    </div>
  );
}
