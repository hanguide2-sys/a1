import { describe, expect, it } from "vitest";
import { amount, num1, pct, pp } from "@/lib/format";

describe("표시 형식", () => {
  it("금액은 쉼표와 소수 첫째 자리", () => {
    expect(num1(4240634)).toBe("424,063.4");
    expect(num1(0)).toBe("0.0");
    expect(num1(null)).toBe("계산 불가");
  });
  it("계약금액은 정수면 소수점 없이", () => {
    expect(amount(6307000)).toBe("630,700");
    expect(amount(1851)).toBe("185.1");
  });
  it("공정차이는 부호를 항상 붙인다", () => {
    expect(pp(17)).toBe("+1.7pp");
    expect(pp(0)).toBe("0.0pp");
    expect(pp(-107)).toBe("−10.7pp");
    expect(pp(null)).toBe("계산 불가");
  });
  it("비율은 소수 첫째 자리와 %", () => {
    expect(pct(672)).toBe("67.2%");
    expect(pct(null)).toBe("계산 불가");
  });
});
