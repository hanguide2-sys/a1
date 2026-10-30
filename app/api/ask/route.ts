import { GEMINI_TIMEOUT_MS, handleAsk } from "@/lib/aiServer";

// AI 호출은 이 서버 코드에서만 합니다. 키(GEMINI_API_KEY)는 브라우저로 내려가지 않습니다.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const result = await handleAsk(rawBody, {
    apiKey: process.env.GEMINI_API_KEY,
    mock: process.env.AI_MOCK === "1",
    fetchFn: fetch,
    timeoutMs: GEMINI_TIMEOUT_MS,
  });
  // 실패 이유 코드만 돌려주고 질문·자료·키는 로그에 남기지 않습니다.
  return Response.json(result, { status: 200 });
}
