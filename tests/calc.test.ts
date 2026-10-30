import { describe, expect, it } from "vitest";
import {
  aggregate,
  buildDashboard,
  inspectionRank,
  normalizeFilters,
  rdiv,
  siteInfos,
  statusOf,
} from "@/lib/calc";
import { amount, num1, pct, pp } from "@/lib/format";
import { ALL, DEFAULT_FILTERS, type Filters } from "@/lib/types";
import { loadCsvRows } from "./helpers";

const rows = loadCsvRows();
const at = (f: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...f });

describe("월별 전체 현장 (검산표)", () => {
  // 월, 누적기성액, 기성률, 가중 계획, 가중 실제, 공정차이, 당월기성액, 정상, 주의, 점검
  const table: [string, string, string, string, string, string, string, number, number, number][] = [
    ["2025-10", "105,449.7", "16.7%", "19.4%", "19.6%", "+0.2pp", "계산 불가", 10, 2, 0],
    ["2025-11", "125,857.8", "20.0%", "22.8%", "23.2%", "+0.3pp", "20,408.1", 10, 2, 0],
    ["2025-12", "148,530.2", "23.6%", "26.9%", "27.0%", "+0.2pp", "22,672.4", 9, 3, 0],
    ["2026-01", "173,599.9", "27.5%", "31.4%", "31.3%", "−0.1pp", "25,069.7", 9, 3, 0],
    ["2026-02", "202,848.9", "32.2%", "36.7%", "36.2%", "−0.4pp", "29,249.0", 8, 4, 0],
    ["2026-03", "233,981.1", "37.1%", "42.4%", "41.6%", "−0.8pp", "31,132.2", 8, 3, 1],
    ["2026-04", "266,640.0", "42.3%", "48.6%", "47.1%", "−1.5pp", "32,658.9", 8, 2, 2],
    ["2026-05", "300,878.0", "47.7%", "54.8%", "52.9%", "−1.9pp", "34,238.0", 8, 1, 3],
    ["2026-06", "335,344.9", "53.2%", "60.7%", "58.3%", "−2.4pp", "34,466.9", 7, 2, 3],
    ["2026-07", "364,718.5", "57.8%", "65.8%", "63.2%", "−2.6pp", "29,373.6", 6, 2, 4],
    ["2026-08", "395,184.7", "62.7%", "69.9%", "67.6%", "−2.3pp", "30,466.2", 6, 2, 4],
    ["2026-09", "424,063.4", "67.2%", "73.2%", "71.2%", "−2.0pp", "28,878.7", 6, 3, 3],
  ];

  it("9월을 선택하면 추이가 12개 월이다", () => {
    const d = buildDashboard(rows, at({ month: "2026-09" }));
    expect(d.trend).toHaveLength(12);
    expect(d.siteMetrics).toHaveLength(12);
  });

  for (const [month, earned, rate, plan, actual, gap, monthly, ok, warn, bad] of table) {
    it(`${month} 전체 값이 검산표와 같다`, () => {
      const d = buildDashboard(rows, at({ month }));
      const a = d.agg;
      expect(amount(a.contract10)).toBe("630,700");
      expect(num1(a.earned10)).toBe(earned);
      expect(pct(a.rate10)).toBe(rate);
      expect(pct(a.planned10)).toBe(plan);
      expect(pct(a.actual10)).toBe(actual);
      expect(pp(a.gap10)).toBe(gap);
      expect(num1(a.monthly10)).toBe(monthly);
      expect([a.counts["정상"], a.counts["주의"], a.counts["점검"]]).toEqual([ok, warn, bad]);
    });
  }
});

describe("2026-09 현장별 (검산표)", () => {
  // ID, 계획, 실제, 차이, 누적기성액, 기성률, 당월기성액, 상태
  const sites: [string, string, string, string, string, string, string, string][] = [
    ["A", "75.4%", "77.1%", "+1.7pp", "63,763.2", "73.8%", "4,665.6", "정상"],
    ["B", "80.3%", "82.1%", "+1.8pp", "41,395.2", "78.4%", "3,854.4", "정상"],
    ["C", "94.8%", "96.2%", "+1.4pp", "41,040.0", "95.0%", "1,166.4", "정상"],
    ["D", "86.5%", "75.8%", "−10.7pp", "50,384.4", "69.4%", "3,339.6", "점검"],
    ["E", "99.4%", "99.7%", "+0.3pp", "18,635.4", "98.6%", "302.4", "정상"],
    ["F", "68.7%", "65.3%", "−3.4pp", "22,082.5", "60.5%", "2,117.0", "주의"],
    ["G", "52.8%", "54.4%", "+1.6pp", "49,448.7", "50.1%", "3,849.3", "정상"],
    ["H", "31.2%", "29.4%", "−1.8pp", "11,369.6", "27.2%", "543.4", "주의"],
    ["I", "73.2%", "65.6%", "−7.6pp", "34,963.2", "60.7%", "3,052.8", "점검"],
    ["J", "95.8%", "95.0%", "−0.8pp", "30,034.8", "92.7%", "1,393.2", "주의"],
    ["K", "71.0%", "65.6%", "−5.4pp", "39,446.0", "60.5%", "3,586.0", "점검"],
    ["L", "88.1%", "90.3%", "+2.2pp", "21,500.4", "87.4%", "1,008.6", "정상"],
  ];
  const d = buildDashboard(rows, at({}));

  for (const [id, plan, actual, gap, earned, rate, monthly, status] of sites) {
    it(`${id} 현장`, () => {
      const m = d.siteMetrics.find((x) => x.row.siteId === id)!;
      expect(pct(m.planned10)).toBe(plan);
      expect(pct(m.actual10)).toBe(actual);
      expect(pp(m.gap10)).toBe(gap);
      expect(num1(m.earned10)).toBe(earned);
      expect(pct(m.rate10)).toBe(rate);
      expect(num1(m.monthly10)).toBe(monthly);
      expect(m.status).toBe(status);
    });
  }

  it("점검 순서는 D → I → K", () => {
    const rank = inspectionRank(d.siteMetrics);
    expect(rank.map((m) => m.row.siteId)).toEqual(["D", "I", "K"]);
    expect(rank.map((m) => pp(m.gap10))).toEqual(["−10.7pp", "−7.6pp", "−5.4pp"]);
  });
});

describe("2026-09 지역별 필터 (검산표)", () => {
  const regions: [string, number, string, string, string, number, number, number][] = [
    ["인천", 2, "185,100", "113,211.9", "61.2%", 2, 0, 0],
    ["경기", 4, "210,400", "144,189.2", "68.5%", 2, 1, 1],
    ["충남", 2, "55,400", "40,717.9", "73.5%", 1, 1, 0],
    ["충북", 1, "57,600", "34,963.2", "60.7%", 0, 0, 1],
    ["세종", 1, "32,400", "30,034.8", "92.7%", 0, 1, 0],
    ["강원", 1, "65,200", "39,446.0", "60.5%", 0, 0, 1],
    ["대전", 1, "24,600", "21,500.4", "87.4%", 1, 0, 0],
  ];
  for (const [region, n, contract, earned, rate, ok, warn, bad] of regions) {
    it(region, () => {
      const d = buildDashboard(rows, at({ region }));
      expect(d.scope).toHaveLength(n);
      expect(amount(d.agg.contract10)).toBe(contract);
      expect(num1(d.agg.earned10)).toBe(earned);
      expect(pct(d.agg.rate10)).toBe(rate);
      expect([d.agg.counts["정상"], d.agg.counts["주의"], d.agg.counts["점검"]]).toEqual([ok, warn, bad]);
    });
  }
});

describe("상태 경계와 계산 규칙", () => {
  it("계획 70·실제 70 / 65.1 / 65 → 정상 / 주의 / 점검", () => {
    expect(statusOf(700 - 700)).toBe("정상");
    expect(statusOf(651 - 700)).toBe("주의");
    expect(statusOf(650 - 700)).toBe("점검");
  });

  it(".5는 0에서 먼 쪽으로 반올림한다", () => {
    expect(rdiv(5, 10)).toBe(1);
    expect(rdiv(-5, 10)).toBe(-1);
    expect(rdiv(14, 10)).toBe(1);
    expect(rdiv(-14, 10)).toBe(-1);
  });

  it("D 9월 기성률 50,384.4 / 72,600 = 69.4%", () => {
    const d = buildDashboard(rows, at({ siteId: "D" }));
    expect(pct(d.agg.rate10)).toBe("69.4%");
  });

  it("D의 최근 공정차이는 8월 −11.2pp → 9월 −10.7pp", () => {
    const aug = buildDashboard(rows, at({ siteId: "D", month: "2026-08" }));
    const sep = buildDashboard(rows, at({ siteId: "D", month: "2026-09" }));
    expect(pp(aug.agg.gap10)).toBe("−11.2pp");
    expect(pp(sep.agg.gap10)).toBe("−10.7pp");
  });

  it("J의 7월 당월기성액은 0.0이고 계산 불가와 구별된다", () => {
    const jul = buildDashboard(rows, at({ siteId: "J", month: "2026-07" }));
    expect(jul.agg.monthly10).toBe(0);
    expect(num1(jul.agg.monthly10)).toBe("0.0");
    const aug = buildDashboard(rows, at({ siteId: "J", month: "2026-08" }));
    expect(num1(aug.agg.monthly10)).toBe("2,332.8");
  });

  it("2025-10의 당월기성액은 계산 불가이고 누적액으로 대신하지 않는다", () => {
    const d = buildDashboard(rows, at({ month: "2025-10" }));
    expect(d.agg.monthly10).toBeNull();
    expect(num1(d.agg.monthly10)).toBe("계산 불가");
    expect(d.trend).toHaveLength(1);
  });

  it("범위 안 현장 중 하나라도 전월이 없으면 전체 당월기성액은 계산 불가", () => {
    const without = rows.filter((r) => !(r.siteId === "D" && r.month === "2026-08"));
    const d = buildDashboard(without, at({ month: "2026-09" }));
    expect(d.agg.monthly10).toBeNull();
    // 다른 현장 값은 그대로 계산된다
    expect(d.siteMetrics.find((m) => m.row.siteId === "D")!.monthly10).toBeNull();
    expect(d.siteMetrics.find((m) => m.row.siteId === "A")!.monthly10).not.toBeNull();
  });

  it("자료가 없는 범위는 0%가 아니라 계산 불가", () => {
    const d = buildDashboard(rows, at({ region: "인천", type: "물류시설" }));
    expect(d.scope).toHaveLength(0);
    expect(pct(d.agg.rate10)).toBe("계산 불가");
    expect(d.agg.siteCount).toBe(0);
    expect(aggregate([], 0).monthly10).toBeNull();
  });
});

describe("필터", () => {
  it("9월 인천·공동주택은 A·G 2곳", () => {
    const d = buildDashboard(rows, at({ region: "인천", type: "공동주택" }));
    expect(d.scope.map((s) => s.siteId)).toEqual(["A", "G"]);
    expect(d.siteMetrics).toHaveLength(2);
  });

  it("지역을 바꿔 고른 현장이 범위에서 빠지면 현장을 전체로 되돌린다", () => {
    const infos = siteInfos(rows);
    const r = normalizeFilters(infos, at({ siteId: "D", region: "인천" }));
    expect(r.siteReset).toBe(true);
    expect(r.filters.siteId).toBe(ALL);
    const keep = normalizeFilters(infos, at({ siteId: "A", region: "인천" }));
    expect(keep.siteReset).toBe(false);
    expect(keep.filters.siteId).toBe("A");
  });
});
