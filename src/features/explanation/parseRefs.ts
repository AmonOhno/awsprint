// 解説ミニマークアップ <ref id="nat">NATゲートウェイ</ref> をパースする。
export type RefSegment =
  | { kind: "text"; text: string }
  | { kind: "ref"; id: string; text: string };

const RE = /<ref\s+id="([^"]+)">(.*?)<\/ref>/gs;

export function parseRefs(source: string): RefSegment[] {
  const segments: RefSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(source)) !== null) {
    if (m.index > last)
      segments.push({ kind: "text", text: source.slice(last, m.index) });
    segments.push({ kind: "ref", id: m[1], text: m[2] });
    last = m.index + m[0].length;
  }
  if (last < source.length)
    segments.push({ kind: "text", text: source.slice(last) });
  return segments;
}
