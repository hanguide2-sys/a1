// 가져오기 검사: 오류가 하나라도 있으면 반영하지 않습니다. 빈칸을 0으로 바꾸지 않습니다.
import { parseCsv, parseJson } from "./parse";
import {
  COLUMNS,
  MONTH_MAX,
  MONTH_MIN,
  NUMBER_COLUMNS,
  PROJECT_TYPES,
  REGIONS,
  type ColumnName,
  type ImportIssue,
  type ImportResult,
  type Row,
} from "./types";

const CSV_NOTE = "CSV에는 단위 정보가 없어 설명서 기준(금액 백만원, 비율 %)으로 읽었습니다.";
const JSON_ARRAY_NOTE = "JSON에 metadata가 없어 설명서 기준(금액 백만원, 비율 %)으로 읽었습니다.";
const SITE_FIXED: ColumnName[] = [
  "siteName",
  "region",
  "projectType",
  "contractAmount",
  "startDate",
  "contractEndDate",
];

type Raw = { line: number; values: Partial<Record<ColumnName, unknown>> };

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function monthEnd(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(last).padStart(2, "0")}`;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value.trim());
  return null;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

/** 한 행의 값 검사. 문제가 있으면 issues에 추가하고 null을 돌려줍니다. */
function checkRow(raw: Raw, jsonSource: boolean, issues: ImportIssue[]): Row | null {
  const before = issues.length;
  const add = (column: ColumnName, message: string) =>
    issues.push({ line: raw.line, column, message });

  for (const column of COLUMNS) {
    const v = raw.values[column];
    if (isBlank(v)) {
      add(column, "값이 비어 있습니다. 빈칸은 0으로 바꾸지 않고 오류로 처리합니다.");
      continue;
    }
    if (NUMBER_COLUMNS.includes(column)) {
      if (jsonSource && typeof v !== "number") {
        add(column, `숫자여야 합니다(받은 값: ${String(v)}).`);
      } else if (toNumber(v) === null) {
        add(column, `숫자가 아닙니다(받은 값: ${String(v)}).`);
      }
    } else if (typeof v !== "string") {
      add(column, `글자여야 합니다(받은 값: ${String(v)}).`);
    }
  }
  if (issues.length > before) return null;

  const s = (c: ColumnName) => String(raw.values[c]).trim();
  const n = (c: ColumnName) => toNumber(raw.values[c]) as number;

  const row: Row = {
    month: s("month"),
    siteId: s("siteId"),
    siteName: s("siteName"),
    contractAmount: n("contractAmount"),
    plannedProgress: n("plannedProgress"),
    actualProgress: n("actualProgress"),
    cumulativeEarned: n("cumulativeEarned"),
    region: s("region"),
    projectType: s("projectType"),
    startDate: s("startDate"),
    contractEndDate: s("contractEndDate"),
    currentWork: s("currentWork"),
    issueCategory: s("issueCategory"),
    issueSummary: s("issueSummary"),
    actionPlan: s("actionPlan"),
  };

  if (!/^\d{4}-\d{2}$/.test(row.month) || row.month < MONTH_MIN || row.month > MONTH_MAX) {
    add("month", `${MONTH_MIN}~${MONTH_MAX} 범위의 YYYY-MM 형식이어야 합니다(받은 값: ${row.month}).`);
  }
  if (!/^[A-L]$/.test(row.siteId)) {
    add("siteId", `현장 ID는 A~L 중 하나여야 합니다(받은 값: ${row.siteId}).`);
  }
  if (!row.siteName.startsWith("[가상]")) {
    add("siteName", "현장명에 [가상] 표시가 있어야 합니다.");
  }
  if (!(row.contractAmount > 0)) {
    add("contractAmount", `0보다 커야 합니다(받은 값: ${row.contractAmount}).`);
  }
  for (const c of ["plannedProgress", "actualProgress"] as const) {
    if (row[c] < 0 || row[c] > 100) {
      add(c, `0~100 범위를 벗어났습니다(받은 값: ${row[c]}).`);
    }
  }
  if (row.cumulativeEarned < 0 || row.cumulativeEarned > row.contractAmount) {
    add(
      "cumulativeEarned",
      `0 이상 계약금액(${row.contractAmount}) 이하여야 합니다(받은 값: ${row.cumulativeEarned}).`,
    );
  }
  if (!REGIONS.includes(row.region)) {
    add("region", `허용 지역(${REGIONS.join("·")})이 아닙니다(받은 값: ${row.region}).`);
  }
  if (!PROJECT_TYPES.includes(row.projectType)) {
    add("projectType", `허용 유형(${PROJECT_TYPES.join("·")})이 아닙니다(받은 값: ${row.projectType}).`);
  }
  const startOk = isValidDate(row.startDate);
  const endOk = isValidDate(row.contractEndDate);
  if (!startOk) add("startDate", `YYYY-MM-DD 날짜가 아닙니다(받은 값: ${row.startDate}).`);
  if (!endOk) add("contractEndDate", `YYYY-MM-DD 날짜가 아닙니다(받은 값: ${row.contractEndDate}).`);
  if (startOk && endOk) {
    if (row.startDate >= row.contractEndDate) {
      add("startDate", "착공일이 계약상 준공일보다 늦거나 같습니다.");
    } else if (/^\d{4}-\d{2}$/.test(row.month) && monthEnd(row.month) < row.startDate) {
      add("month", `월말 기준일(${monthEnd(row.month)})이 착공일(${row.startDate})보다 앞섭니다.`);
    }
  }
  return issues.length > before ? null : row;
}

function crossCheck(entries: { line: number; row: Row }[], issues: ImportIssue[]) {
  // 같은 월·현장 중복
  const seen = new Map<string, number>();
  const unique: { line: number; row: Row }[] = [];
  for (const e of entries) {
    const key = `${e.row.month}/${e.row.siteId}`;
    const first = seen.get(key);
    if (first !== undefined) {
      issues.push({
        line: e.line,
        column: "month, siteId",
        message: `중복된 행입니다: ${key} (${first}행과 같은 월·현장).`,
      });
    } else {
      seen.set(key, e.line);
      unique.push(e);
    }
  }

  // 같은 현장의 고정 정보 일치
  const firstBySite = new Map<string, Row>();
  for (const e of unique) {
    const base = firstBySite.get(e.row.siteId);
    if (!base) {
      firstBySite.set(e.row.siteId, e.row);
      continue;
    }
    for (const c of SITE_FIXED) {
      if (base[c] !== e.row[c]) {
        issues.push({
          line: e.line,
          column: c,
          message: `현장 ${e.row.siteId}의 ${c} 값이 다른 달과 다릅니다(${String(base[c])} → ${String(e.row[c])}).`,
        });
      }
    }
  }

  // 누적 값 감소
  const bySite = new Map<string, { line: number; row: Row }[]>();
  for (const e of unique) {
    const list = bySite.get(e.row.siteId) ?? [];
    list.push(e);
    bySite.set(e.row.siteId, list);
  }
  const monotone = ["plannedProgress", "actualProgress", "cumulativeEarned"] as const;
  for (const list of bySite.values()) {
    list.sort((a, b) => (a.row.month < b.row.month ? -1 : 1));
    for (let i = 1; i < list.length; i++) {
      for (const c of monotone) {
        if (list[i].row[c] < list[i - 1].row[c]) {
          issues.push({
            line: list[i].line,
            column: c,
            message: `${list[i].row.siteId} 현장의 ${c}이(가) 전월(${list[i - 1].row.month})보다 줄었습니다(${list[i - 1].row[c]} → ${list[i].row[c]}).`,
          });
        }
      }
    }
  }
  return unique;
}

function monthsBetween(min: string, max: string): string[] {
  const out: string[] = [];
  let [y, m] = min.split("-").map(Number);
  const [ey, em] = max.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function missingMonthWarnings(rows: Row[]): string[] {
  if (rows.length === 0) return [];
  const months = rows.map((r) => r.month).sort();
  const expected = monthsBetween(months[0], months[months.length - 1]);
  const bySite = new Map<string, Set<string>>();
  for (const r of rows) {
    const set = bySite.get(r.siteId) ?? new Set<string>();
    set.add(r.month);
    bySite.set(r.siteId, set);
  }
  const warnings: string[] = [];
  for (const [siteId, set] of [...bySite.entries()].sort()) {
    const missing = expected.filter((m) => !set.has(m));
    if (missing.length > 0) {
      warnings.push(`${siteId} 현장: ${missing.join(", ")} 행이 없습니다. 확인 가능한 행만 집계하고, 전월이 없는 달의 당월기성액은 계산 불가입니다.`);
    }
  }
  return warnings;
}

function finish(
  format: "csv" | "json",
  entries: { line: number; row: Row }[],
  issues: ImportIssue[],
  notes: string[],
): ImportResult {
  const unique = crossCheck(entries, issues);
  issues.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  const rows = unique
    .map((e) => e.row)
    .sort((a, b) => (a.month === b.month ? a.siteId.localeCompare(b.siteId) : a.month < b.month ? -1 : 1));
  const ok = issues.length === 0;
  return {
    ok,
    errors: issues,
    warnings: ok ? missingMonthWarnings(rows) : [],
    rows: ok ? rows : [],
    format,
    notes,
  };
}

export function importCsv(text: string): ImportResult {
  const issues: ImportIssue[] = [];
  const { headers, records } = parseCsv(text);
  const missing = COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    issues.push({ line: 1, message: `필수 열이 없습니다: ${missing.join(", ")}` });
    return { ok: false, errors: issues, warnings: [], rows: [], format: "csv", notes: [CSV_NOTE] };
  }
  if (records.length === 0) {
    issues.push({ message: "자료 행이 없습니다. 헤더 아래에 144행 안팎의 자료가 필요합니다." });
    return { ok: false, errors: issues, warnings: [], rows: [], format: "csv", notes: [CSV_NOTE] };
  }
  const index = new Map(headers.map((h, i) => [h, i] as const));
  const entries: { line: number; row: Row }[] = [];
  for (const rec of records) {
    if (rec.cells.length !== headers.length) {
      issues.push({
        line: rec.line,
        message: `열 개수가 맞지 않습니다(헤더 ${headers.length}개, 이 행 ${rec.cells.length}개).`,
      });
      continue;
    }
    const values: Raw["values"] = {};
    for (const c of COLUMNS) values[c] = rec.cells[index.get(c) as number];
    const row = checkRow({ line: rec.line, values }, false, issues);
    if (row) entries.push({ line: rec.line, row });
  }
  return finish("csv", entries, issues, [CSV_NOTE]);
}

export function importJson(text: string): ImportResult {
  const issues: ImportIssue[] = [];
  const parsed = parseJson(text);
  if (!parsed.ok) {
    return {
      ok: false,
      errors: [{ message: parsed.message }],
      warnings: [],
      rows: [],
      format: "json",
      notes: [],
    };
  }
  const notes: string[] = [];
  if (parsed.metadata) {
    const m = parsed.metadata;
    if (m.schemaVersion !== "2.0") {
      issues.push({ column: "metadata.schemaVersion", message: `schemaVersion은 2.0이어야 합니다(받은 값: ${String(m.schemaVersion)}).` });
    }
    if (m.moneyUnit !== "백만원") {
      issues.push({ column: "metadata.moneyUnit", message: `moneyUnit은 백만원이어야 합니다(받은 값: ${String(m.moneyUnit)}).` });
    }
    if (m.progressUnit !== "percent_0_100") {
      issues.push({ column: "metadata.progressUnit", message: `progressUnit은 percent_0_100이어야 합니다(받은 값: ${String(m.progressUnit)}).` });
    }
    const req = Array.isArray(m.requiredFields) ? (m.requiredFields as unknown[]) : [];
    const lacking = COLUMNS.filter((c) => !req.includes(c));
    if (lacking.length > 0) {
      issues.push({ column: "metadata.requiredFields", message: `필수 필드 목록에 없는 열: ${lacking.join(", ")}` });
    }
    notes.push("JSON metadata(schemaVersion 2.0·단위·필수 필드)를 확인했습니다.");
  } else {
    notes.push(JSON_ARRAY_NOTE);
  }
  if (parsed.records.length === 0) {
    issues.push({ message: "records에 자료 행이 없습니다." });
  }
  const entries: { line: number; row: Row }[] = [];
  parsed.records.forEach((item, i) => {
    const line = i + 1;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      issues.push({ line, message: "행이 { 열이름: 값 } 형태가 아닙니다." });
      return;
    }
    const row = checkRow({ line, values: item as Raw["values"] }, true, issues);
    if (row) entries.push({ line, row });
  });
  return finish("json", entries, issues, notes);
}

/** 파일 전체 글자를 받아 형식에 맞게 검사합니다. 글자가 깨졌으면 거부합니다. */
export function importText(text: string, format: "csv" | "json"): ImportResult {
  if (text.includes("�")) {
    return {
      ok: false,
      errors: [{ message: "글자가 깨져 읽을 수 없습니다. UTF-8로 저장된 파일만 가져올 수 있습니다." }],
      warnings: [],
      rows: [],
      format,
      notes: [],
    };
  }
  if (text.trim() === "") {
    return {
      ok: false,
      errors: [{ message: "빈 파일입니다." }],
      warnings: [],
      rows: [],
      format,
      notes: [],
    };
  }
  return format === "csv" ? importCsv(text) : importJson(text);
}
