import { describe, expect, it } from "vitest";
import { buildAiRequest, type AiRequest } from "@/lib/aiContext";
import { handleAsk, sanitizeRefs, SYSTEM_PROMPT } from "@/lib/aiServer";
import { DEFAULT_FILTERS, type Filters } from "@/lib/types";
import { loadCsvRows } from "./helpers";

const rows = loadCsvRows();
const at = (f: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...f });

describe("AI에게 보낼 자료 구성", () => {
  it("원문 기록과 계산 지표가 구분되어 있다(9월 전체)", () => {
    const r = buildAiRequest("점검 현장은?", rows, at({}));
    expect(r.records).toHaveLength(12);
    expect(r.metrics).toHaveLength(12);
    expect(r.records[0]).toHaveProperty("issueSummary");
    expect(r.metrics[0]).not.toHaveProperty("issueSummary");
    expect(r.metrics[0]).toHaveProperty("공정차이_pp");
    expect(r.overall.기성률_pct).toBe(67.2);
    expect(r.overall.점검).toBe(3);
    expect(r.monthlySummary).toHaveLength(12);
    expect(r.siteHistory).toBeUndefined();
  });

  it("D의 8·9월 월별 요약이 들어 있다(회복 여부 질문)", () => {
    const r = buildAiRequest("D 회복 중인가?", rows, at({ siteId: "D" }));
    const aug = r.monthlySummary.find((m) => m.month === "2026-08")!;
    const sep = r.monthlySummary.find((m) => m.month === "2026-09")!;
    expect(aug.공정차이_pp).toBe(-11.2);
    expect(sep.공정차이_pp).toBe(-10.7);
  });

  it("현장 1곳을 고르면 그 현장의 월별 원문 기록이 들어 있다(J 7월)", () => {
    const r = buildAiRequest("J 7월 기성이 왜 늘지 않았나?", rows, at({ siteId: "J" }));
    const jul = r.siteHistory!.find((h) => h.month === "2026-07")!;
    expect(jul.issueSummary).toContain("기성 확인 서류 보완");
    expect(jul.당월기성액_백만원).toBe(0);
    expect(r.siteHistory).toHaveLength(12);
  });

  it("전체를 고르면 7월 원문 기록은 보내지 않는다", () => {
    const r = buildAiRequest("J 7월 기성이 왜 늘지 않았나?", rows, at({}));
    expect(JSON.stringify(r)).not.toContain("기성 확인 서류 보완으로 7월");
  });

  it("API 키가 자료에 들어가지 않는다", () => {
    const r = buildAiRequest("질문", rows, at({}));
    expect(JSON.stringify(r)).not.toMatch(/GEMINI|api[_-]?key/i);
    expect(SYSTEM_PROMPT).not.toMatch(/AIza/);
  });
});

const goodReq = (over: Partial<AiRequest> = {}): string =>
  JSON.stringify({ ...buildAiRequest("점검 현장은?", rows, at({})), ...over });

const okFetch = (text: string, status = 200): typeof fetch =>
  (async () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status })) as typeof fetch;

const base = { apiKey: "test-key", mock: false, timeoutMs: 1000 };

describe("AI 서버 코드 (가짜 응답 — 실제 호출 아님)", () => {
  it("정상 응답: 답변과 근거를 돌려주고 범위 밖 근거는 버린다", async () => {
    const answer = JSON.stringify({
      answer: "D의 공정차이가 -10.7pp로 가장 큽니다.",
      references: [
        { kind: "row", month: "2026-09", siteId: "D", fields: ["plannedProgress", "issueSummary", "bogus"] },
        { kind: "row", month: "2026-09", siteId: "Z", fields: ["actualProgress"] },
        { kind: "row", month: "2024-01", siteId: "D", fields: ["actualProgress"] },
        { kind: "monthlySummary", months: ["2026-08", "2030-01"] },
      ],
    });
    const r = await handleAsk(goodReq(), { ...base, fetchFn: okFetch(answer) });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answer).toContain("-10.7pp");
      expect(r.references).toEqual([
        { kind: "row", month: "2026-09", siteId: "D", fields: ["plannedProgress", "issueSummary"] },
        { kind: "monthlySummary", months: ["2026-08"] },
      ]);
    }
  });

  it("코드 블록(```json)으로 감싼 응답도 읽는다", async () => {
    const wrapped = '```json\n{"answer":"설명","references":[{"kind":"row","month":"2026-09","siteId":"D","fields":[]}]}\n```';
    const r = await handleAsk(goodReq(), { ...base, fetchFn: okFetch(wrapped) });
    expect(r.ok).toBe(true);
  });

  it("근거가 하나도 남지 않으면 안내 문구를 덧붙인다", async () => {
    const r = await handleAsk(goodReq(), {
      ...base,
      fetchFn: okFetch(JSON.stringify({ answer: "설명", references: [] })),
    });
    expect(r.ok && r.answer).toContain("근거로 표시할 자료 항목이 없습니다");
  });

  it("키가 없으면 no-key", async () => {
    const r = await handleAsk(goodReq(), { ...base, apiKey: undefined, fetchFn: okFetch("{}") });
    expect(r).toEqual({ ok: false, reason: "no-key" });
    const blank = await handleAsk(goodReq(), { ...base, apiKey: "  ", fetchFn: okFetch("{}") });
    expect(blank).toEqual({ ok: false, reason: "no-key" });
  });

  it("한도 초과(429)는 quota", async () => {
    const r = await handleAsk(goodReq(), { ...base, fetchFn: okFetch("{}", 429) });
    expect(r).toEqual({ ok: false, reason: "quota" });
  });

  it("모델을 찾지 못하면(404) model-unavailable", async () => {
    const r = await handleAsk(goodReq(), { ...base, fetchFn: okFetch("{}", 404) });
    expect(r).toEqual({ ok: false, reason: "model-unavailable" });
  });

  it("키가 잘못되면(403) no-key", async () => {
    const r = await handleAsk(goodReq(), { ...base, fetchFn: okFetch("{}", 403) });
    expect(r).toEqual({ ok: false, reason: "no-key" });
  });

  it("네트워크 오류는 network", async () => {
    const fetchFn = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const r = await handleAsk(goodReq(), { ...base, fetchFn });
    expect(r).toEqual({ ok: false, reason: "network" });
  });

  it("시간이 지나면 timeout", async () => {
    const fetchFn = ((_url: unknown, init?: RequestInit) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
        );
      })) as typeof fetch;
    const r = await handleAsk(goodReq(), { ...base, timeoutMs: 30, fetchFn });
    expect(r).toEqual({ ok: false, reason: "timeout" });
  });

  it("JSON이 아닌 답변은 bad-response", async () => {
    const r = await handleAsk(goodReq(), { ...base, fetchFn: okFetch("그냥 글자") });
    expect(r).toEqual({ ok: false, reason: "bad-response" });
    const empty = await handleAsk(goodReq(), { ...base, fetchFn: okFetch(JSON.stringify({ answer: "" })) });
    expect(empty).toEqual({ ok: false, reason: "bad-response" });
  });

  it("빈 질문·300자 초과·깨진 요청은 bad-request", async () => {
    const f = { ...base, fetchFn: okFetch("{}") };
    expect(await handleAsk(goodReq({ question: "   " }), f)).toEqual({ ok: false, reason: "bad-request" });
    expect(await handleAsk(goodReq({ question: "가".repeat(301) }), f)).toEqual({ ok: false, reason: "bad-request" });
    expect(await handleAsk("{ 깨진", f)).toEqual({ ok: false, reason: "bad-request" });
    expect(await handleAsk(JSON.stringify({ question: "x" }), f)).toEqual({ ok: false, reason: "bad-request" });
  });

  it("300KB를 넘으면 too-large", async () => {
    const big = goodReq({ question: "x" }) + " ".repeat(310 * 1024);
    const r = await handleAsk(big, { ...base, fetchFn: okFetch("{}") });
    expect(r).toEqual({ ok: false, reason: "too-large" });
  });

  it("모의 응답은 mock 표시가 붙고 키 없이도 동작한다", async () => {
    const r = await handleAsk(goodReq(), { ...base, apiKey: undefined, mock: true, fetchFn: okFetch("{}") });
    expect(r.ok && r.mock).toBe(true);
    const ask = await handleAsk(goodReq({ question: "실제 준공일과 미수금은?" }), {
      ...base,
      mock: true,
      fetchFn: okFetch("{}"),
    });
    expect(ask.ok && ask.answer).toContain("자료에 없습니다");
  });

  it("Gemini 호출에는 키를 헤더로만 보내고 본문·주소에 넣지 않는다", async () => {
    let seen: { url: string; headers: Record<string, string>; body: string } | null = null;
    const fetchFn = (async (url: string, init: RequestInit) => {
      seen = { url, headers: init.headers as Record<string, string>, body: String(init.body) };
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"answer":"가","references":[]}' }] } }] }),
      );
    }) as unknown as typeof fetch;
    await handleAsk(goodReq(), { ...base, apiKey: "SECRET-TEST-KEY", fetchFn });
    expect(seen!.headers["x-goog-api-key"]).toBe("SECRET-TEST-KEY");
    expect(seen!.url).not.toContain("SECRET-TEST-KEY");
    expect(seen!.body).not.toContain("SECRET-TEST-KEY");
    expect(seen!.url).toContain("gemini-3.8-flash");
  });

  it("sanitizeRefs: 현장 1곳 기록에 있는 월은 근거로 인정한다", () => {
    const req = buildAiRequest("q", rows, at({ siteId: "J" }));
    const refs = sanitizeRefs([{ kind: "row", month: "2026-07", siteId: "J", fields: ["issueSummary"] }], req);
    expect(refs).toHaveLength(1);
  });
});
