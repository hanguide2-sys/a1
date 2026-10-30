import { readFileSync } from "node:fs";
import path from "node:path";
import { importText } from "@/lib/validate";
import type { Row } from "@/lib/types";

// data 폴더의 원본은 읽기만 합니다.
export const DATA_DIR = path.resolve(process.cwd(), "data");

export function readData(...parts: string[]): string {
  return readFileSync(path.join(DATA_DIR, ...parts), "utf8");
}

export function loadCsvRows(): Row[] {
  const result = importText(readData("현장공정기성.csv"), "csv");
  if (!result.ok) throw new Error("정상 CSV가 거부되었습니다: " + JSON.stringify(result.errors.slice(0, 3)));
  return result.rows;
}

export function loadJsonRows(): Row[] {
  const result = importText(readData("현장공정기성.json"), "json");
  if (!result.ok) throw new Error("정상 JSON이 거부되었습니다: " + JSON.stringify(result.errors.slice(0, 3)));
  return result.rows;
}
