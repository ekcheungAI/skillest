import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

const STORAGE_KEY = "perskill_api_settings";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LlmProvider = "kimi" | "minimax";

export interface ModelOption {
  id: string;
  name: string;
  provider: LlmProvider;
  description: string;
  icon: string;
  badgeColor: string;
  modelName: string; // the actual API model ID
}

export interface ApiSettingsValue {
  // Active provider
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;

  // Kimi
  kimiKey: string;
  isUsingCustomKimiKey: boolean;
  setCustomKimiKey: (key: string) => void;
  clearCustomKimiKey: () => void;
  kimiPlatform: "international" | "china";
  setKimiPlatform: (platform: "international" | "china") => void;

  // MiniMax
  minimaxKey: string;
  isUsingCustomMinimaxKey: boolean;
  setCustomMinimaxKey: (key: string) => void;
  clearCustomMinimaxKey: () => void;

  // Helpers
  activeModel: ModelOption;
  getActiveApiKey: () => string;
  isModelConfigured: (modelId: string) => boolean;
}

// ─── Available Models ─────────────────────────────────────────────────────────

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "k2.6",
    name: "K2.6",
    provider: "kimi",
    description: "Moonshot AI · 200K context",
    icon: "K",
    badgeColor: "#6366F1",
    modelName: "k2.6",
  },
  {
    id: "m2.7",
    name: "M2.7",
    provider: "minimax",
    description: "MiniMax · 200K context · fast",
    icon: "M",
    badgeColor: "#F59E0B",
    modelName: "MiniMax-M2.7",
  },
];

// ─── Storage ─────────────────────────────────────────────────────────────────

interface StoredSettings {
  customKimiKey?: string;
  customMinimaxKey?: string;
  selectedModel?: string;
  kimiPlatform?: "international" | "china";
}

function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredSettings;
  } catch {
    // ignore
  }
  return {};
}

function saveSettings(partial: Partial<StoredSettings>) {
  try {
    const current = loadSettings();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...partial })
    );
  } catch {
    // storage unavailable
  }
}

function getKimiKey(): { key: string; isCustom: boolean } {
  const settings = loadSettings();
  if (settings.customKimiKey) return { key: settings.customKimiKey, isCustom: true };
  const envKey = import.meta.env.VITE_KIMI_API_KEY ?? "";
  return { key: envKey, isCustom: !!envKey && !settings.customKimiKey };
}

function getMinimaxKey(): { key: string; isCustom: boolean } {
  const settings = loadSettings();
  if (settings.customMinimaxKey) return { key: settings.customMinimaxKey, isCustom: true };
  const envKey = import.meta.env.VITE_MINIMAX_API_KEY ?? "";
  return { key: envKey, isCustom: !!envKey && !settings.customMinimaxKey };
}

function getDefaultModel(): string {
  const settings = loadSettings();
  return settings.selectedModel ?? "k2.6";
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ApiSettingsContext = createContext<ApiSettingsValue | null>(null);

export function ApiSettingsProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState(getDefaultModel);
  const [kimiData, setKimiData] = useState(getKimiKey);
  const [minimaxData, setMinimaxData] = useState(getMinimaxKey);
  const [kimiPlatform, setKimiPlatformState] = useState<"international" | "china">(
    () => loadSettings().kimiPlatform ?? "international"
  );

  const setSelectedModel = useCallback((modelId: string) => {
    setSelectedModelState(modelId);
    saveSettings({ selectedModel: modelId });
  }, []);

  const setCustomKimiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    setKimiData({ key: trimmed, isCustom: true });
    saveSettings({ customKimiKey: trimmed });
  }, []);

  const setKimiPlatform = useCallback((platform: "international" | "china") => {
    setKimiPlatformState(platform);
    saveSettings({ kimiPlatform: platform });
  }, []);

  const clearCustomKimiKey = useCallback(() => {
    const envKey = import.meta.env.VITE_KIMI_API_KEY ?? "";
    setKimiData({ key: envKey, isCustom: false });
    saveSettings({ customKimiKey: undefined });
  }, []);

  const setCustomMinimaxKey = useCallback((key: string) => {
    const trimmed = key.trim();
    setMinimaxData({ key: trimmed, isCustom: true });
    saveSettings({ customMinimaxKey: trimmed });
  }, []);

  const clearCustomMinimaxKey = useCallback(() => {
    const envKey = import.meta.env.VITE_MINIMAX_API_KEY ?? "";
    setMinimaxData({ key: envKey, isCustom: false });
    saveSettings({ customMinimaxKey: undefined });
  }, []);

  const activeModel = useMemo(
    () => AVAILABLE_MODELS.find((m) => m.id === selectedModel) ?? AVAILABLE_MODELS[0],
    [selectedModel]
  );

  const getActiveApiKey = useCallback((): string => {
    if (activeModel.provider === "kimi") return kimiData.key;
    if (activeModel.provider === "minimax") return minimaxData.key;
    return "";
  }, [activeModel, kimiData, minimaxData]);

  const isModelConfigured = useCallback(
    (modelId: string): boolean => {
      const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
      if (!model) return false;
      if (model.provider === "kimi") {
        const k = getKimiKey();
        return !!k.key;
      }
      if (model.provider === "minimax") {
        const m = getMinimaxKey();
        return !!m.key;
      }
      return false;
    },
    []
  );

  const value: ApiSettingsValue = {
    selectedModel,
    setSelectedModel,
    kimiKey: kimiData.key,
    isUsingCustomKimiKey: kimiData.isCustom,
    setCustomKimiKey,
    clearCustomKimiKey,
    kimiPlatform,
    setKimiPlatform,
    minimaxKey: minimaxData.key,
    isUsingCustomMinimaxKey: minimaxData.isCustom,
    setCustomMinimaxKey,
    clearCustomMinimaxKey,
    activeModel,
    getActiveApiKey,
    isModelConfigured,
  };

  return (
    <ApiSettingsContext.Provider value={value}>
      {children}
    </ApiSettingsContext.Provider>
  );
}

export function useApiSettings(): ApiSettingsValue {
  const ctx = useContext(ApiSettingsContext);
  if (!ctx) throw new Error("useApiSettings must be used within ApiSettingsProvider");
  return ctx;
}
