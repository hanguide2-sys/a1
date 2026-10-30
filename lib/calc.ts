// 모든 계산은 이 파일 한 곳에서 합니다. 화면·CSV·AI가 같은 값을 씁니다.
// 값은 "10배한 정수"로 계산합니다(예: 67.2% → 672). 소수 오차를 막고, 마지막에 한 번만 반올림합니다.
import { ALL, type Filters, type Row, type Status } from "./types";

/** 원본 숫자를 10배한 정수로 */
export const t10 = (x: number): number => Math.round(x * 10);

/** n ÷ d 를 정수로 반올림합니다. .5는 0에서 먼 쪽으로(엑셀 ROUND와 같음). 정수만 사용해 오차가 없습니다. */
export function rdiv(n: number, d: number): number {
  if (d === 0) throw new Error("분모가 0입니다.");
  const sign = n < 0 !== d < 0 ? -1 : 1;
  const an = Math.abs(n);
  const ad = Math.abs(d);
  const x = 2 * an + ad;
  const y = 2 * ad;
  const q = (x - (x % y)) / y;
  return sign * q;
}

export function statusOf(gap10: number): Status {
  if (gap10 >= 0) return "정상";
  if (gap10 <= -50) return "점검";
  return "주의";
}

export type SiteInfo = {
  siteId: string;
  siteName: string;
  region: string;
  projectType: string;
  contractAmount: number;
  startDate: string;
  contractEndDate: string;
};

export type SiteMetrics = {
  row: Row;
  contract10: number;
  planned10: number;
  actual10: number;
  earned10: number;
  /** 기성률(%) × 10 */
  rate10: number;
  /** 공정차이(pp) × 10 = 실제 − 계획 */
  gap10: number;
  status: Status;
  /** 당월기성액(백만원) × 10. 전월 행이 없으면 null(계산 불가) */
  monthly10: number | null;
};

export type Aggregate = {
  siteCount: number;
  contract10: number | null;
  earned10: number | null;
  rate10: number | null;
  planned10: number | null;
  actual10: number | null;
  gap10: number | null;
  monthly10: number | null;
  counts: Record<Status, number>;
};

export type TrendPoint = { month: string; agg: Aggregate };

export type Dashboard = {
  months: string[];
  infos: SiteInfo[];
  scope: SiteInfo[];
  siteMetrics: SiteMetrics[];
  agg: Aggregate;
  trend: TrendPoint[];
  /** 범위에는 있지만 선택 월 행이 없는 현장 ID */
  missingInMonth: string[];
};

export type RowIndex = Map<string, Row>;

export function indexRows(rows: Row[]): RowIndex {
  return new Map(rows.map((r) => [`${r.month}|${r.siteId}`, r]));
}

/** 바로 전월(달력 기준) */
export function prevMonth(month: string): string {
  let [y, m] = month.split("-").map(Number);
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function monthList(rows: Row[]): string[] {
  return [...new Set(rows.map((r) => r.month))].sort();
}

export function siteInfos(rows: Row[]): SiteInfo[] {
  const map = new Map<string, SiteInfo>();
  for (const r of rows) {
    if (!map.has(r.siteId)) {
      map.set(r.siteId, {
        siteId: r.siteId,
        siteName: r.siteName,
        region: r.region,
        projectType: r.projectType,
        contractAmount: r.contractAmount,
        startDate: r.startDate,
        contractEndDate: r.contractEndDate,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.siteId.localeCompare(b.siteId));
}

/** 지역·유형이 맞는 현장(현장 선택 전 범위) */
export function sitesByRegionType(infos: SiteInfo[], f: Pick<Filters, "region" | "type">): SiteInfo[] {
  return infos.filter(
    (s) => (f.region === ALL || s.region === f.region) && (f.type === ALL || s.projectType === f.type),
  );
}

export function scopeSites(infos: SiteInfo[], f: Filters): SiteInfo[] {
  return sitesByRegionType(infos, f).filter((s) => f.siteId === ALL || s.siteId === f.siteId);
}

/** 지역·유형을 바꿔 고른 현장이 범위에서 빠지면 현장을 "전체"로 되돌립니다. */
export function normalizeFilters(infos: SiteInfo[], f: Filters): { filters: Filters; siteReset: boolean } {
  if (f.siteId !== ALL && !sitesByRegionType(infos, f).some((s) => s.siteId === f.siteId)) {
    return { filters: { ...f, siteId: ALL }, siteReset: true };
  }
  return { filters: f, siteReset: false };
}

export function metricsOf(row: Row, prev: Row | undefined): SiteMetrics {
  const contract10 = t10(row.contractAmount);
  const planned10 = t10(row.plannedProgress);
  const actual10 = t10(row.actualProgress);
  const earned10 = t10(row.cumulativeEarned);
  const gap10 = actual10 - planned10;
  return {
    row,
    contract10,
    planned10,
    actual10,
    earned10,
    rate10: rdiv(earned10 * 1000, contract10),
    gap10,
    status: statusOf(gap10),
    monthly10: prev ? earned10 - t10(prev.cumulativeEarned) : null,
  };
}

export function metricsForMonth(index: RowIndex, siteIds: string[], month: string): SiteMetrics[] {
  const out: SiteMetrics[] = [];
  for (const id of siteIds) {
    const row = index.get(`${month}|${id}`);
    if (row) out.push(metricsOf(row, index.get(`${prevMonth(month)}|${id}`)));
  }
  return out.sort((a, b) => a.row.siteId.localeCompare(b.row.siteId));
}

const EMPTY_COUNTS = (): Record<Status, number> => ({ 정상: 0, 주의: 0, 점검: 0 });

/** 범위(여러 현장)의 한 달 값. scopeCount는 범위의 현장 수(당월기성액 계산 가능 여부 판단에 씁니다). */
export function aggregate(metrics: SiteMetrics[], scopeCount: number): Aggregate {
  const counts = EMPTY_COUNTS();
  if (metrics.length === 0) {
    return {
      siteCount: 0,
      contract10: null,
      earned10: null,
      rate10: null,
      planned10: null,
      actual10: null,
      gap10: null,
      monthly10: null,
      counts,
    };
  }
  let contract = 0;
  let earned = 0;
  let cp = 0;
  let ca = 0;
  for (const m of metrics) {
    contract += m.contract10;
    earned += m.earned10;
    cp += m.contract10 * m.planned10;
    ca += m.contract10 * m.actual10;
    counts[m.status] += 1;
  }
  const allHavePrev = metrics.length === scopeCount && metrics.every((m) => m.monthly10 !== null);
  return {
    siteCount: metrics.length,
    contract10: contract,
    earned10: earned,
    rate10: rdiv(earned * 1000, contract),
    planned10: rdiv(cp, contract),
    actual10: rdiv(ca, contract),
    gap10: rdiv(ca - cp, contract),
    monthly10: allHavePrev ? metrics.reduce((s, m) => s + (m.monthly10 as number), 0) : null,
    counts,
  };
}

/** 점검 순위: 점검 현장만, 공정차이 오름차순, 같으면 현장 ID 순 */
export function inspectionRank(metrics: SiteMetrics[]): SiteMetrics[] {
  return metrics
    .filter((m) => m.status === "점검")
    .sort((a, b) => a.gap10 - b.gap10 || a.row.siteId.localeCompare(b.row.siteId));
}

export function buildDashboard(rows: Row[], filters: Filters): Dashboard {
  const index = indexRows(rows);
  const months = monthList(rows);
  const infos = siteInfos(rows);
  const scope = scopeSites(infos, filters);
  const ids = scope.map((s) => s.siteId);
  const siteMetrics = metricsForMonth(index, ids, filters.month);
  const agg = aggregate(siteMetrics, scope.length);
  const trend: TrendPoint[] = months
    .filter((m) => m <= filters.month)
    .map((month) => ({ month, agg: aggregate(metricsForMonth(index, ids, month), scope.length) }));
  const present = new Set(siteMetrics.map((m) => m.row.siteId));
  return {
    months,
    infos,
    scope,
    siteMetrics,
    agg,
    trend,
    missingInMonth: ids.filter((id) => !present.has(id)),
  };
}
