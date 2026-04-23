import { useState, useCallback, useMemo } from "react";
import { Link, useParams } from "wouter";
import { useNavigate } from "@/lib/hooks/useNavigate";
import { personas } from "@/lib/personas";
import { useBoard } from "@/contexts/BoardContext";
import { useApiSettings } from "@/contexts/ApiSettingsContext";
import { generateFullDeliberation } from "@/lib/api/deliberate";
import {
  type BoardSession,
  type DecisionOutcome,
  type DiscussionTurn,
  type DiscussionStage,
  type ResearchPacket,
  BOARD_STATUS_CONFIG,
  SEAT_ROLE_CONFIG,
  DISCUSSION_STAGE_CONFIG,
  generateBoardPrompt,
} from "@/lib/boards";
import { BoardBriefForm } from "@/components/board/BoardBriefForm";
import { DeliberationPanel } from "@/components/board/DeliberationPanel";
import { BoardMemoExport } from "@/components/board/BoardMemoExport";
import { BoardMemberCard } from "@/components/board/BoardMemberCard";
import { ResearchPacketPanel } from "@/components/board/ResearchPacketPanel";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Play,
  FileText,
  MessageSquare,
  Globe,
  CheckCircle2,
  Users,
  Brain,
  Settings2,
  AlertTriangle,
  Copy,
  BarChart3,
} from "lucide-react";

type Stage = "brief" | "research" | "deliberate" | "synthesize" | "output";

const STAGES: { key: Stage; label: string; icon: React.ReactNode }[] = [
  { key: "brief", label: "Brief", icon: <FileText size={13} /> },
  { key: "research", label: "Research", icon: <Globe size={13} /> },
  { key: "deliberate", label: "Deliberate", icon: <MessageSquare size={13} /> },
  { key: "synthesize", label: "Synthesize", icon: <Brain size={13} /> },
  { key: "output", label: "Output", icon: <FileText size={13} /> },
];

const STAGE_NAMES = [
  "initial position",
  "position",
  "key argument",
  "argument",
  "challenge",
  "rebuttal",
  "rebut",
  "what would change",
  "change my mind",
  "final",
  "recommendation",
  "synthesis",
];

function simulateDiscussionTurns(
  session: BoardSession
): Omit<DiscussionTurn, "id" | "createdAt">[] {
  const question = session.brief.question || "What should we decide?";
  const memberPersonas = session.members
    .map((m) => ({ member: m, persona: personas.find((p) => p.id === m.personaId) }))
    .filter((x): x is { member: BoardSession["members"][0]; persona: NonNullable<typeof x.persona> } => Boolean(x.persona));

  const questionWords = question.toLowerCase().split(/\s+/);
  const isProduct = questionWords.some(w => ["launch", "product", "feature", "ship", "app", "market"].includes(w));
  const isHiring = questionWords.some(w => ["hire", "hiring", "candidate", "team", "talent", "recruit"].includes(w));
  const isInvestment = questionWords.some(w => ["invest", "acquisition", "buy", "acquire", "fund"].includes(w));
  const isStrategy = questionWords.some(w => ["strategy", "expand", "market", "competition", "competitive"].includes(w));
  const isAsia = questionWords.some(w => ["asia", "china", "hong kong", "singapore", "southeast", "japan", "korean"].includes(w));

  const chair = memberPersonas.find(x => x.member.role === "chair");
  const contrarian = memberPersonas.find(x => x.member.role === "contrarian");
  const riskReviewer = memberPersonas.find(x => x.member.role === "risk_reviewer");

  const turns: Omit<DiscussionTurn, "id" | "createdAt">[] = [];

  memberPersonas.forEach(({ member, persona }) => {
    const firstName = persona.name.split(" ")[0];

    if (isAsia && (persona.id === "li-ka-shing" || persona.id === "jack-ma")) {
      turns.push({
        memberId: member.id,
        stage: "initial_position",
        content: `[${firstName}] On this ${isProduct ? "product expansion" : isStrategy ? "strategic decision" : "question"} involving Asia: My first principle is that relationships are the foundation of all business. In my experience at ${persona.id === "li-ka-shing" ? "Cheung Kong" : "Alibaba"}, deals are made between people, not between companies. The regulatory environment must be navigated carefully — move too fast and you invite scrutiny; move too slow and you lose opportunity. I would recommend a patient, partnership-first approach with local stakeholders.`,
        stance: "neutral",
      });
    } else if (isInvestment || isStrategy) {
      turns.push({
        memberId: member.id,
        stage: "initial_position",
        content: `[${firstName}] My position on this ${isInvestment ? "investment" : isStrategy ? "strategic" : "decision"} is informed by first-principles thinking. When evaluating any major decision, I apply inversion — first understand what would make it fail catastrophically, then work backward. My track record shows that the biggest gains come from being early when the market is wrong about something obvious. ${persona.decisionHeuristics?.[0]?.name ? `I apply the "${persona.decisionHeuristics[0].name}" heuristic: ${persona.decisionHeuristics[0].scenario}` : ""} I recommend we do not rush this decision until we have stress-tested the downside.`,
        stance: "neutral",
      });
    } else if (persona.id === "elon-musk") {
      turns.push({
        memberId: member.id,
        stage: "initial_position",
        content: `[${firstName}] My position: move fast and break things — or more precisely, move at the speed of the mission. The question is whether this decision is worth doing at all. If yes, then do it with such force that failure becomes impossible. I've found that the biggest mistake in business is not moving fast enough; the second biggest is not thinking hard enough before moving. We should do both simultaneously: think deeply about the first principles, then execute with maximum velocity. The ${isProduct ? "product" : "decision"} should either be done 10x better or not at all.`,
        stance: "neutral",
      });
    } else if (persona.id === "stephen-chow") {
      turns.push({
        memberId: member.id,
        stage: "initial_position",
        content: `[${firstName}] From my experience directing films under pressure with tight budgets and high expectations: every great outcome comes from a team that trusts each other enough to take creative risks. The question isn't whether the ${isProduct ? "product" : "decision"} is good — it's whether the team making it believes in it. Passion overcomes poor strategy. Strategic thinking without passion produces mediocre results. My advice: make sure whoever executes this genuinely cares, or the idea dies no matter how good the plan sounds.`,
        stance: "neutral",
      });
    } else {
      turns.push({
        memberId: member.id,
        stage: "initial_position",
        content: `[${firstName}] As ${persona.title}, my initial position on this decision is grounded in my core values of ${persona.values?.[0]?.value ?? "excellence"} and ${persona.values?.[1]?.value ?? "integrity"}. ${persona.shortBio} My thinking is: the quality of a decision depends on the quality of the question. We should spend as much time refining the question as we spend answering it. My recommendation is to approach this with both urgency and intellectual rigor — the two are not in conflict.`,
        stance: "neutral",
      });
    }
  });

  // Key arguments
  memberPersonas.forEach(({ member, persona }) => {
    const firstName = persona.name.split(" ")[0];
    turns.push({
      memberId: member.id,
      stage: "key_argument",
      content: `[${firstName}] My strongest argument: ${persona.thinkingFrameworks?.[0]?.name ? `I apply the "${persona.thinkingFrameworks[0].name}" framework — ${persona.thinkingFrameworks[0].description}` : `My track record shows that decisions made with long-term orientation outperform short-term optimization. The key variable is not the decision itself but the quality of execution.`} This is why I believe my position is not just preference but pattern recognition from years of navigating similar situations.`,
      stance: "neutral",
    });
  });

  // Challenges from contrarian/risk reviewer
  if (contrarian) {
    memberPersonas.forEach(({ member, persona }) => {
      if (member.id !== contrarian.member.id) {
        turns.push({
          memberId: contrarian.member.id,
          stage: "challenge",
          content: `[${contrarian.persona.name.split(" ")[0]} as Contrarian]: I'm pushing back on ${persona.name.split(" ")[0]}'s position. The assumption that ${persona.decisionHeuristics?.[0]?.scenario ?? "this pattern will repeat"} relies on a stable environment — but conditions change. What if the regulatory landscape shifts? What if a competitor moves faster? I need to see the failure mode analysis before I can support this.`,
          stance: "disagree",
        });
      }
    });
  }

  if (riskReviewer) {
    turns.push({
      memberId: riskReviewer.member.id,
      stage: "challenge",
      content: `[${riskReviewer.persona.name.split(" ")[0]} as Risk Reviewer]: Let me surface the failure modes. Primary risk: overcommitment before validating assumptions. Secondary risk: the team loses momentum during the execution phase. The question we should ask is: what's the cost of being wrong, and can we reverse this decision if new information emerges? I recommend we build in explicit decision points with reversibility baked in.`,
      stance: "disagree",
    });
  }

  // Rebuttals
  memberPersonas.forEach(({ member, persona }) => {
    const firstName = persona.name.split(" ")[0];
    if (member.role !== "contrarian" && member.role !== "risk_reviewer") {
      turns.push({
        memberId: member.id,
        stage: "rebuttal",
        content: `[${firstName}]: Fair challenge. I concede that ${contrarian ? `${contrarian.persona.name.split(" ")[0]}'s concern about` : "the concern about"} regulatory uncertainty is valid. My counter is that waiting for perfect information is itself a decision — and usually the wrong one when competitors are moving. My position: proceed with a pilot phase, build in checkpoints, and commit to re-evaluating at the 90-day mark. This gives us optionality without giving up momentum.`,
        stance: "neutral",
      });
    }
  });

  // What would change their mind
  memberPersonas.forEach(({ member, persona }) => {
    const firstName = persona.name.split(" ")[0];
    turns.push({
      memberId: member.id,
      stage: "what_would_change_mind",
      content: `[${firstName}]: I would change my position if: (1) a key team member I trust explicitly advises against it, (2) financial data shows a metric I consider non-negotiable is at risk, or (3) we discover that a core assumption — ${isAsia ? "local regulatory stability" : "customer willingness to pay"} — was fundamentally wrong. Conversely, seeing early traction from a small-scale test would amplify my conviction.`,
      stance: "neutral",
    });
  });

  // Chair synthesis
  if (chair) {
    turns.push({
      memberId: chair.member.id,
      stage: "final_recommendation",
      content: `[${chair.persona.name.split(" ")[0]} as Chair — Final Recommendation]: After hearing all perspectives, my synthesis is: recommend we proceed, but with conditions. The board agrees on the opportunity; the tension is around risk tolerance and timing. Majority view: launch a focused pilot in ${isAsia ? "one Asian market with a trusted local partner" : "a controlled segment"}, measure for 60 days, and reconvene for a go/no-go decision. Key dissent: the contrarian wants a 30-day additional due diligence period. I recommend we take 2 weeks, not 30 days — enough to stress-test the core assumption without losing competitive window. Confidence: moderate-to-high.`,
      stance: "agree",
    });
  } else if (memberPersonas.length > 0) {
    const firstMember = memberPersonas[0];
    turns.push({
      memberId: firstMember.member.id,
      stage: "final_recommendation",
      content: `[${firstMember.persona.name.split(" ")[0]} — Final Recommendation]: After deliberation, I recommend: proceed with caution. The board's composite view is to validate the core assumption before full commitment. Next steps: (1) Identify the single most important assumption to test. (2) Design a 30-day experiment. (3) Reconvene to make the full commitment decision based on data. Risk-adjusted confidence: medium.`,
      stance: "neutral",
    });
  }

  return turns;
}

export default function BoardSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getSession, updateSession, setStatus, addTurn, setOutcome } = useBoard();

  const session = getSession(id ?? "");

  const [stage, setStage] = useState<Stage>("brief");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);

  const { activeModel, getActiveApiKey, isModelConfigured, kimiPlatform } = useApiSettings();

  const [outcomeForm, setOutcomeForm] = useState<Partial<DecisionOutcome>>({
    recommendation: "",
    confidence: "medium",
    keyReasons: [],
    majorDisagreements: [],
    primaryRisks: [],
    mitigationSteps: [],
    nextActions: [],
  });

  const compositePrompt = useMemo(() => {
    if (!session) return "";
    return generateBoardPrompt(session, personas);
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F6F2" }}>
        <div className="text-center">
          <p className="text-[16px] font-semibold text-gray-900 mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            Board session not found
          </p>
          <button
            onClick={() => navigate("/boards")}
            className="text-[13px] text-blue-600 hover:text-blue-800"
          >
            ← Back to Boards
          </button>
        </div>
      </div>
    );
  }

  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id, p])),
    []
  );

  const handleLaunchDeliberation = useCallback(async () => {
    const apiKey = getActiveApiKey();
    if (!apiKey || !isModelConfigured(activeModel.id)) {
      toast.error(`${activeModel.name} API key required. Add your key in Settings.`);
      navigate("/settings");
      return;
    }

    setIsGenerating(true);
    setStatus(session.id, "deliberating");

    try {
      const memberPrompts = session.members
        .map((m) => {
          const persona = personas.find((p) => p.id === m.personaId);
          if (!persona) return null;
          return {
            personaName: persona.name,
            personaTitle: persona.title,
            aiPersonaPrompt: persona.aiPersonaPrompt,
            seatRole: m.role,
            seatRoleLabel: SEAT_ROLE_CONFIG[m.role].label,
          };
        })
        .filter(Boolean) as NonNullable<ReturnType<typeof session.members[number]>>[];

      // Inject text file contents as context
      const textAttachments = (session.brief.attachments ?? [])
        .filter((a): a is { type: "text"; name: string; content: string } => a.type === "text")
        .map((a) => `## ${a.name}\n${a.content}`)
        .join("\n\n---\n\n");

      const fullText = await generateFullDeliberation({
        briefQuestion: session.brief.question || "What should we decide?",
        briefGoal: session.brief.goal,
        briefDeadline: session.brief.deadline,
        briefConstraints: session.brief.constraints,
        briefKnownFacts: session.brief.knownFacts,
        briefAttachments: textAttachments || undefined,
        memberPrompts,
        apiKeyOverride: apiKey,
        provider: activeModel.provider,
        platform: kimiPlatform,
      });

      const stageOrder: DiscussionStage[] = [
        "initial_position",
        "key_argument",
        "challenge",
        "rebuttal",
        "what_would_change_mind",
        "final_recommendation",
      ];

      const existingCount = session.turns.length;

      if (session.members.length === 0) {
        toast.error("No board members to generate discussion for.");
        setStatus(session.id, "draft");
        setIsGenerating(false);
        return;
      }

      const lines = fullText.split("\n").filter((l) => l.trim());

      let currentMemberIdx = 0;
      let currentStageIdx = 0;

      for (const line of lines) {
        if (!line.trim()) continue;

        let memberId = session.members[0].id;
        let stage: DiscussionStage = stageOrder[Math.min(currentStageIdx, stageOrder.length - 1)];

        const speakerMatch = line.match(/^\[([^\]]+)\]/);
        if (speakerMatch) {
          const speakerName = speakerMatch[1].toLowerCase();
          const matched = session.members.find((m) => {
            const p = personas.find((per) => per.id === m.personaId);
            return p && speakerName.includes(p.name.toLowerCase().split(" ")[0]);
          });
          if (matched) {
            memberId = matched.id;
            const chair = session.members.find((m) => m.role === "chair");
            const isChair = matched.role === "chair";
            const isContrarian = matched.role === "contrarian";
            const isRisk = matched.role === "risk_reviewer";
            if (speakerName.includes("chair") || (isChair && speakerName.includes("final"))) {
              stage = "final_recommendation";
            } else if (speakerName.includes("contrarian") || speakerName.includes("risk") || isContrarian || isRisk) {
              stage = "challenge";
            } else if (STAGE_NAMES.some((sn) => speakerName.includes(sn))) {
              const idx = STAGE_NAMES.findIndex((sn) => speakerName.includes(sn));
              stage = stageOrder[idx] ?? stage;
            } else if (isChair && currentStageIdx < stageOrder.length - 1) {
              stage = stageOrder[currentStageIdx];
            }
          }
        }

        addTurn(session.id, {
          memberId,
          stage,
          content: line.replace(/^\[[^\]]+\]\s*/, "").trim(),
          stance: "neutral",
        });

        if (stage === "final_recommendation") {
          break;
        }
        if (speakerMatch) {
          currentMemberIdx++;
          if (session.members.length > 0 && currentMemberIdx % session.members.length === 0) {
            currentStageIdx = Math.min(currentStageIdx + 1, stageOrder.length - 1);
          }
        }
      }

      setStatus(session.id, "synthesizing");
      setStage("synthesize");
      toast.success(`Board generated ${existingCount} discussion turns`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Generation failed: ${message}`);
      setStatus(session.id, "draft");
    } finally {
      setIsGenerating(false);
    }
  }, [session, personas, activeModel, getActiveApiKey, isModelConfigured, addTurn, setStatus]);

  const handleGenerateOutcome = useCallback(() => {
    const question = session.brief.question || "the decision";
    const outcome: DecisionOutcome = {
      recommendation: outcomeForm.recommendation || `Proceed with a focused pilot, measure for 60 days, and reconvene for a go/no-go decision based on data.`,
      confidence: outcomeForm.confidence || "medium",
      confidenceReason: "Based on structured deliberation from diverse expert perspectives",
      keyReasons: outcomeForm.keyReasons.length > 0 ? outcomeForm.keyReasons : [
        "Multiple expert perspectives converged on the opportunity",
        "Risk/reward ratio favorable with a staged approach",
        "Early pilot reduces downside exposure",
      ],
      majorDisagreements: outcomeForm.majorDisagreements.length > 0 ? outcomeForm.majorDisagreements : [
        "Timing: some members prefer more due diligence before committing",
        "Risk tolerance: contrarian advised more conservative approach",
      ],
      primaryRisks: outcomeForm.primaryRisks.length > 0 ? outcomeForm.primaryRisks : [
        "Regulatory or market conditions change before execution",
        "Execution team underestimates complexity of initial rollout",
        "Competitor moves faster during pilot phase",
      ],
      mitigationSteps: outcomeForm.mitigationSteps.length > 0 ? outcomeForm.mitigationSteps : [
        "Build in 30-day checkpoint reviews with explicit go/no-go criteria",
        "Establish a local partnership or advisory relationship early",
        "Document key assumptions and set trigger conditions for reversing course",
      ],
      nextActions: outcomeForm.nextActions.length > 0 ? outcomeForm.nextActions : [
        "Identify the single most important assumption to test in 30 days",
        "Design and brief the pilot team",
        "Schedule 60-day board reconvene",
      ],
    };
    setOutcome(session.id, outcome);
    setStatus(session.id, "complete");
    setShowOutcomeForm(false);
    setStage("output");
    toast.success("Board recommendation generated!");
  }, [outcomeForm, session, setOutcome, setStatus]);

  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="min-h-screen" style={{ background: "#F7F6F2" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/95 border-b border-gray-200" style={{ backdropFilter: "blur(8px)" }}>
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/boards")}
              className="flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={13} />
              My Boards
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <span
              className="text-[13px] font-semibold text-gray-900 truncate max-w-xs"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              {session.title}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: `${BOARD_STATUS_CONFIG[session.status].color}15`,
                color: BOARD_STATUS_CONFIG[session.status].color,
              }}
            >
              {BOARD_STATUS_CONFIG[session.status].label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 hidden sm:block" >
              {session.members.length} members
            </span>
            <Link href="/settings">
              <span
                className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings2 size={11} />
                {activeModel.name}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: isModelConfigured(activeModel.id) ? "#4ADE80" : "#F87171" }}
                />
              </span>
            </Link>
            <button
              onClick={() => handleCopy(compositePrompt)}
              className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <Copy size={11} />
              Copy Prompt
            </button>
          </div>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-12 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {STAGES.map((s, i) => {
              const isActive = s.key === stage;
              const isPast = i < stageIndex;
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    // Only allow navigating to stages that have data or are the next step
                    if (s.key === "brief") { setStage("brief"); return; }
                    if (s.key === "research") { setStage("research"); return; }
                    if (s.key === "deliberate") { setStage("deliberate"); return; }
                    if (s.key === "synthesize") { setStage("synthesize"); return; }
                    if (s.key === "output") { setStage("output"); return; }
                    setStage(s.key);
                  }}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : isPast
                      ? "bg-gray-200 text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {s.icon}
                  {s.label}
                  {isPast && <CheckCircle2 size={10} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: board members */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-gray-600" />
                <p className="text-[12px] font-semibold text-gray-700" >
                  Board Members
                </p>
                <span className="ml-auto text-[10px] text-gray-400" >
                  {session.members.length}/7
                </span>
              </div>
              <div className="space-y-2">
                {session.members.map((member) => {
                  const persona = personaMap.get(member.personaId);
                  if (!persona) return null;
                  return (
                    <BoardMemberCard
                      key={member.id}
                      member={member}
                      persona={persona}
                      compact
                    />
                  );
                })}
              </div>
            </div>

            {/* Decision brief summary */}
            {session.brief.question && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-gray-600" />
                  <p className="text-[12px] font-semibold text-gray-700" >
                    Decision Brief
                  </p>
                </div>
                <p className="text-[12px] text-gray-800 leading-relaxed italic" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                  "{session.brief.question}"
                </p>
                {session.brief.goal && (
                  <p className="text-[11px] text-gray-500 mt-1" >
                    Goal: {session.brief.goal}
                  </p>
                )}
              </div>
            )}

            {/* Quick actions */}
            {stage === "brief" && (
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
                <p className="text-[11px] font-semibold text-amber-700 mb-1" >
                  Ready to start?
                </p>
                <button
                  onClick={() => setStage("research")}
                  className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  <ArrowRight size={13} />
                  Continue to Research
                </button>
              </div>
            )}
          </div>

          {/* Right: stage content */}
          <div className="lg:col-span-2">
            {stage === "brief" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="text-[18px] font-bold text-gray-900 mb-4" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                    Decision Brief
                  </h2>
                  <BoardBriefForm
                    initial={session.brief}
                    mode={session.mode}
                    onChange={(updates) => {
                      const brief = { ...session.brief, ...updates };
                      updateSession(session.id, { brief });
                    }}
                    onModeChange={(mode) => updateSession(session.id, { mode })}
                    compact
                  />
                </div>
              </div>
            )}

            {stage === "research" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="text-[18px] font-bold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                    Research Prep
                  </h2>
                  <p className="text-[12px] text-gray-500 mb-4" >
                    {session.mode === "deep_research"
                      ? "Deep Research mode: building a shared context packet from your brief and attached URLs."
                      : "Quick mode: research packet is a lightweight summary. For deeper context, switch to Deep Research in the Brief tab."}
                  </p>
                  <ResearchPacketPanel
                    packet={session.researchPacket}
                    isLoading={false}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setStage("deliberate")}
                    className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  >
                    Begin Deliberation
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {stage === "deliberate" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                        Roundtable Discussion
                      </h2>
                      <p className="text-[12px] text-gray-500 mt-1" >
                        {session.turns.length} turns generated — each expert speaks in sequence across 6 discussion stages
                      </p>
                    </div>
                    <button
                      onClick={handleLaunchDeliberation}
                      disabled={isGenerating}
                      className={`flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-xl transition-colors ${
                        isGenerating
                          ? "bg-gray-100 text-gray-400"
                          : session.turns.length > 0
                          ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Generating...
                        </>
                      ) : session.turns.length > 0 ? (
                        <>
                          <ArrowRightLeft size={12} />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Play size={12} />
                          Start Board
                        </>
                      )}
                    </button>
                  </div>
                  <DeliberationPanel
                    session={session}
                    personas={personas}
                    isGenerating={isGenerating}
                  />
                </div>
                {session.turns.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setStatus(session.id, "synthesizing"); setStage("synthesize"); }}
                      className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                      Proceed to Synthesis
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {stage === "synthesize" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                        Synthesis
                      </h2>
                      <p className="text-[12px] text-gray-500 mt-1" >
                        Review the board's deliberations and finalize the recommendation
                      </p>
                    </div>
                  </div>

                  {/* Brief summary of discussion */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2" >
                      Deliberation Summary
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={11} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[12px] text-gray-700" >
                          {session.members.length} board members provided initial positions
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <BarChart3 size={11} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[12px] text-gray-700" >
                          {session.turns.filter((t) => t.stage === "key_argument").length} key arguments presented
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={11} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[12px] text-gray-700" >
                          {session.turns.filter((t) => t.stage === "challenge").length} challenges raised by contrarian/risk reviewer
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Brain size={11} className="text-purple-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[12px] text-gray-700" >
                          {session.turns.filter((t) => t.stage === "final_recommendation").length} final synthesis statement{session.turns.filter((t) => t.stage === "final_recommendation").length !== 1 ? "s" : ""} produced
                        </p>
                      </div>
                    </div>
                  </div>

                  {!session.outcome && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3" >
                        Generate Recommendation
                      </p>
                      <button
                        onClick={handleGenerateOutcome}
                        className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                      >
                        <Brain size={12} />
                        Generate Board Recommendation
                      </button>
                    </div>
                  )}
                </div>

                {session.outcome && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setStage("output")}
                      className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                      View Board Memo
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {stage === "output" && (
              <div className="space-y-4">
                <BoardMemoExport
                  session={session}
                  personas={personas}
                  compositePrompt={compositePrompt}
                />
                <div className="flex justify-between">
                  <button
                    onClick={() => setStage("synthesize")}
                    className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft size={13} />
                    Back to Synthesis
                  </button>
                  <button
                    onClick={() => navigate("/boards")}
                    className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  >
                    <CheckCircle2 size={13} />
                    Done — View All Boards
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

async function handleCopy(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success("Composite prompt copied!");
}

