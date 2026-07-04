import { create } from "zustand";
import type { DiagramTiming, UserSettings } from "@/lib/schema/types";
import { loadSettings, saveSettings } from "@/lib/settings";

type SettingsState = UserSettings & {
  setDiagramTiming: (t: DiagramTiming) => void;
  setPassLinePct: (n: number) => void;
};

export const useSettings = create<SettingsState>((set, get) => ({
  ...loadSettings(),
  setDiagramTiming: (diagramTiming) => {
    set({ diagramTiming });
    persist(get);
  },
  setPassLinePct: (passLinePct) => {
    set({ passLinePct });
    persist(get);
  },
}));

function persist(get: () => SettingsState): void {
  const { diagramTiming, passLinePct } = get();
  saveSettings({ diagramTiming, passLinePct });
}
