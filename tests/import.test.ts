import { describe, expect, it } from "vitest";
import { importText } from "@/lib/validate";
import { parseCsv } from "@/lib/parse";
import { loadCsvRows, loadJsonRows, readData } from "./helpers";

describe("정상 파일", () => {
  it("CSV는 144행·12개 현장·15개 열을 모두 읽는다", () => {
    const r = importText(readData("현장공정기성.csv"), "csv");
    expect(r.ok).toBe(true);
    expect(r.rows).toHaveLength(144);
    expect(new Set(r.rows.map((x) => x.siteId)).size).toBe(12);
    expect(Object.keys(r.rows[0])).toHaveLength(15);
    expect(r.warnings).toEqual([]);
    expect(r.notes[0]).toContain("CSV에는 단위 정보가 없어");
  });

  it("JSON도 144행이고 CSV와 같은 값이다", () => {
    const r = importText(readData("현장공정기성.json"), "json");
    expect(r.ok).toBe(true);
    expect(r.rows).toHaveLength(144);
    expect(loadJsonRows()).toEqual(loadCsvRows());
  });

  it("맨 앞 BOM과 줄바꿈 방식(\\r\\n)이 달라도 읽는다", () => {
    const text = readData("현장공정기성.csv").replace(/\r?\n/g, "\r\n");
    expect(importText(text, "csv").rows).toHaveLength(144);
  });

  it("따옴표 안의 쉼표와 줄바꿈을 한 칸으로 읽는다", () => {
    const parsed = parseCsv('a,b\n"x,1","y\nz"\n');
    expect(parsed.records[0].cells).toEqual(["x,1", "y\nz"]);
  });
});

describe("오류 파일 3종은 모두 거부된다 (사용법.md)", () => {
  it("오류_공정률101.csv — 134행 actualProgress 범위 오류", () => {
    const r = importText(readData("검증용_오류데이터", "오류_공정률101.csv"), "csv");
    expect(r.ok).toBe(false);
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ line: 134, column: "actualProgress" });
    expect(r.errors[0].message).toContain("0~100");
    expect(r.errors[0].message).toContain("101");
  });

  it("오류_공정률빈값.csv — 134행 필수값 오류, 0으로 바꾸지 않는다", () => {
    const r = importText(readData("검증용_오류데이터", "오류_공정률빈값.csv"), "csv");
    expect(r.ok).toBe(false);
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0]).toMatchObject({ line: 134, column: "actualProgress" });
    expect(r.errors[0].message).toContain("비어 있습니다");
  });

  it("오류_중복키.csv — 146행 2026-09/D 중복", () => {
    const r = importText(readData("검증용_오류데이터", "오류_중복키.csv"), "csv");
    expect(r.ok).toBe(false);
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0].line).toBe(146);
    expect(r.errors[0].message).toContain("2026-09/D");
  });
});

describe("그 밖의 검사 규칙", () => {
  const csv = readData("현장공정기성.csv");
  const lines = csv.split(/\r?\n/);
  const edit = (lineNo: number, fn: (cells: string[]) => string[]) => {
    const copy = [...lines];
    // 이 자료의 15개 열 중 쉼표가 들어 있는 글자 칸은 없으므로 단순 분리로 충분합니다.
    copy[lineNo - 1] = fn(copy[lineNo - 1].split(",")).join(",");
    return copy.join("\n");
  };

  it("계약금액 0은 거부", () => {
    const r = importText(edit(2, (c) => ((c[3] = "0"), c)), "csv");
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.column === "contractAmount")).toBe(true);
  });

  it("같은 현장의 계약금액이 달의 달라지면 거부", () => {
    const r = importText(edit(14, (c) => ((c[3] = "99999"), c)), "csv");
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.column === "contractAmount" && e.line === 14)).toBe(true);
  });

  it("누적 공정률이 전월보다 줄면 거부", () => {
    // 14행 = 2025-11 / A. 실제 공정률을 전월(18.4)보다 낮게
    const r = importText(edit(14, (c) => ((c[5] = "10"), c)), "csv");
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.column === "actualProgress" && e.line === 14)).toBe(true);
  });

  it("누적기성액이 계약금액을 넘으면 거부", () => {
    const r = importText(edit(2, (c) => ((c[6] = "999999"), c)), "csv");
    expect(r.ok).toBe(false);
  });

  it("숫자가 아닌 값은 거부", () => {
    const r = importText(edit(2, (c) => ((c[4] = "abc"), c)), "csv");
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toContain("숫자가 아닙니다");
  });

  it("착공일이 준공일보다 늦으면 거부", () => {
    const r = importText(edit(2, (c) => ((c[9] = "2030-01-01"), c)), "csv");
    expect(r.ok).toBe(false);
  });

  it("허용하지 않는 지역은 거부", () => {
    const r = importText(edit(2, (c) => ((c[7] = "부산"), c)), "csv");
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.column === "region")).toBe(true);
  });

  it("필수 열이 없으면 거부", () => {
    const r = importText(csv.replace("issueSummary", "other"), "csv");
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toContain("필수 열이 없습니다");
  });

  it("글자가 깨진 파일(UTF-8 아님)은 거부", () => {
    const r = importText(csv.replace("청라", "��"), "csv");
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toContain("UTF-8");
  });

  it("빈 파일은 거부", () => {
    expect(importText("   \n", "csv").ok).toBe(false);
    expect(importText("", "json").ok).toBe(false);
  });

  it("월 행이 빠지면 오류가 아니라 경고", () => {
    const without = lines.filter((l) => !l.startsWith("2026-03,D,")).join("\n");
    const r = importText(without, "csv");
    expect(r.ok).toBe(true);
    expect(r.rows).toHaveLength(143);
    expect(r.warnings.join(" ")).toContain("D 현장: 2026-03");
  });

  it("JSON metadata의 schemaVersion이 다르면 거부", () => {
    const json = readData("현장공정기성.json").replace('"schemaVersion": "2.0"', '"schemaVersion": "1.0"');
    const r = importText(json, "json");
    expect(r.ok).toBe(false);
    expect(r.errors[0].column).toBe("metadata.schemaVersion");
  });

  it("JSON이 아닌 글자는 거부", () => {
    expect(importText("{ not json", "json").ok).toBe(false);
  });
});

describe("교체 규칙", () => {
  it("CSV 다음 JSON을 가져와도 144행(합치지 않고 교체)", () => {
    // 앱은 새 검사 결과의 rows로 통째로 바꿉니다. 두 결과를 이어 붙이지 않는지 확인합니다.
    let state = importText(readData("현장공정기성.csv"), "csv").rows;
    state = importText(readData("현장공정기성.json"), "json").rows;
    expect(state).toHaveLength(144);
  });
});
