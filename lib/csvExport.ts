// 선택 월·범위의 행만 CSV로 만듭니다. 원본 15열 + 계산 열 4개. 엑셀에서 한글이 깨지지 않게 BOM을 붙입니다.
import { metricsForMonth, indexRows, scopeSites, siteInfos } from "./calc";
import { COLUMNS, type Filters, type Row } from "./types";
import { NA, plain1 } from "./format";

export const EXTRA_HEADERS = ["기성률(%)", "공정차이(pp)", "상태", "당월기성액(백만원)"] as const;

const TEXT_COLUMNS = new Set<string>([
  "month",
  "siteId",
  "siteName",
  "region",
  "projectType",
  "startDate",
  "contractEndDate",
  "currentWork",
  "issueCategory",
  "issueSummary",
  "actionPlan",
]);

function guardFormula(text: string): string {
  // 엑셀이 수식으로 읽지 않도록 앞에 작은따옴표를 붙입니다.
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function quote(text: string): string {
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function numberText(v10: number): string {
  // 음수는 일반 하이픈(-)으로 씁니다. 엑셀이 숫자로 읽어야 하기 때문입니다.
  return plain1(v10).toFixed(1);
}

export function csvFileName(f: Filters): string {
  const part = (s: string) => s.replace(/[\\/:*?"<>|]/g, "_");
  return `현장공정기성_${f.month}_${part(f.region)}_${part(f.type)}_${part(f.siteId)}.csv`;
}

export function buildCsv(rows: Row[], filters: Filters): { text: string; dataRows: number } {
  const index = indexRows(rows);
  const scope = scopeSites(siteInfos(rows), filters).map((s) => s.siteId);
  const metrics = metricsForMonth(index, scope, filters.month);
  const header = [...COLUMNS, ...EXTRA_HEADERS].join(",");
  const lines = metrics.map((m) => {
    const cells: string[] = COLUMNS.map((c) => {
      const v = m.row[c];
      return TEXT_COLUMNS.has(c) ? quote(guardFormula(String(v))) : String(v);
    });
    cells.push(
      numberText(m.rate10),
      numberText(m.gap10),
      m.status,
      m.monthly10 === null ? NA : numberText(m.monthly10),
    );
    return cells.join(",");
  });
  return { text: "﻿" + [header, ...lines].join("\r\n") + "\r\n", dataRows: lines.length };
}
