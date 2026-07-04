import { describe, expect, it } from "vitest";
import { parseRefs } from "./parseRefs";

describe("parseRefs", () => {
  it("テキストと <ref> を分割する", () => {
    const segs = parseRefs(
      'まず<ref id="nat">NATゲートウェイ</ref>を経由する。'
    );
    expect(segs).toEqual([
      { kind: "text", text: "まず" },
      { kind: "ref", id: "nat", text: "NATゲートウェイ" },
      { kind: "text", text: "を経由する。" },
    ]);
  });

  it("複数の <ref> を扱える", () => {
    const segs = parseRefs('<ref id="a">A</ref>と<ref id="b">B</ref>');
    expect(segs.filter((s) => s.kind === "ref")).toHaveLength(2);
  });

  it("ref が無ければ全体を text に", () => {
    expect(parseRefs("ただの文")).toEqual([{ kind: "text", text: "ただの文" }]);
  });
});
