import { useState, useRef } from "react";
import type { BoardBrief, DepthMode, BriefAttachment } from "@/lib/boards";
import { DEPTH_MODE_CONFIG } from "@/lib/boards";
import { optimizeText } from "@/lib/api/optimize";
import { useApiSettings } from "@/contexts/ApiSettingsContext";
import { Globe, Target, Clock, BarChart2, Shield, Lightbulb, Link, Upload, FileText, Sparkles, Wand } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@/lib/hooks/useNavigate";

interface BoardBriefFormProps {
  initial?: Partial<BoardBrief>;
  mode: DepthMode;
  onChange: (brief: Partial<BoardBrief>) => void;
  onModeChange: (mode: DepthMode) => void;
  compact?: boolean;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  question: <Lightbulb size={12} />,
  goal: <Target size={12} />,
  deadline: <Clock size={12} />,
  successCriteria: <BarChart2 size={12} />,
  constraints: <Shield size={12} />,
  knownFacts: <Globe size={12} />,
};

function FieldLabel({
  htmlFor,
  label,
  required,
  hint,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold text-gray-600 mb-1"
    >
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
      {hint && (
        <span className="ml-1 font-normal text-gray-400 text-[10px]">({hint})</span>
      )}
    </label>
  );
}

// ─── Optimize Button ─────────────────────────────────────────────────────────────

function OptimizeButton({
  text,
  field,
  onOptimized,
}: {
  text: string;
  field: string;
  onOptimized: (value: string) => void;
}) {
  const [optimizing, setOptimizing] = useState(false);
  const { activeModel, getActiveApiKey, isModelConfigured } = useApiSettings();
  const navigate = useNavigate();

  const handleOptimize = async () => {
    if (!text.trim()) {
      toast.error("Nothing to optimize — write some text first.");
      return;
    }
    if (!isModelConfigured(activeModel.id)) {
      toast.error("Configure an API key in Settings first.");
      navigate("/settings");
      return;
    }
    setOptimizing(true);
    try {
      const result = await optimizeText(text, "enhance", getActiveApiKey());
      onOptimized(result);
      toast.success("Text optimized");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <button
      onClick={handleOptimize}
      disabled={optimizing}
      title="Optimize with AI"
      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-sky-500 px-1.5 py-1 rounded transition-colors disabled:opacity-50"
    >
      {optimizing ? (
        <span className="animate-spin">...</span>
      ) : (
        <Sparkles size={10} />
      )}
    </button>
  );
}

// ─── Field with Optimize Button ─────────────────────────────────────────────────

function OptimizableTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full text-[13px] px-3 py-2 pr-14 rounded-[14px] border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none resize-none bg-white"
      />
      <div className="absolute top-1.5 right-2">
        <OptimizeButton
          text={value}
          field={id}
          onOptimized={onChange}
        />
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function BoardBriefForm({
  initial = {},
  mode,
  onChange,
  onModeChange,
  compact = false,
}: BoardBriefFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState(initial.question ?? "");
  const [goal, setGoal] = useState(initial.goal ?? "");
  const [deadline, setDeadline] = useState(initial.deadline ?? "");
  const [successCriteria, setSuccessCriteria] = useState(initial.successCriteria ?? "");
  const [constraints, setConstraints] = useState(initial.constraints ?? "");
  const [knownFacts, setKnownFacts] = useState(initial.knownFacts ?? "");
  const [openQuestions, setOpenQuestions] = useState(initial.openQuestions ?? "");
  const [attachments, setAttachments] = useState<BriefAttachment[]>(
    (initial.attachments ?? []).map((a) =>
      typeof a === "string" ? { type: "url" as const, name: a, content: a } : a
    )
  );

  const emit = (updates: Partial<BoardBrief>) => {
    const next = { question, goal, deadline, successCriteria, constraints, knownFacts, openQuestions, attachments, ...updates };
    onChange(next);
  };

  const addUrl = () => {
    const url = prompt("Enter research URL (https://...):");
    if (url && url.startsWith("http")) {
      const next: BriefAttachment[] = [...attachments, { type: "url", name: url, content: url }];
      setAttachments(next);
      emit({ attachments: next });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (ext === "pdf") {
          toast.error(`${file.name}: PDF files are not yet supported for text extraction.`);
          return;
        }
        const next: BriefAttachment[] = [
          ...attachments,
          { type: "text", name: file.name, content },
        ];
        setAttachments(next);
        emit({ attachments: next });
      };
      reader.readAsText(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (i: number) => {
    const next = attachments.filter((_, idx) => idx !== i);
    setAttachments(next);
    emit({ attachments: next });
  };

  const modes: DepthMode[] = ["quick", "standard", "deep_research"];

  if (compact) {
    return (
      <div className="space-y-3">
        <div>
          <FieldLabel htmlFor="brief-question-compact" label="Decision Question" required />
          <OptimizableTextarea
            id="brief-question-compact"
            value={question}
            onChange={(v) => { setQuestion(v); emit({ question: v }); }}
            placeholder="Should we launch product X in market Y?"
            rows={2}
          />
        </div>
        <div>
          <FieldLabel htmlFor="brief-known-facts-compact" label="Known Facts & Context" hint="optional" />
          <OptimizableTextarea
            id="brief-known-facts-compact"
            value={knownFacts}
            onChange={(v) => { setKnownFacts(v); emit({ knownFacts: v }); }}
            placeholder="What do you already know about this decision?"
            rows={2}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Depth mode toggle */}
      <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Session Depth
          </p>
        <div className="flex gap-2 flex-wrap">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`flex flex-col px-4 py-2.5 rounded-lg border text-left transition-all ${
                mode === m
                  ? "border-gray-900 bg-gray-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span
                className={`text-[12px] font-semibold ${mode === m ? "text-gray-900" : "text-gray-700"}`}
              >
                {DEPTH_MODE_CONFIG[m].label}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                {DEPTH_MODE_CONFIG[m].description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Decision Question */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <FieldLabel htmlFor="brief-question" label="Decision Question" required />
        </div>
        <OptimizableTextarea
          id="brief-question"
          value={question}
          onChange={(v) => { setQuestion(v); emit({ question: v }); }}
          placeholder="Should we launch product X in market Y? Should we hire candidate A or B? Which acquisition target is better?"
          rows={3}
        />
      </div>

      {/* Optional fields in 2-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="brief-goal" label="Goal" hint="what success looks like" />
          <OptimizableTextarea
            id="brief-goal"
            value={goal}
            onChange={(v) => { setGoal(v); emit({ goal: v }); }}
            placeholder="e.g. Maximize market share in Southeast Asia within 18 months"
            rows={2}
          />
        </div>
        <div>
          <FieldLabel htmlFor="brief-deadline" label="Decision Deadline" hint="optional" />
          <input
            id="brief-deadline"
            type="text"
            value={deadline}
            onChange={(e) => { setDeadline(e.target.value); emit({ deadline: e.target.value }); }}
            placeholder="e.g. End of Q2 2026"
            className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none bg-white"
          />
        </div>
        <div>
          <FieldLabel htmlFor="brief-criteria" label="Success Criteria" hint="how to measure" />
          <OptimizableTextarea
            id="brief-criteria"
            value={successCriteria}
            onChange={(v) => { setSuccessCriteria(v); emit({ successCriteria: v }); }}
            placeholder="e.g. 20% market share, positive unit economics within 12 months"
            rows={2}
          />
        </div>
        <div>
          <FieldLabel htmlFor="brief-constraints" label="Constraints" hint="non-negotiables" />
          <OptimizableTextarea
            id="brief-constraints"
            value={constraints}
            onChange={(v) => { setConstraints(v); emit({ constraints: v }); }}
            placeholder="e.g. Budget capped at $2M, must comply with local regulations"
            rows={2}
          />
        </div>
      </div>

      {/* Known facts */}
      <div>
        <FieldLabel htmlFor="brief-facts" label="Known Facts & Context" hint="optional" />
        <OptimizableTextarea
          id="brief-facts"
          value={knownFacts}
          onChange={(v) => { setKnownFacts(v); emit({ knownFacts: v }); }}
          placeholder="What do you already know? Current revenue, market size, team size, competitive landscape..."
          rows={3}
        />
      </div>

      {/* Open questions */}
      <div>
        <FieldLabel htmlFor="brief-open" label="Open Questions" hint="what you still need answers to" />
        <OptimizableTextarea
          id="brief-open"
          value={openQuestions}
          onChange={(v) => { setOpenQuestions(v); emit({ openQuestions: v }); }}
          placeholder="What are you most uncertain about?"
          rows={2}
        />
      </div>

      {/* Context Documents (URLs + File uploads) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-gray-600">
            Context Documents
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <Upload size={10} />
              Upload PRD / MD
            </button>
            <button
              onClick={addUrl}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <Link size={10} />
              Add URL
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.mdx,.markdown,.text"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {attachments.length > 0 ? (
          <div className="space-y-1.5">
            {attachments.map((att, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-[14px] px-3 py-1.5 border ${
                  att.type === "url"
                    ? "bg-gray-50 border-gray-100"
                    : "bg-sky-50 border-sky-100"
                }`}
              >
                {att.type === "url" ? (
                  <Link size={10} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <FileText size={10} className="text-sky-400 flex-shrink-0" />
                )}
                {att.type === "url" ? (
                  <a
                    href={att.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 truncate flex-1"
                  >
                    {att.name}
                  </a>
                ) : (
                  <span className="text-[11px] text-sky-700 truncate flex-1">
                    {att.name} <span className="text-[9px] text-sky-400">({att.content.length.toLocaleString()} chars)</span>
                  </span>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 italic">
            No documents added. Upload PRD, brief, or spec files — or paste in research URLs. These are injected into the deliberation context.
          </p>
        )}
      </div>
    </div>
  );
}
