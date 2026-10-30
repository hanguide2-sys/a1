// 화면에 보이는 모양만 정합니다. 계산은 calc.ts가 합니다. 입력은 10배한 정수입니다.
export const NA = "계산 불가";
export const MINUS = "−"; // −

function group(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 10배한 정수 → "1,234.5" (항상 소수 첫째 자리) */
export function num1(v10: number | null | undefined): string {
  if (v10 === null || v10 === undefined) return NA;
  const neg = v10 < 0;
  const a = Math.abs(v10);
  const s = `${group(String(Math.floor(a / 10)))}.${a % 10}`;
  return neg ? MINUS + s : s;
}

/** 계약금액처럼 정수로 떨어지면 소수점 없이 */
export function amount(v10: number | null | undefined): string {
  if (v10 === null || v10 === undefined) return NA;
  return v10 % 10 === 0 ? group(String(v10 / 10)) : num1(v10);
}

export function pct(v10: number | null | undefined): string {
  return v10 === null || v10 === undefined ? NA : `${num1(v10)}%`;
}

/** 공정차이: 부호를 항상 붙입니다(+1.2pp, 0.0pp, −10.7pp) */
export function pp(v10: number | null | undefined): string {
  if (v10 === null || v10 === undefined) return NA;
  if (v10 > 0) return `+${num1(v10)}pp`;
  return `${num1(v10)}pp`;
}

/** 지도 같은 곳에 쓰는 소수 첫째 자리 숫자(쉼표 없음) — CSV·AI용 */
export function plain1(v10: number): number {
  return v10 / 10;
}
