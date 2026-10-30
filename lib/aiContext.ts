// AI에게 보낼 자료를 만듭니다. 원문 기록과 프로그램이 계산한 값은 서로 다른 항목으로 구분합니다.
// API 키는 여기에 들어가지 않습니다(서버에서만 씁니다).
import { buildDashboard, type Aggregate, type SiteMetrics } from "./calc";
import { ALL, COLUMNS, type Filters, type Row } from "./types";
import { plain1 } from "./format";

export const QUESTION_MAX = 300;

/** "비교"를 묻는 질문인지 대략 판단합니다. 현장 1곳만 고른 상태에서는 비교할 대상이 없어 안내합니다. */
export function isCompareQuestion(question: string): boolean {
  return /비교|끼리|둘 중|서로|어느 (현장|쪽|곳)|어떻게 다른|다른가|다른지|가장 (큰|작은|높은|낮은) 곳/.test(question);
}
export const REQUEST_MAX_BYTES = 300 * 1024;

export type AiMetricRow = {
  siteId: string;
  기성률_pct: number;
  계획공정률_pct: number;
  실제공정률_pct: number;
  공정차이_pp: number;
  상태: string;
  누적기성액_백만원: number;
  당월기성액_백만원: number | null;
};

export type AiOverall = {
  현장수: number;
  기성률_pct: number | null;
  계획공정률_pct: number | null;
  실제공정률_pct: number | null;
  공정차이_pp: number | null;
  누적기성액_백만원: number | null;
  당월기성액_백만원: number | null;
  정상: number;
  주의: number;
  점검: number;
};

export type AiMonthSummary = AiOverall & { month: string };

export type AiHistoryItem = {
  month: string;
  currentWork: string;
  issueCategory: string;
  issueSummary: string;
  actionPlan: string;
  공정차이_pp: number;
  상태: string;
  당월기성액_백만원: number | null;
};

export type AiRequest = {
  question: string;
  scope: { month: string; region: string; type: string; siteId: string; siteCount: number };
  /** 원문 기록: 선택 월·범위의 행(15개 열 그대로) */
  records: Row[];
  /** 프로그램이 계산한 값 */
  metrics: AiMetricRow[];
  overall: AiOverall;
  /** 같은 범위의 첫 월~선택 월 월별 요약 */
  monthlySummary: AiMonthSummary[];
  /** 현장 1곳을 골랐을 때만: 그 현장의 첫 월~선택 월 원문 기록과 계산 값 */
  siteHistory?: AiHistoryItem[];
};

export type AiRef =
  | { kind: "row"; month: string; siteId: string; fields: string[] }
  | { kind: "monthlySummary"; months: string[] };

export type AiFailReason =
  | "no-key"
  | "quota"
  | "timeout"
  | "network"
  | "too-large"
  | "bad-request"
  | "bad-response"
  | "model-unavailable";

export type AiResponse =
  | { ok: true; answer: string; references: AiRef[]; mock?: boolean }
  | { ok: false; reason: AiFailReason };

export const FAIL_MESSAGES: Record<AiFailReason, string> = {
  "no-key": "AI 연결 설정이 되어 있지 않습니다.",
  quota: "AI 사용 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.",
  timeout: "AI 답변이 30초 안에 오지 않았습니다.",
  network: "AI에 연결하지 못했습니다. 네트워크를 확인해 주세요.",
  "too-large": "보낼 자료가 너무 큽니다. 범위를 줄여 주세요.",
  "bad-request": "질문을 확인해 주세요. (빈 질문이거나 300자를 넘음)",
  "bad-response": "AI 답변을 읽지 못했습니다. 다시 질문해 주세요.",
  "model-unavailable": "AI 모델을 사용할 수 없습니다. 모델 이름과 키를 확인해야 합니다.",
};

function overallOf(agg: Aggregate): AiOverall {
  const p = (v: number | null) => (v === null ? null : plain1(v));
  return {
    현장수: agg.siteCount,
    기성률_pct: p(agg.rate10),
    계획공정률_pct: p(agg.planned10),
    실제공정률_pct: p(agg.actual10),
    공정차이_pp: p(agg.gap10),
    누적기성액_백만원: p(agg.earned10),
    당월기성액_백만원: p(agg.monthly10),
    정상: agg.counts["정상"],
    주의: agg.counts["주의"],
    점검: agg.counts["점검"],
  };
}

function metricRow(m: SiteMetrics): AiMetricRow {
  return {
    siteId: m.row.siteId,
    기성률_pct: plain1(m.rate10),
    계획공정률_pct: plain1(m.planned10),
    실제공정률_pct: plain1(m.actual10),
    공정차이_pp: plain1(m.gap10),
    상태: m.status,
    누적기성액_백만원: plain1(m.earned10),
    당월기성액_백만원: m.monthly10 === null ? null : plain1(m.monthly10),
  };
}

export function buildAiRequest(question: string, rows: Row[], filters: Filters): AiRequest {
  const dash = buildDashboard(rows, filters);
  const request: AiRequest = {
    question,
    scope: {
      month: filters.month,
      region: filters.region,
      type: filters.type,
      siteId: filters.siteId,
      siteCount: dash.scope.length,
    },
    records: dash.siteMetrics.map((m) => m.row),
    metrics: dash.siteMetrics.map(metricRow),
    overall: overallOf(dash.agg),
    monthlySummary: dash.trend.map((t) => ({ month: t.month, ...overallOf(t.agg) })),
  };
  if (filters.siteId !== ALL && dash.scope.length === 1) {
    const id = dash.scope[0].siteId;
    // 월별 기록은 월마다 그 현장의 행을 찾아 계산 값과 함께 보냅니다.
    const byMonth = new Map(rows.filter((r) => r.siteId === id).map((r) => [r.month, r]));
    request.siteHistory = dash.trend
      .map((t) => {
        const row = byMonth.get(t.month);
        if (!row) return null;
        const gap = Math.round(row.actualProgress * 10) - Math.round(row.plannedProgress * 10);
        return {
          month: t.month,
          currentWork: row.currentWork,
          issueCategory: row.issueCategory,
          issueSummary: row.issueSummary,
          actionPlan: row.actionPlan,
          공정차이_pp: plain1(gap),
          상태: gap >= 0 ? "정상" : gap <= -50 ? "점검" : "주의",
          당월기성액_백만원: t.agg.monthly10 === null ? null : plain1(t.agg.monthly10),
        } satisfies AiHistoryItem;
      })
      .filter((x): x is AiHistoryItem => x !== null);
  }
  return request;
}

/** 서버가 받은 값의 모양을 확인합니다. 문제가 있으면 이유를 돌려줍니다. */
export function checkAiRequest(value: unknown): AiFailReason | null {
  if (!value || typeof value !== "object") return "bad-request";
  const v = value as Partial<AiRequest>;
  if (typeof v.question !== "string") return "bad-request";
  const q = v.question.trim();
  if (q.length === 0 || q.length > QUESTION_MAX) return "bad-request";
  if (!v.scope || typeof v.scope.month !== "string" || !/^\d{4}-\d{2}$/.test(v.scope.month)) return "bad-request";
  if (!Array.isArray(v.records) || !Array.isArray(v.metrics) || !Array.isArray(v.monthlySummary)) return "bad-request";
  if (!v.overall || typeof v.overall !== "object") return "bad-request";
  for (const r of v.records) {
    if (!r || typeof r !== "object") return "bad-request";
    for (const c of COLUMNS) if (!(c in (r as object))) return "bad-request";
  }
  return null;
}
