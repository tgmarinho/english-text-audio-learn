export type ParsedMd = {
  title: string;
  english: string;
  portuguese: string;
};

function sectionBetween(md: string, start: string, end: RegExp): string {
  const i = md.indexOf(start);
  if (i === -1) return "";
  const after = md.slice(i + start.length);
  const m = after.search(end);
  return (m === -1 ? after : after.slice(0, m)).trim();
}

export function parseMd(raw: string): ParsedMd {
  const firstLine = raw.split("\n", 1)[0]?.trim() ?? "";
  const title = firstLine.replace(/^#\s*\d+\s*—\s*/, "").replace(/^#\s*/, "");
  const english = sectionBetween(raw, "## English", /\n---|\n##\s/);
  const portuguese = sectionBetween(raw, "## Português", /\n---|\n##\s/);
  return { title, english, portuguese };
}

export type Token =
  | { kind: "word"; text: string; index: number }
  | { kind: "gap"; text: string };

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let wordIdx = 0;
  const re = /[A-Za-zÀ-ÿ0-9]+(?:['’][A-Za-zÀ-ÿ]+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) {
      tokens.push({ kind: "gap", text: text.slice(i, m.index) });
    }
    tokens.push({ kind: "word", text: m[0], index: wordIdx++ });
    i = m.index + m[0].length;
  }
  if (i < text.length) tokens.push({ kind: "gap", text: text.slice(i) });
  return tokens;
}

export function countWords(tokens: Token[]): number {
  return tokens.filter((t) => t.kind === "word").length;
}
