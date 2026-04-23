import { useState, useCallback } from "react";
import { useNavigate } from "@/lib/hooks/useNavigate";
import { personas } from "@/lib/personas";
import { useBoard } from "@/contexts/BoardContext";
import {
  type BoardBrief,
  type SeatRole,
  type DepthMode,
  type BoardMember,
  createBoardMember,
  SEAT_ROLE_CONFIG,
  generateId,
} from "@/lib/boards";
import { getInitials } from "@/lib/utils";
import { BoardBriefForm } from "@/components/board/BoardBriefForm";
import { BoardAssembly } from "@/components/board/BoardAssembly";
import { SeatRolePicker } from "@/components/board/SeatRolePicker";
import {
  ArrowLeft,
  ArrowRight,
  Rocket,
  Lightbulb,
  Users,
  Layers,
  CheckCircle2,
  Sparkles,
  Brain,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { key: "brief", label: "Frame Decision", icon: <Lightbulb size={14} /> },
  { key: "assemble", label: "Assemble Board", icon: <Users size={14} /> },
  { key: "roles", label: "Assign Seats", icon: <Layers size={14} /> },
];

function suggestPersonas(question: string): string[] {
  const q = question.toLowerCase();
  const keywords: Record<string, string[]> = {
    tech: ["elon-musk", "larry-ellison", "erik-ekudden"],
    business: ["li-ka-shing", "jack-ma", "donald-trump"],
    investing: ["killa-xbt"],
    film: ["stephen-chow"],
    asia: ["li-ka-shing", "jack-ma", "killa-xbt"],
    startup: ["jack-ma", "elon-musk"],
    strategy: ["li-ka-shing", "donald-trump"],
    china: ["li-ka-shing", "jack-ma", "killa-xbt"],
    real_estate: ["li-ka-shing"],
    crypto: ["killa-xbt", "justin-sun"],
    comedy: ["stephen-chow"],
    product: ["elon-musk", "larry-ellison"],
    growth: ["jack-ma", "donald-trump"],
  };

  for (const [keyword, ids] of Object.entries(keywords)) {
    if (q.includes(keyword)) return ids;
  }

  // Default: pick diverse set across categories
  const defaultIds = personas.slice(0, 4).map((p) => p.id);
  return defaultIds;
}

export default function BoardCreate() {
  
  const { createSession } = useBoard();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<Partial<BoardBrief>>({});
  const [mode, setMode] = useState<DepthMode>("standard");
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [suggestedIds, setSuggestedIds] = useState<string[]>([]);

  const handleBriefChange = useCallback((updates: Partial<BoardBrief>) => {
    setBrief((prev) => {
      const next = { ...prev, ...updates };
      // Auto-suggest personas when question is updated
      if (updates.question && updates.question.length > 10) {
        setSuggestedIds(suggestPersonas(updates.question));
      }
      return next;
    });
  }, []);

  const handleAddPersona = useCallback((personaId: string) => {
    const already = members.some((m) => m.personaId === personaId);
    if (already) return;
    const role: SeatRole =
      members.length === 0
        ? "chair"
        : members.length === 1
        ? "domain_specialist"
        : members.length === 2
        ? "operator"
        : "contrarian";
    const member = createBoardMember(personaId, role);
    setMembers((prev) => [...prev, member]);
  }, [members]);

  const handleRemovePersona = useCallback((memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }, []);

  const handleUpdateMember = useCallback(
    (memberId: string, updates: Partial<BoardMember>) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const handleAutoBuild = useCallback(() => {
    if (!brief.question) {
      toast.error("Enter a decision question first");
      return;
    }
    const suggested = suggestPersonas(brief.question);
    setSuggestedIds(suggested);
    // Add suggested personas that aren't already selected
    const currentIds = new Set(members.map((m) => m.personaId));
    const toAdd = suggested.filter((id) => !currentIds.has(id));
    const newMembers: BoardMember[] = toAdd.map((id, i) =>
      createBoardMember(
        id,
        i === 0
          ? "chair"
          : i === 1
          ? "domain_specialist"
          : i === 2
          ? "operator"
          : i === 3
          ? "risk_reviewer"
          : "contrarian"
      )
    );
    setMembers((prev) => [...prev, ...newMembers]);
    toast.success(`Board auto-built with ${newMembers.length} suggested members`);
  }, [brief.question, members]);

  const handleLaunch = useCallback(() => {
    if (!brief.question?.trim()) {
      toast.error("Please enter a decision question");
      return;
    }
    if (members.length < 3) {
      toast.error("Add at least 3 board members (you have " + members.length + ")");
      return;
    }
    const session = createSession({
      title: brief.question!.slice(0, 60) + (brief.question!.length > 60 ? "..." : ""),
      brief: brief as BoardBrief,
      mode,
      members,
      status: "intake",
    });
    toast.success("Board session created!");
    navigate(`/board/${session.id}`);
  }, [brief, mode, members, createSession, navigate]);

  const canAdvance =
    step === 0
      ? Boolean(brief.question?.trim())
      : members.length >= 3;

  return (
    <div className="min-h-screen" style={{ background: "#F7F6F2" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/95 border-b border-gray-200" style={{ backdropFilter: "blur(8px)" }}>
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={14} />
            Back to Library
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
              <Brain size={12} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              Perskill
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-gray-600 text-[10px] font-semibold mb-3 border border-gray-200 bg-white/70" style={{ letterSpacing: "0.05em" }}>
            <Rocket size={9} className="text-amber-500" />
            VIRTUAL EXPERT BOARD
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            Create Your Board
          </h1>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            Frame your decision, assemble expert personas, and run a structured board session.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                  i === step
                    ? "bg-gray-900 text-white"
                    : i < step
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{
                  background: i < step ? "transparent" : i === step ? "#FFFFFF30" : "transparent",
                  color: i < step ? "#FFFFFF" : i === step ? "#FFFFFF" : "#9CA3AF",
                }}>
                  {i < step ? "✓" : i + 1}
                </span>
                {s.icon}
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? "bg-gray-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
          {step === 0 && (
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                Frame the Decision
              </h2>
              <p className="text-[12px] text-gray-500 mb-5">
                Start with the question you need answered. The more specific, the better the board deliberation.
              </p>
              <BoardBriefForm
                initial={brief}
                mode={mode}
                onChange={handleBriefChange}
                onModeChange={setMode}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                    Assemble the Board
                  </h2>
                  <p className="text-[12px] text-gray-500">
                    Choose 3–7 expert personas. A balanced board includes diverse perspectives. {members.length}/7 selected.
                  </p>
                </div>
                <button
                  onClick={handleAutoBuild}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors flex-shrink-0"
                >
                  <Sparkles size={12} />
                  Auto-Build
                </button>
              </div>
              <BoardAssembly
                allPersonas={personas}
                selectedMembers={members}
                onAdd={handleAddPersona}
                onRemove={handleRemovePersona}
                suggestedIds={suggestedIds}
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                Assign Seat Roles
              </h2>
              <p className="text-[12px] text-gray-500 mb-5">
                Each seat has a specific purpose in the board. Assign roles based on each persona's strengths.
              </p>
              <SeatRolePicker
                members={members}
                personas={personas}
                onUpdate={handleUpdateMember}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className={`flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl border transition-all ${
              step === 0
                ? "opacity-0 pointer-events-none"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canAdvance}
              className={`flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl border transition-all ${
                canAdvance
                  ? "bg-gray-900 text-white hover:bg-gray-800 border-gray-900"
                  : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
              }`}
            >
              Next
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={!canAdvance}
              className={`flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl border transition-all ${
                canAdvance
                  ? "bg-gray-900 text-white hover:bg-gray-800 border-gray-900 shadow-md hover:shadow-lg"
                  : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
              }`}
            >
              <Rocket size={14} />
              Launch Board
            </button>
          )}
        </div>

        {/* Brief summary as user progresses */}
        {brief.question && step > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-[11px] font-semibold text-blue-700 mb-1">
              Decision Question
            </p>
            <p className="text-[13px] text-blue-900 font-medium leading-relaxed" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              "{brief.question}"
            </p>
            {brief.goal && (
              <p className="text-[11px] text-blue-700 mt-1">
                Goal: {brief.goal}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
