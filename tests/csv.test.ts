import { describe, expect, it } from "vitest";
import { buildCsv, csvFileName } from "@/lib/csvExport";
import { parseCsv } from "@/lib/parse";
import { COLUMNS, DEFAULT_FILTERS, type Filters } from "@/lib/types";
import { loadCsvRows } from "./helpers";

const rows = loadCsvRows();
const at = (f: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...f });

describe("CSV 내보내기", () => {
  it("9월 D만 고르면 헤더 아래 1행, 열은 15 + 4개", () => {
    const { text, dataRows } = buildCsv(rows, at({ siteId: "D" }));
    expect(dataRows).toBe(1);
    const parsed = parseCsv(text);
    expect(parsed.headers).toHaveLength(COLUMNS.length + 4);
    expect(parsed.headers.slice(-4)).toEqual(["기성률(%)", "공정차이(pp)", "상태", "당월기성액(백만원)"]);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0].cells.slice(-4)).toEqual(["69.4", "-10.7", "점검", "3339.6"]);
  });

  it("9월 인천·공동주택은 2행(A·G)", () => {
    const { text, dataRows } = buildCsv(rows, at({ region: "인천", type: "공동주택" }));
    expect(dataRows).toBe(2);
    const parsed = parseCsv(text);
    expect(parsed.records.map((r) => r.cells[1])).toEqual(["A", "G"]);
  });

  it("9월 전체는 12행이고 선택 월 행만 들어 있다", () => {
    const { text, dataRows } = buildCsv(rows, at({}));
    expect(dataRows).toBe(12);
    const parsed = parseCsv(text);
    expect(new Set(parsed.records.map((r) => r.cells[0]))).toEqual(new Set(["2026-09"]));
  });

  it("UTF-8 BOM으로 시작하고 줄바꿈은 \\r\\n이다", () => {
    const { text } = buildCsv(rows, at({}));
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("\r\n");
  });

  it("2025-10의 당월기성액 칸은 '계산 불가'이고 0이나 누적액이 아니다", () => {
    const { text } = buildCsv(rows, at({ month: "2025-10" }));
    const parsed = parseCsv(text);
    for (const r of parsed.records) expect(r.cells[r.cells.length - 1]).toBe("계산 불가");
  });

  it("J의 7월 당월기성액은 0.0으로 내보낸다", () => {
    const { text } = buildCsv(rows, at({ siteId: "J", month: "2026-07" }));
    const parsed = parseCsv(text);
    expect(parsed.records[0].cells.slice(-1)).toEqual(["0.0"]);
  });

  it("원본 열 값은 그대로 보존된다", () => {
    const { text } = buildCsv(rows, at({ siteId: "D" }));
    const cells = parseCsv(text).records[0].cells;
    expect(cells.slice(0, 15)).toEqual(
      COLUMNS.map((c) => String(rows.find((r) => r.month === "2026-09" && r.siteId === "D")![c])),
    );
  });

  it("글자 칸이 수식 문자로 시작하면 작은따옴표를 붙이고, 쉼표·따옴표는 감싼다", () => {
    const evil = rows.map((r) =>
      r.month === "2026-09" && r.siteId === "D"
        ? { ...r, issueSummary: '=1+1, "인용"', actionPlan: "-cmd" }
        : r,
    );
    const { text } = buildCsv(evil, at({ siteId: "D" }));
    const cells = parseCsv(text).records[0].cells;
    expect(cells[13]).toBe("'=1+1, \"인용\"");
    expect(cells[14]).toBe("'-cmd");
  });

  it("범위에 현장이 없으면 데이터 0행", () => {
    expect(buildCsv(rows, at({ region: "인천", type: "물류시설" })).dataRows).toBe(0);
  });

  it("파일 이름에 월·지역·유형·현장이 들어간다", () => {
    expect(csvFileName(at({ siteId: "D" }))).toBe("현장공정기성_2026-09_전체_전체_D.csv");
  });
});
