// PersonaMatch.tsx
// Design: Same warm cream + Fraunces/Inter system as the rest of the library
// Layout: Multi-step wizard (Intro → Quiz/Describe → Results)
// Matching: Complementarity scoring — finds personas that fill YOUR gaps
// All client-side, no backend required

import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, ArrowRight, Brain, Zap, Copy, Layers,
  CheckCircle2, RefreshCw, User, FileText, ChevronRight,
  Sparkles, Target, TrendingUp, AlertCircle
} from "lucide-react";
import { personas, type Persona } from "@/lib/personas";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDimension {
  label: string;
  value: number;
  description: string;
}

interface UserProfile {
  name: string;
  role: string;
  dimensions: UserDimension[];
  summary: string;
  inputMode: "quiz" | "freetext";
}

interface PersonaMatch {
  persona: Persona;
  compatibilityScore: number;
  complementarityScore: number;
  gapsFilled: string[];
  whyItWorks: string;
  strengthsAdded: string[];
}

interface StackRecommendation {
  personas: Persona[];
  synergyScore: number;
  compositePrompt: string;
  reasoning: string;
}

// ─── Quiz Questions ────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    id: "decision_speed",
    dimension: "Risk Tolerance",
    question: "When facing a major decision with incomplete information, you typically:",
    options: [
      { label: "Act fast — speed beats perfection", value: 90, icon: "⚡" },
      { label: "Gather key data, then decide quickly", value: 72, icon: "📊" },
      { label: "Research thoroughly before committing", value: 50, icon: "🔍" },
      { label: "Wait until the picture is much clearer", value: 28, icon: "⏳" },
    ],
  },
  {
    id: "communication",
    dimension: "Communication",
    question: "How would your team describe your communication style?",
    options: [
      { label: "Direct and blunt — no sugarcoating", value: 92, icon: "🎯" },
      { label: "Persuasive storyteller — paint a vision", value: 85, icon: "🎭" },
      { label: "Data-driven — show me the numbers", value: 68, icon: "📈" },
      { label: "Collaborative — I listen as much as I talk", value: 55, icon: "🤝" },
    ],
  },
  {
    id: "problem_solving",
    dimension: "First-Principles Thinking",
    question: "When solving a hard problem, your instinct is to:",
    options: [
      { label: "Break it down to first principles from scratch", value: 95, icon: "🧱" },
      { label: "Find analogies from other industries", value: 75, icon: "🔗" },
      { label: "Ask what the best practitioners do", value: 60, icon: "📚" },
      { label: "Trust your gut and iterate", value: 45, icon: "🌀" },
    ],
  },
  {
    id: "competition",
    dimension: "Competitiveness",
    question: "How do you view your competitors?",
    options: [
      { label: "Enemies to be crushed — it's war", value: 97, icon: "⚔️" },
      { label: "Benchmarks that push me to be better", value: 78, icon: "🏁" },
      { label: "Irrelevant — I focus on my own path", value: 60, icon: "🧘" },
      { label: "Potential partners or collaborators", value: 40, icon: "🌐" },
    ],
  },
  {
    id: "vision",
    dimension: "Strategic Vision",
    question: "Your planning horizon is primarily:",
    options: [
      { label: "Decades — I'm building for civilizations", value: 98, icon: "🌌" },
      { label: "5–10 years — strategic positioning", value: 82, icon: "🗺️" },
      { label: "1–3 years — clear milestones", value: 65, icon: "📅" },
      { label: "This quarter — execution is everything", value: 45, icon: "🎯" },
    ],
  },
  {
    id: "empathy",
    dimension: "Empathy",
    question: "When managing people, you prioritize:",
    options: [
      { label: "Results — I hire adults who deliver", value: 35, icon: "📊" },
      { label: "Loyalty and long-term relationships", value: 65, icon: "🤝" },
      { label: "Growth and mentoring the team", value: 80, icon: "🌱" },
      { label: "Psychological safety and wellbeing", value: 92, icon: "💙" },
    ],
  },
];

// ─── Matching Engine ───────────────────────────────────────────────────────────

function computeMatches(userProfile: UserProfile): PersonaMatch[] {
  const userDimMap: Record<string, number> = {};
  userProfile.dimensions.forEach((d) => { userDimMap[d.label] = d.value; });

  return personas.map((persona) => {
    const personaDimMap: Record<string, number> = {};
    persona.personalityDimensions.forEach((d) => { personaDimMap[d.label] = d.value; });

    // Complementarity: persona fills user's weak spots
    let complementaritySum = 0;
    let complementarityMax = 0;
    const gapsFilled: string[] = [];
    const strengthsAdded: string[] = [];

    userProfile.dimensions.forEach((userDim) => {
      const personaVal = personaDimMap[userDim.label] ?? 50;
      const userVal = userDim.value;
      const gap = Math.max(0, 100 - userVal); // how much room for improvement
      const contribution = (gap / 100) * (personaVal / 100) * 100;
      complementaritySum += contribution;
      complementarityMax += gap;

      if (gap > 25 && personaVal > 75) {
        gapsFilled.push(userDim.label);
      }
      if (personaVal > 85) {
        strengthsAdded.push(userDim.label);
      }
    });

    const complementarityScore = complementarityMax > 0
      ? Math.round((complementaritySum / complementarityMax) * 100)
      : 50;

    // Compatibility: how well they'd work together (some similarity is good)
    let compatibilitySum = 0;
    let compatibilityCount = 0;
    userProfile.dimensions.forEach((userDim) => {
      const personaVal = personaDimMap[userDim.label] ?? 50;
      const diff = Math.abs(userDim.value - personaVal);
      // Sweet spot: 20-40 point difference = complementary but not alien
      const score = diff < 20 ? 70 : diff < 40 ? 90 : diff < 60 ? 75 : 50;
      compatibilitySum += score;
      compatibilityCount++;
    });
    const compatibilityScore = Math.round(compatibilitySum / compatibilityCount);

    // Generate why-it-works reasoning
    const topGap = gapsFilled[0] ?? strengthsAdded[0] ?? "Strategic Thinking";
    const whyItWorks = generateWhyItWorks(persona, topGap, userProfile);

    return {
      persona,
      compatibilityScore,
      complementarityScore,
      gapsFilled: Array.from(new Set(gapsFilled)).slice(0, 3),
      whyItWorks,
      strengthsAdded: Array.from(new Set(strengthsAdded)).slice(0, 3),
    };
  }).sort((a, b) => b.complementarityScore - a.complementarityScore);
}

function generateWhyItWorks(persona: Persona, topGap: string, userProfile: UserProfile): string {
  const templates: Record<string, string> = {
    "Risk Tolerance": `${persona.name}'s bias toward bold action will push you to move faster and commit with less information — exactly the counterweight a methodical thinker needs.`,
    "Competitiveness": `${persona.name}'s wartime mindset will sharpen your competitive instincts and help you see market dynamics as battles to be won, not just problems to solve.`,
    "Strategic Vision": `${persona.name}'s long-horizon thinking will help you zoom out from daily execution and anchor decisions in a 10-year strategic frame.`,
    "Communication": `${persona.name}'s communication style will help you craft more compelling narratives and deliver ideas with greater conviction and clarity.`,
    "First-Principles Thinking": `${persona.name}'s habit of breaking everything to first principles will challenge your assumptions and help you find non-obvious solutions.`,
    "Empathy": `${persona.name}'s relationship-building philosophy will help you build deeper loyalty and longer-term partnerships with your team and stakeholders.`,
  };
  return templates[topGap] ?? `${persona.name}'s unique combination of ${persona.personalityTraits.slice(0, 2).join(" and ")} will complement your working style in ways that compound over time.`;
}

function computeStackRecommendation(matches: PersonaMatch[], userProfile: UserProfile): StackRecommendation {
  // Pick top 2 that don't duplicate each other's top strengths
  const top = matches[0];
  const second = matches.find((m) => {
    const topStrengths = new Set(top.strengthsAdded);
    const overlap = m.strengthsAdded.filter((s) => topStrengths.has(s)).length;
    return overlap < 2 && m.persona.id !== top.persona.id;
  }) ?? matches[1];

  const stack = [top.persona, second?.persona].filter(Boolean) as Persona[];
  const synergyScore = Math.round((top.complementarityScore + (second?.complementarityScore ?? 0)) / 2);

  const compositePrompt = `You are a composite AI agent embodying the combined thinking styles of ${stack.map((p) => p.name).join(" and ")}, specifically calibrated to complement the working style of ${userProfile.name || "the user"}.

USER PROFILE CONTEXT:
${userProfile.summary}

${stack.map((p, i) => `━━━ PERSONA ${i + 1}: ${p.name.toUpperCase()} ━━━
${p.aiPersonaPrompt}
`).join("\n")}

CALIBRATION RULES FOR THIS USER:
- The user tends to be strong in: ${userProfile.dimensions.filter((d) => d.value >= 75).map((d) => d.label).join(", ") || "execution and analysis"}
- Compensate for gaps in: ${userProfile.dimensions.filter((d) => d.value < 60).map((d) => d.label).join(", ") || "strategic vision and risk tolerance"}
- When the user seems hesitant, apply ${stack[0]?.name}'s bias toward bold action
- When the user needs a framework, apply ${stack[1]?.name || stack[0]?.name}'s structured thinking approach
- Always be direct about what you would do, not just what options exist`;

  const reasoning = `${stack[0]?.name} fills your ${top.gapsFilled[0] ?? "strategic"} gap with a score of ${top.complementarityScore}% complementarity. ${stack[1] ? `${stack[1].name} adds ${second?.gapsFilled[0] ?? "execution"} strength without duplicating ${stack[0]?.name}'s contributions.` : ""} Together, this stack creates a thinking partner that challenges your defaults while respecting your existing strengths.`;

  return { personas: stack, synergyScore, compositePrompt, reasoning };
}

// ─── Free-text profile parser ─────────────────────────────────────────────────
// Parses keywords from free text to estimate dimension scores

function parseFreetextProfile(text: string, name: string, role: string): UserProfile {
  const lower = text.toLowerCase();

  const score = (highKeywords: string[], lowKeywords: string[], base = 60): number => {
    let s = base;
    highKeywords.forEach((k) => { if (lower.includes(k)) s += 8; });
    lowKeywords.forEach((k) => { if (lower.includes(k)) s -= 8; });
    return Math.min(98, Math.max(20, s));
  };

  const dimensions: UserDimension[] = [
    {
      label: "Risk Tolerance",
      value: score(["bold", "fast", "risk", "bet", "aggressive", "move fast", "decisive"], ["careful", "cautious", "methodical", "thorough", "safe", "conservative"]),
      description: "How comfortable you are with uncertainty and bold bets",
    },
    {
      label: "Strategic Vision",
      value: score(["vision", "long-term", "future", "strategy", "big picture", "decade", "mission"], ["execution", "tactical", "daily", "short-term", "operational"]),
      description: "How far ahead you naturally think",
    },
    {
      label: "Competitiveness",
      value: score(["compete", "win", "dominate", "beat", "market share", "rival", "aggressive"], ["collaborate", "partner", "community", "share", "open", "cooperative"]),
      description: "How you view competition and market dynamics",
    },
    {
      label: "Communication",
      value: score(["direct", "blunt", "clear", "persuade", "present", "storytell", "speak"], ["quiet", "listen", "introvert", "written", "reserved", "prefer email"]),
      description: "How you communicate and influence others",
    },
    {
      label: "First-Principles Thinking",
      value: score(["first principles", "from scratch", "why", "fundamentals", "question", "assumptions", "rethink"], ["best practice", "proven", "standard", "follow", "conventional", "industry norm"]),
      description: "How much you challenge assumptions vs. follow proven paths",
    },
    {
      label: "Empathy",
      value: score(["people", "team", "culture", "empathy", "relationships", "trust", "wellbeing", "mentor"], ["results", "performance", "metrics", "output", "deliver", "accountability"]),
      description: "How much you prioritize human relationships in your work",
    },
  ];

  const summary = `${name || "The user"} describes themselves as: "${text.slice(0, 200)}${text.length > 200 ? "..." : ""}"`;

  return { name, role, dimensions, summary, inputMode: "freetext" };
}

// ─── Radar Chart Component ─────────────────────────────────────────────────────

function ProfileRadar({
  userDimensions,
  personaDimensions,
  personaName,
  personaColor,
}: {
  userDimensions: UserDimension[];
  personaDimensions: { label: string; value: number }[];
  personaName?: string;
  personaColor?: string;
}) {
  const personaMap: Record<string, number> = {};
  personaDimensions.forEach((d) => { personaMap[d.label] = d.value; });

  const data = userDimensions.map((d) => ({
    label: d.label.replace("First-Principles Thinking", "1st Principles").replace("Strategic Vision", "Vision"),
    You: d.value,
    ...(personaName ? { [personaName]: personaMap[d.label] ?? 50 } : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fontSize: 10, fontFamily: "Inter, sans-serif", fill: "#6B7280" }}
        />
        <Radar name="You" dataKey="You" stroke="#1A1A1A" fill="#1A1A1A" fillOpacity={0.12} strokeWidth={2} />
        {personaName && (
          <Radar
            name={personaName}
            dataKey={personaName}
            stroke={personaColor ?? "#7C3AED"}
            fill={personaColor ?? "#7C3AED"}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        )}
        <Tooltip
          contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 11, borderRadius: 8 }}
          formatter={(val: number) => [`${val}%`]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Step Components ───────────────────────────────────────────────────────────

function StepIntro({ onQuiz, onFreetext }: { onQuiz: () => void; onFreetext: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16 px-4">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 mb-6" style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}>
        <Sparkles size={10} className="text-amber-500" />
        PERSONA MATCH ENGINE
      </div>
      <h1 className="text-[32px] sm:text-[40px] font-bold text-gray-900 leading-[1.1] mb-4" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
        Find Your <em>Perfect</em> AI Agent Stack
      </h1>
      <p className="text-[14px] text-gray-500 leading-relaxed mb-10 max-w-lg mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
        Describe your working style and we'll match you with the personas that fill your gaps — not mirror your strengths. The best AI agent stack is the one that thinks differently from you.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 text-left mb-8">
        <button
          onClick={onQuiz}
          className="group p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-900 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-3">
            <Brain size={18} className="text-white" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            Take the Quiz
          </h3>
          <p className="text-[12px] text-gray-500 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
            6 questions about how you think, decide, and lead. Takes 2 minutes.
          </p>
          <div className="flex items-center gap-1 mt-3 text-[11px] font-semibold text-gray-400 group-hover:text-gray-900 transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
            Start Quiz <ArrowRight size={11} />
          </div>
        </button>

        <button
          onClick={onFreetext}
          className="group p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-900 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center mb-3">
            <FileText size={18} className="text-white" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            Describe Yourself
          </h3>
          <p className="text-[12px] text-gray-500 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
            Paste your agent's system prompt or describe your working style in your own words.
          </p>
          <div className="flex items-center gap-1 mt-3 text-[11px] font-semibold text-gray-400 group-hover:text-gray-900 transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
            Write Description <ArrowRight size={11} />
          </div>
        </button>
      </div>

      <div className="flex items-center justify-center gap-6 text-[11px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
        {[
          { icon: <Target size={11} />, text: "Complementarity matching" },
          { icon: <Layers size={11} />, text: "Stack synergy scoring" },
          { icon: <Copy size={11} />, text: "Ready-to-use composite prompt" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-1.5">
            <span className="text-gray-300">{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepQuiz({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [showMeta, setShowMeta] = useState(true);

  const question = QUIZ_QUESTIONS[currentQ];
  const progress = ((currentQ) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [question.dimension]: value };
    setAnswers(newAnswers);
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 300);
    } else {
      // Build profile from answers
      const dimensions: UserDimension[] = QUIZ_QUESTIONS.map((q) => ({
        label: q.dimension,
        value: newAnswers[q.dimension] ?? 60,
        description: `Self-assessed from quiz`,
      }));
      const summary = `${name || "The user"} (${role || "professional"}) completed the working style quiz.`;
      onComplete({ name, role, dimensions, summary, inputMode: "quiz" });
    }
  };

  if (showMeta) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 mb-8 transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
          <ArrowLeft size={13} /> Back
        </button>
        <h2 className="text-[24px] font-bold text-gray-900 mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>First, tell us about you</h2>
        <p className="text-[13px] text-gray-500 mb-6" style={{ fontFamily: "Inter, sans-serif" }}>Optional — helps personalize your match results.</p>
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Your name or alias</label>
            <input
              type="text"
              placeholder="e.g. Alex, or leave blank"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 placeholder-gray-300"
              style={{ fontFamily: "Inter, sans-serif" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Your role or context</label>
            <input
              type="text"
              placeholder="e.g. Founder, Engineer, Product Manager, Investor"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 placeholder-gray-300"
              style={{ fontFamily: "Inter, sans-serif" }}
            />
          </div>
        </div>
        <button
          onClick={() => setShowMeta(false)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Start Quiz <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] text-gray-400 flex-shrink-0" style={{ fontFamily: "Inter, sans-serif" }}>
          {currentQ + 1} / {QUIZ_QUESTIONS.length}
        </span>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
          {question.dimension}
        </div>
        <h2 className="text-[20px] font-bold text-gray-900 leading-snug" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleAnswer(opt.value)}
            className="w-full flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all text-left group"
          >
            <span className="text-xl flex-shrink-0">{opt.icon}</span>
            <span className="text-[13px] font-medium text-gray-800 group-hover:text-gray-900" style={{ fontFamily: "Inter, sans-serif" }}>
              {opt.label}
            </span>
            <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-600 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFreetext({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = () => {
    if (text.trim().length < 20) {
      toast.error("Please write at least a sentence or two about your working style.");
      return;
    }
    const profile = parseFreetextProfile(text, name, role);
    onComplete(profile);
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <h2 className="text-[24px] font-bold text-gray-900 mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Describe your working style</h2>
      <p className="text-[13px] text-gray-500 mb-6 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
        Write freely or paste your agent's existing system prompt. We'll extract your working dimensions and find your best persona matches.
      </p>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Name (optional)</label>
            <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-[12px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 placeholder-gray-300" style={{ fontFamily: "Inter, sans-serif" }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Role (optional)</label>
            <input type="text" placeholder="e.g. Founder" value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-[12px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 placeholder-gray-300" style={{ fontFamily: "Inter, sans-serif" }} />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>
            Your working style or agent system prompt
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Examples:\n• "I'm a methodical thinker who prefers data over intuition. I'm risk-averse and prefer to build consensus before making decisions..."\n• "I move fast, trust my gut, and prefer to ask forgiveness rather than permission..."\n• Paste your agent's existing system prompt here`}
            rows={8}
            className="w-full px-3.5 py-3 text-[12.5px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 placeholder-gray-300 resize-none leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
              {text.length < 20 ? `${20 - text.length} more characters needed` : `${text.length} characters — ready to analyze`}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={text.trim().length < 20}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <Sparkles size={14} />
        Analyze & Find My Matches
      </button>
    </div>
  );
}

// ─── Results Page ──────────────────────────────────────────────────────────────

function StepResults({
  userProfile,
  onReset,
}: {
  userProfile: UserProfile;
  onReset: () => void;
}) {
  const matches = useMemo(() => computeMatches(userProfile), [userProfile]);
  const stack = useMemo(() => computeStackRecommendation(matches, userProfile), [matches, userProfile]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PersonaMatch | null>(matches[0] ?? null);

  const handleCopyStack = () => {
    navigator.clipboard.writeText(stack.compositePrompt);
    setCopiedPrompt(true);
    toast.success("Composite stack prompt copied to clipboard!");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const topMatch = matches[0];

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            Your Persona Match Results
          </h2>
          <p className="text-[12.5px] text-gray-500 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            {userProfile.name ? `Matched for ${userProfile.name}` : "Matched for your working style"} · {matches.length} personas analyzed
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <RefreshCw size={12} /> Retake
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: Your Profile */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                  {userProfile.name || "Your Profile"}
                </div>
                {userProfile.role && (
                  <div className="text-[10px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>{userProfile.role}</div>
                )}
              </div>
            </div>

            {/* Radar: user vs top match */}
            <ProfileRadar
              userDimensions={userProfile.dimensions}
              personaDimensions={selectedMatch?.persona.personalityDimensions ?? []}
              personaName={selectedMatch?.persona.name}
              personaColor={selectedMatch ? "#7C3AED" : undefined}
            />

            <div className="mt-3 space-y-2">
              {userProfile.dimensions.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-28 flex-shrink-0 truncate" style={{ fontFamily: "Inter, sans-serif" }}>{d.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${d.value}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 w-6 text-right">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Stack */}
          <div className="bg-gray-900 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={13} className="text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400" style={{ fontFamily: "Inter, sans-serif" }}>
                Recommended Stack
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {stack.personas.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold">
                    {p.name[0]}
                  </div>
                  <span className="text-[11px] font-medium text-white/90" style={{ fontFamily: "Inter, sans-serif" }}>{p.name.split(" ")[0]}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1">
                <TrendingUp size={11} className="text-green-400" />
                <span className="text-[11px] font-bold text-green-400">{stack.synergyScore}%</span>
              </div>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              {stack.reasoning}
            </p>
            <button
              onClick={handleCopyStack}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-gray-900 rounded-xl text-[12px] font-bold hover:bg-gray-100 transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {copiedPrompt ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
              {copiedPrompt ? "Copied!" : "Copy Composite Prompt"}
            </button>
          </div>
        </div>

        {/* Right: Match Rankings */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
            All Persona Matches — Ranked by Complementarity
          </h3>
          {matches.map((match, i) => (
            <button
              key={match.persona.id}
              onClick={() => setSelectedMatch(match)}
              className={`w-full text-left p-4 bg-white rounded-2xl border-2 transition-all hover:border-gray-400 ${selectedMatch?.persona.id === match.persona.id ? "border-gray-900" : "border-gray-200"}`}
            >
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{
                    background: i === 0 ? "#1A1A1A" : i === 1 ? "#7C3AED" : "#F3F4F6",
                    color: i < 2 ? "white" : "#6B7280",
                    fontFamily: "Fraunces, Georgia, serif",
                  }}
                >
                  {i + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                      {match.persona.name}
                      {match.persona.nativeName && (
                        <span className="text-[12px] font-normal text-gray-400 ml-1.5">{match.persona.nativeName}</span>
                      )}
                    </span>
                    {i === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700" style={{ fontFamily: "Inter, sans-serif" }}>
                        TOP MATCH
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-gray-500 leading-relaxed mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    {match.whyItWorks}
                  </p>
                  {/* Gaps filled */}
                  {match.gapsFilled.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Fills:</span>
                      {match.gapsFilled.map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-100" style={{ fontFamily: "Inter, sans-serif" }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-[20px] font-bold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                    {match.complementarityScore}%
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>
                    Complementarity
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                    {match.compatibilityScore}% compatible
                  </div>
                </div>
              </div>

              {/* Expanded: radar + strengths when selected */}
              {selectedMatch?.persona.id === match.persona.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <ProfileRadar
                        userDimensions={userProfile.dimensions}
                        personaDimensions={match.persona.personalityDimensions}
                        personaName={match.persona.name.split(" ")[0]}
                        personaColor="#7C3AED"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                          Strengths This Persona Adds
                        </div>
                        <div className="space-y-1.5">
                          {match.strengthsAdded.slice(0, 4).map((s) => (
                            <div key={s} className="flex items-center gap-2">
                              <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
                              <span className="text-[11px] text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                          Signature Frameworks
                        </div>
                        <div className="space-y-1">
                          {match.persona.thinkingFrameworks.slice(0, 2).map((f) => (
                            <div key={f.name} className="flex items-start gap-2">
                              <AlertCircle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="text-[11px] text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>{f.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Link href={`/persona/${match.persona.id}`}>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-900 hover:text-gray-600 transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
                          View Full Profile <ArrowRight size={11} />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Step = "intro" | "quiz" | "freetext" | "results";

export default function PersonaMatch() {
  const [step, setStep] = useState<Step>("intro");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setStep("results");
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #FAFAF8 0%, #F5F3EE 60%, #EEF0F5 100%)" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-screen-xl mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors">
                <ArrowLeft size={14} />
                <span className="text-[12px] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>Persona Library</span>
              </div>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-[12px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Persona Match</span>
          </div>
          {step === "results" && (
            <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              <CheckCircle2 size={12} />
              Analysis complete
            </div>
          )}
        </div>
      </nav>

      {/* Step Router */}
      {step === "intro" && (
        <StepIntro
          onQuiz={() => setStep("quiz")}
          onFreetext={() => setStep("freetext")}
        />
      )}
      {step === "quiz" && (
        <StepQuiz onComplete={handleProfileComplete} />
      )}
      {step === "freetext" && (
        <StepFreetext onComplete={handleProfileComplete} />
      )}
      {step === "results" && userProfile && (
        <StepResults
          userProfile={userProfile}
          onReset={() => { setStep("intro"); setUserProfile(null); }}
        />
      )}
    </div>
  );
}
