// 자료 한 행(15개 열). 금액은 백만원, 공정률은 %, 값은 원본 숫자 그대로 보관합니다.
export type Row = {
  month: string;
  siteId: string;
  siteName: string;
  contractAmount: number;
  plannedProgress: number;
  actualProgress: number;
  cumulativeEarned: number;
  region: string;
  projectType: string;
  startDate: string;
  contractEndDate: string;
  currentWork: string;
  issueCategory: string;
  issueSummary: string;
  actionPlan: string;
};

export const COLUMNS = [
  "month",
  "siteId",
  "siteName",
  "contractAmount",
  "plannedProgress",
  "actualProgress",
  "cumulativeEarned",
  "region",
  "projectType",
  "startDate",
  "contractEndDate",
  "currentWork",
  "issueCategory",
  "issueSummary",
  "actionPlan",
] as const;

export type ColumnName = (typeof COLUMNS)[number];

export const NUMBER_COLUMNS: ColumnName[] = [
  "contractAmount",
  "plannedProgress",
  "actualProgress",
  "cumulativeEarned",
];

export const REGIONS = ["인천", "경기", "충남", "충북", "세종", "강원", "대전"];
export const PROJECT_TYPES = ["공동주택", "물류시설", "업무시설", "상업시설", "생산시설"];
export const MONTH_MIN = "2025-10";
export const MONTH_MAX = "2026-09";
export const DEFAULT_MONTH = "2026-09";
export const ALL = "전체";

export type Status = "정상" | "주의" | "점검";

export type Filters = {
  month: string;
  region: string;
  type: string;
  siteId: string;
};

export const DEFAULT_FILTERS: Filters = {
  month: DEFAULT_MONTH,
  region: ALL,
  type: ALL,
  siteId: ALL,
};

export type ImportIssue = {
  /** 파일의 줄 번호(CSV는 1행이 헤더), JSON은 기록 순서(1부터). 파일 전체 문제는 undefined */
  line?: number;
  column?: string;
  message: string;
};

export type ImportResult = {
  ok: boolean;
  errors: ImportIssue[];
  warnings: string[];
  rows: Row[];
  /** 검사 결과 화면에 보여 줄 안내 */
  format: "csv" | "json";
  notes: string[];
};
