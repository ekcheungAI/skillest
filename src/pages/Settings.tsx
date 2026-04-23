import { useState } from "react";
import { Link } from "wouter";
import { useNavigate } from "@/lib/hooks/useNavigate";
import { useApiSettings, AVAILABLE_MODELS } from "@/contexts/ApiSettingsContext";
import { testKimiKey, testMinimaxKey, KIMI_PLATFORMS } from "@/lib/api/testKeys";
import { useBoard } from "@/contexts/BoardContext";
import { personas } from "@/lib/personas";
import {
  BOARD_STATUS_CONFIG,
  type BoardSession,
} from "@/lib/boards";
import { getInitials } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  Settings2,
  Cpu,
  Clock,
  Users,
} from "lucide-react";
import { toast } from "sonner";

// ─── Model Selector Card ───────────────────────────────────────────────────────

function ModelCard({
  model,
  isSelected,
  isConfigured,
  onSelect,
}: {
  model: (typeof AVAILABLE_MODELS)[number];
  isSelected: boolean;
  isConfigured: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex-1 p-4 rounded-[14px] border text-left transition-all ${
        isSelected
          ? "border-gray-900 bg-gray-50 shadow-sm"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
      style={isSelected ? { borderLeft: `4px solid ${model.badgeColor}` } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
            style={{ background: model.badgeColor }}
          >
            {model.icon}
          </div>
          <div>
            <p className="text-[13px] font-bold text-gray-900">
              {model.name}
            </p>
            <p className="text-[10px] text-gray-400">{model.description}</p>
          </div>
        </div>
        {isSelected && (
          <CheckCircle2 size={16} className="text-gray-900 flex-shrink-0" />
        )}
      </div>
      {!isConfigured && (
        <p className="text-[10px] text-amber-600 mt-1">
          {isSelected ? "API key required" : "Not configured"}
        </p>
      )}
    </button>
  );
}

// ─── API Key Card ─────────────────────────────────────────────────────────────

function ApiKeyCard({
  title,
  description,
  modelId,
  providerName,
  docsUrl,
  isConfigured,
  isUsingCustom,
  savedKey,
  onSave,
  onReset,
  onTest,
  platformOptions,
  defaultPlatform,
  onPlatformChange,
}: {
  title: string;
  description: string;
  modelId: string;
  providerName: string;
  docsUrl: string;
  isConfigured: boolean;
  isUsingCustom: boolean;
  savedKey: string;
  onSave: (key: string) => void;
  onReset: () => void;
  onTest?: (key: string, platform?: string) => Promise<{ ok: boolean; message: string; latencyMs?: number; errorDetail?: string }>;
  platformOptions?: Array<{ id: string; label: string; baseUrl: string }>;
  defaultPlatform?: string;
  onPlatformChange?: (platformId: string) => void;
}) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatform ?? platformOptions?.[0]?.id ?? "");

  const keyToTest = input.trim() || savedKey;

  const badgeColor = AVAILABLE_MODELS.find((m) => m.id === modelId)?.badgeColor ?? "#6B7280";

  const handleSave = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      onSave(input.trim());
      setInput("");
      toast.success(`${providerName} API key saved`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ background: badgeColor }}
        >
          {AVAILABLE_MODELS.find((m) => m.id === modelId)?.icon}
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-900">
            {title}
          </p>
          <p className="text-[10px] text-gray-400">{description}</p>
        </div>
      </div>

      {/* Status */}
      {isConfigured ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <p className="text-[11px] text-green-700">
            {isUsingCustom ? "Custom key saved in browser" : "Using environment variable"}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <p className="text-[11px] text-red-700">
            Not configured — board sessions will fail
          </p>
        </div>
      )}

      {/* Platform selector */}
      {platformOptions && platformOptions.length > 1 && (
        <div className="flex gap-1.5">
          {platformOptions.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPlatform(p.id); setTestResult(null); onPlatformChange?.(p.id); }}
              className={`px-3 py-1 rounded-md text-[10px] font-medium transition-colors ${
                selectedPlatform === p.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 rounded-[14px] border border-gray-200 text-[12px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-100"
        />
        <div className="flex items-center justify-between mt-1.5">
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-sky-600 hover:underline"
          >
            Get API key <ExternalLink size={9} />
          </a>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!input.trim() || saving}
          className="px-4 py-1.5 rounded-[14px] bg-gray-900 text-white text-[11px] font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Key"}
        </button>
        {onTest && (
          <button
            onClick={async () => {
              if (!keyToTest) { toast.error("No API key to test"); return; }
              setTesting(true);
              setTestResult(null);
              try {
                const result = await onTest(keyToTest, selectedPlatform);
                setTestResult(result);
                if (result.ok) toast.success(result.message);
                else toast.error(result.message);
              } finally {
                setTesting(false);
              }
            }}
            disabled={testing || !keyToTest}
            className="px-4 py-1.5 rounded-[14px] border border-gray-200 text-gray-600 text-[11px] font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? "Testing..." : "Test Key"}
          </button>
        )}
        {isUsingCustom && (
          <button
            onClick={onReset}
            className="px-4 py-1.5 rounded-[14px] border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={`flex items-start gap-2 px-3 py-2 rounded-lg text-[11px] ${
            testResult.ok
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p>{testResult.message}</p>
            {testResult.latencyMs !== undefined && (
              <p className="text-[10px] opacity-70 mt-0.5">{testResult.latencyMs}ms</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session History Row ───────────────────────────────────────────────────────

function SessionRow({ session }: { session: BoardSession }) {
  const navigate = useNavigate();
  const { deleteSession } = useBoard();

  const memberPersonas = session.members
    .map((m) => personas.find((p) => p.id === m.personaId))
    .filter(Boolean) as typeof personas;

  const statusColor = BOARD_STATUS_CONFIG[session.status].color;

  const relativeDate = (() => {
    const now = Date.now();
    const updated = new Date(session.updatedAt).getTime();
    const diff = now - updated;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(session.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group">
      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ background: statusColor }}
      />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/board/${session.id}`)}>
        <p className="text-[12px] font-semibold text-gray-900 truncate">
          {session.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: statusColor }}
          >
            {BOARD_STATUS_CONFIG[session.status].label}
          </span>
          <span className="text-[10px] text-gray-400">{session.members.length} members</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 flex-shrink-0">
        <Clock size={9} />
        {relativeDate}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/board/${session.id}`); }}
          className="text-[10px] px-2 py-1 rounded-[14px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Open
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this board session?")) deleteSession(session.id);
          }}
          className="p-1 rounded-[14px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────────

export default function Settings() {
  const {
    selectedModel,
    setSelectedModel,
    kimiKey,
    isUsingCustomKimiKey,
    setCustomKimiKey,
    clearCustomKimiKey,
    kimiPlatform,
    setKimiPlatform,
    minimaxKey,
    isUsingCustomMinimaxKey,
    setCustomMinimaxKey,
    clearCustomMinimaxKey,
    isModelConfigured,
  } = useApiSettings();

  const { sessions } = useBoard();

  const kimiConfigured = isModelConfigured("k2.6");
  const minimaxConfigured = isModelConfigured("m2.7");

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="min-h-screen" style={{ background: "#F7F6F2" }}>
      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            </Link>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <Settings2 size={13} className="text-gray-500" />
              <span className="text-[13px] font-bold text-gray-900">
                Settings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Model Selector */}
        <div
          className="bg-white rounded-[14px] border border-gray-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-gray-400" />
            <h2 className="text-[15px] font-bold text-gray-900">
              LLM Model
            </h2>
          </div>
          <p className="text-[11px] text-gray-500 mb-3">
            Choose the model used for board deliberations and text optimization. Both models support 200K context.
          </p>
          <div className="flex gap-3">
            {AVAILABLE_MODELS.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                isConfigured={isModelConfigured(model.id)}
                onSelect={() => {
                  if (!isModelConfigured(model.id)) {
                    toast.error(`Configure ${model.provider === "kimi" ? "Kimi" : "MiniMax"} API key first`);
                    return;
                  }
                  setSelectedModel(model.id);
                  toast.success(`Switched to ${model.name}`);
                }}
              />
            ))}
          </div>
          {!isModelConfigured(selectedModel) && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle size={12} className="text-amber-500 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">
                Active model is not configured. Board sessions will fail until you add an API key below.
              </p>
            </div>
          )}
        </div>

        {/* Kimi API Key */}
        <div
          className="bg-white rounded-[14px] border border-gray-100 p-5 shadow-sm"
          style={{ borderLeft: `4px solid ${AVAILABLE_MODELS.find((m) => m.id === "k2.6")?.badgeColor ?? "#6B7280"}` }}
        >
          <ApiKeyCard
            title="Kimi K2.6"
            description="Moonshot AI · api.moonshot.cn"
            modelId="k2.6"
            providerName="Kimi"
            docsUrl="https://platform.moonshot.cn"
            isConfigured={kimiConfigured}
            isUsingCustom={isUsingCustomKimiKey}
            savedKey={kimiKey}
            onSave={setCustomKimiKey}
            onReset={clearCustomKimiKey}
            onTest={testKimiKey}
            platformOptions={KIMI_PLATFORMS}
            defaultPlatform={kimiPlatform}
            onPlatformChange={(id) => setKimiPlatform(id as "international" | "china")}
          />
        </div>

        {/* MiniMax API Key */}
        <div
          className="bg-white rounded-[14px] border border-gray-100 p-5 shadow-sm"
          style={{ borderLeft: `4px solid ${AVAILABLE_MODELS.find((m) => m.id === "m2.7")?.badgeColor ?? "#6B7280"}` }}
        >
          <ApiKeyCard
            title="MiniMax M2.7"
            description="MiniMax · api.minimax.io"
            modelId="m2.7"
            providerName="MiniMax"
            docsUrl="https://platform.minimax.io"
            isConfigured={minimaxConfigured}
            isUsingCustom={isUsingCustomMinimaxKey}
            savedKey={minimaxKey}
            onSave={setCustomMinimaxKey}
            onReset={clearCustomMinimaxKey}
            onTest={testMinimaxKey}
          />
        </div>

        {/* Session History */}
        <div className="bg-white rounded-[14px] border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-gray-400" />
            <h2 className="text-[15px] font-bold text-gray-900">
              Board History
            </h2>
            <span className="text-[10px] text-gray-400 ml-auto">{sortedSessions.length} sessions</span>
          </div>

          {sortedSessions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[12px] text-gray-400 mb-3">No board sessions yet</p>
              <Link href="/board/new">
                <button className="text-[11px] px-4 py-1.5 rounded-[14px] bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                  Create your first board
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {sortedSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
              {sortedSessions.length > 0 && (
                <div className="pt-3 flex justify-end">
                  <Link href="/boards">
                    <button className="text-[11px] text-gray-600 hover:text-gray-900 transition-colors">
                      View all boards
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
