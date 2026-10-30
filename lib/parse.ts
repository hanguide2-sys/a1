// 파일 글자를 행 목록으로 바꾸는 단계. 값의 옳고 그름은 validate.ts가 검사합니다.

export type RawRecord = {
  /** 파일의 줄 번호. CSV는 1행이 헤더이므로 첫 자료 행은 2 */
  line: number;
  cells: string[];
};

export type CsvParsed = {
  headers: string[];
  records: RawRecord[];
};

/** 따옴표 안의 쉼표·줄바꿈, 맨 앞 BOM, \r\n 줄바꿈을 처리하는 CSV 읽기 */
export function parseCsv(input: string): CsvParsed {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const all: RawRecord[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;
  let startLine = 1;
  let i = 0;

  const pushCell = () => {
    cells.push(cell);
    cell = "";
  };
  const pushRecord = () => {
    pushCell();
    // 완전히 빈 줄은 건너뜁니다.
    if (!(cells.length === 1 && cells[0].trim() === "")) {
      all.push({ line: startLine, cells });
    }
    cells = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      if (ch === "\n") line += 1;
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"' && cell === "") {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      pushCell();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "\n") {
      pushRecord();
      line += 1;
      startLine = line;
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  if (cell !== "" || cells.length > 0) pushRecord();

  const headerRecord = all[0];
  return {
    headers: headerRecord ? headerRecord.cells.map((h) => h.trim()) : [],
    records: all.slice(1),
  };
}

export type JsonParsed =
  | { ok: true; metadata: Record<string, unknown> | null; records: unknown[] }
  | { ok: false; message: string };

/** JSON은 { metadata, records: [...] } 형태이거나 행 배열이어야 합니다. */
export function parseJson(input: string): JsonParsed {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, message: "JSON 형식이 올바르지 않아 읽을 수 없습니다." };
  }
  if (Array.isArray(value)) {
    return { ok: true, metadata: null, records: value };
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.records)) {
      const metadata =
        obj.metadata && typeof obj.metadata === "object"
          ? (obj.metadata as Record<string, unknown>)
          : null;
      return { ok: true, metadata, records: obj.records };
    }
  }
  return { ok: false, message: "JSON에서 records(행 목록)를 찾지 못했습니다." };
}
