"use client";

// 가져온 자료·필터·AI 답변을 모든 페이지가 함께 씁니다. 저장하지 않으므로 새로고침하면 사라집니다.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  buildAiRequest,
  isCompareQuestion,
  type AiFailReason,
  type AiRef,
  type AiResponse,
} from "@/lib/aiContext";
import { buildDashboard, monthList, normalizeFilters, siteInfos, type Dashboard } from "@/lib/calc";
import { ALL, DEFAULT_FILTERS, DEFAULT_MONTH, type Filters, type Row } from "@/lib/types";

export type AiState =
  | { status: "idle" }
  | { status: "loading"; question: string }
  | { status: "done"; question: string; answer: string; references: AiRef[]; mock: boolean }
  | { status: "error"; question: string; reason: AiFailReason }
  | { status: "info"; question: string; message: string };

type Ctx = {
  rows: Row[] | null;
  sourceName: string | null;
  warnings: string[];
  filters: Filters;
  filterNotice: string | null;
  dash: Dashboard | null;
  setFilters: (patch: Partial<Filters>) => void;
  replaceData: (rows: Row[], warnings: string[], fileName: string) => void;
  focusSiteId: string | null;
  expanded: ReadonlySet<string>;
  toggleExpanded: (siteId: string) => void;
  /** 점검 순위에서 한 줄을 눌렀을 때: 그 줄만 펼치고 강조합니다. */
  focusSite: (siteId: string) => void;
  ai: AiState;
  askAi: (question: string) => Promise<void>;
};

const DataContext = createContext<Ctx | null>(null);

export function useData(): Ctx {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("Providers 안에서만 사용할 수 있습니다.");
  return ctx;
}

function initialFilters(rows: Row[]): Filters {
  const months = monthList(rows);
  const month = months.includes(DEFAULT_MONTH) ? DEFAULT_MONTH : (months[months.length - 1] ?? DEFAULT_MONTH);
  return { ...DEFAULT_FILTERS, month };
}

export function Providers({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  const [filterNotice, setFilterNotice] = useState<string | null>(null);
  const [focusSiteId, setFocusSiteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [ai, setAi] = useState<AiState>({ status: "idle" });

  // 범위가 바뀔 때마다 번호를 올립니다. 늦게 도착한 이전 범위의 AI 응답은 이 번호로 걸러냅니다.
  const scopeVersion = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const resetScopeDependents = useCallback(() => {
    scopeVersion.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setAi({ status: "idle" });
    setExpanded(new Set());
    setFocusSiteId(null);
  }, []);

  const dash = useMemo(() => (rows ? buildDashboard(rows, filters) : null), [rows, filters]);

  const setFilters = useCallback(
    (patch: Partial<Filters>) => {
      if (!rows) return;
      const next = normalizeFilters(siteInfos(rows), { ...filters, ...patch });
      setFiltersState(next.filters);
      setFilterNotice(
        next.siteReset ? "고른 현장이 새 범위에 없어 현장을 '전체'로 바꿨습니다." : null,
      );
      resetScopeDependents();
    },
    [rows, filters, resetScopeDependents],
  );

  const replaceData = useCallback(
    (next: Row[], nextWarnings: string[], fileName: string) => {
      setRows(next);
      setWarnings(nextWarnings);
      setSourceName(fileName);
      setFiltersState(initialFilters(next));
      setFilterNotice(null);
      resetScopeDependents();
    },
    [resetScopeDependents],
  );

  const toggleExpanded = useCallback((siteId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  }, []);

  const focusSite = useCallback((siteId: string) => {
    setFocusSiteId(siteId);
    setExpanded(new Set([siteId]));
  }, []);

  const askAi = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (!rows || !dash || question === "") return;
      if (dash.scope.length === 0) {
        setAi({ status: "info", question, message: "선택한 범위에 해당하는 현장이 없어 질문할 수 없습니다." });
        return;
      }
      if (filters.siteId !== ALL && dash.scope.length === 1 && isCompareQuestion(question)) {
        setAi({
          status: "info",
          question,
          message: "비교하려면 현장을 2곳 이상 포함하는 범위를 고르세요.",
        });
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const version = scopeVersion.current;
      setAi({ status: "loading", question });
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildAiRequest(question, rows, filters)),
          signal: controller.signal,
        });
        const data = (await res.json()) as AiResponse;
        if (scopeVersion.current !== version) return; // 범위가 바뀐 뒤 도착한 응답은 버립니다.
        if (data.ok) {
          setAi({
            status: "done",
            question,
            answer: data.answer,
            references: data.references,
            mock: data.mock === true,
          });
        } else {
          setAi({ status: "error", question, reason: data.reason });
        }
      } catch {
        if (scopeVersion.current !== version || controller.signal.aborted) return;
        setAi({ status: "error", question, reason: "network" });
      }
    },
    [rows, dash, filters],
  );

  const value: Ctx = {
    rows,
    sourceName,
    warnings,
    filters,
    filterNotice,
    dash,
    setFilters,
    replaceData,
    focusSiteId,
    expanded,
    toggleExpanded,
    focusSite,
    ai,
    askAi,
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
