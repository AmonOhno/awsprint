import { create } from "zustand";

// docs/feature/diagram_highlight.md: 図とテキストが共有する単一ストア。
// activeId 一致で、対応ノード／RefSpan を相互に強調する（FR-07）。
type HighlightState = {
  activeId?: string;
  setActive: (id?: string) => void;
};

export const useHighlight = create<HighlightState>((set) => ({
  activeId: undefined,
  setActive: (id) => set({ activeId: id }),
}));
