// DESIGN: Reading-focused persona deep-dive
// Layout: sticky left identity card + right tabbed content
// Hero tabs: Thinking Style | Working Style | AI Prompt | then Overview / News / Network
// Thinking: expandable framework cards with howToApply + example
// Working: leadership style, team dynamics, communication, vocabulary patterns
// Prompt: full system prompt + short prompt + use-case prompts, all copyable
// Mental: internal monologue reconstructions (MentalModelCard)
// Competition: competitor intelligence panel (CompetitorGraph + SkillChainCard)

import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, Copy, CheckCircle2, Brain, Zap, BookOpen,
  Users, TrendingUp, Globe, Calendar, Newspaper, Network,
  ChevronDown, ChevronRight, Star, AlertTriangle, Quote,
  MessageSquare, Layers, ExternalLink, Clock, Tag, Swords,
  Target, Lightbulb
} from "lucide-react";
import { personas, getRelatedPersonas, FRESHNESS_CONFIG, type Persona } from "@/lib/personas";
import { toast } from "sonner";
import { MentalModelCard } from "@/components/MentalModelCard";
import { CompetitorGraph } from "@/components/CompetitorGraph";
import { SkillChainCard } from "@/components/SkillChainCard";

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all"
      style={{
        fontFamily: "Inter, sans-serif",
        background: copied ? "#F0FDF4" : "white",
        borderColor: copied ? "#86EFAC" : "#E5E7EB",
        color: copied ? "#15803D" : "#374151",
      }}
    >
      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[20px] font-bold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-500 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>{subtitle}</p>}
    </div>
  );
}

/** Avatar for library chips — avoids broken `<img src="">` and does not depend on external placeholder APIs */
function PersonaAvatarThumb({ persona: p, size }: { persona: Persona; size: "sm" | "md" }) {
  const [failed, setFailed] = useState(false);
  const initials = p.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const src = p.image?.trim();
  const showImg = Boolean(src) && !failed;

  if (size === "sm") {
    if (!showImg) {
      return (
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${p.accentColor}, ${p.accentColor}cc)`,
            fontFamily: "Fraunces, Georgia, serif",
          }}
        >
          {initials}
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={p.name}
        className="w-6 h-6 rounded-md object-cover object-top flex-shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }

  if (!showImg) {
    return (
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${p.accentColor}, ${p.accentColor}cc)`,
          border: `2px solid ${p.accentColor}30`,
          fontFamily: "Fraunces, Georgia, serif",
        }}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={p.name}
      className="w-14 h-14 rounded-xl object-cover object-top flex-shrink-0"
      style={{ border: `2px solid ${p.accentColor}30` }}
      onError={() => setFailed(true)}
    />
  );
}

function FrameworkCard({ framework, accentColor }: { framework: { name: string; description: string; howToApply: string; example: string }; accentColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl border border-gray-200 overflow-hidden transition-all"
      style={{ background: open ? `${accentColor}04` : "white" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}15` }}>
            <Brain size={14} style={{ color: accentColor }} />
          </div>
          <span className="text-[14px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{framework.name}</span>
        </div>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <p className="text-[13px] text-gray-700 leading-relaxed pt-3" style={{ fontFamily: "Inter, sans-serif" }}>
            {framework.description}
          </p>

          <div className="rounded-lg p-3" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={11} style={{ color: accentColor }} />
              <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: accentColor, fontFamily: "Inter, sans-serif" }}>How to apply</span>
            </div>
            <p className="text-[12.5px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{framework.howToApply}</p>
          </div>

          <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Star size={11} className="text-amber-500" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>Real example</span>
            </div>
            <p className="text-[12.5px] text-gray-600 leading-relaxed italic" style={{ fontFamily: "Inter, sans-serif" }}>{framework.example}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PromptBlock({
  title,
  subtitle,
  prompt,
  accentColor,
  mono = false,
}: {
  title: string;
  subtitle?: string;
  prompt: string;
  accentColor: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <span className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{title}</span>
          {subtitle && <span className="text-[11px] text-gray-500 ml-2" style={{ fontFamily: "Inter, sans-serif" }}>{subtitle}</span>}
        </div>
        <CopyButton text={prompt} label="Copy Prompt" />
      </div>
      <div className="p-4 max-h-72 overflow-y-auto">
        <pre
          className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: mono ? "'JetBrains Mono', monospace" : "Inter, sans-serif" }}
        >
          {prompt}
        </pre>
      </div>
    </div>
  );
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────
export default function PersonaDetail() {
  const params = useParams<{ id: string }>();
  const persona = personas.find((p) => p.id === params.id);
  const [activeTab, setActiveTab] = useState<"thinking" | "working" | "prompts" | "overview" | "news" | "network" | "mental" | "competition">("thinking");

  if (!persona) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F6F2" }}>
        <div className="text-center">
          <p className="text-[18px] font-semibold text-gray-800 mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Persona not found</p>
          <Link href="/">
            <button className="text-[13px] text-gray-600 hover:text-gray-900 underline" style={{ fontFamily: "Inter, sans-serif" }}>← Back to library</button>
          </Link>
        </div>
      </div>
    );
  }

  const freshness = FRESHNESS_CONFIG[persona.freshnessStatus];
  const relatedPersonas = getRelatedPersonas(persona.id);

  const TABS = [
    { id: "thinking",     label: "Thinking Style", icon: <Brain size={13} /> },
    { id: "working",      label: "Working Style",  icon: <Zap size={13} /> },
    { id: "prompts",      label: "AI Prompts",      icon: <Copy size={13} /> },
    { id: "overview",     label: "Overview",        icon: <BookOpen size={13} /> },
    { id: "news",         label: "News",            icon: <Newspaper size={13} /> },
    { id: "network",      label: "Network",         icon: <Network size={13} /> },
    { id: "mental",       label: "Inner Voice",      icon: <Lightbulb size={13} /> },
    { id: "competition",  label: "Competitive",     icon: <Swords size={13} /> },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "#F7F6F2" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/95 border-b border-gray-200" style={{ backdropFilter: "blur(8px)", boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
              <ArrowLeft size={14} />
              Persona Library
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <CopyButton text={persona.aiPersonaPrompt} label="Copy System Prompt" />
          </div>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${persona.accentColor}18 0%, ${persona.accentColor}08 50%, #F7F6F2 100%)`, borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-screen-xl mx-auto px-5 py-8">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Portrait */}
            <div className="flex-shrink-0 relative">
              {persona.image ? (
                <img
                  src={persona.image}
                  alt={persona.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover object-top shadow-md"
                  style={{ border: `3px solid ${persona.accentColor}30` }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const initials = persona.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
                      const div = document.createElement("div");
                      div.className = "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-md text-white font-bold text-2xl";
                      div.style.background = `linear-gradient(135deg, ${persona.accentColor}, ${persona.accentColor}cc)`;
                      div.style.border = `3px solid ${persona.accentColor}30`;
                      div.style.fontFamily = "Fraunces, Georgia, serif";
                      div.textContent = initials;
                      parent.insertBefore(div, target);
                    }
                  }}
                />
              ) : (
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-md text-white font-bold text-2xl"
                  style={{ background: `linear-gradient(135deg, ${persona.accentColor}, ${persona.accentColor}cc)`, border: `3px solid ${persona.accentColor}30`, fontFamily: "Fraunces, Georgia, serif" }}
                >
                  {persona.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ background: freshness.dot }}
                title={freshness.label}
              />
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {(persona.categories || []).map((cat) => (
                  <span key={cat} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${persona.accentColor}15`, color: persona.accentColor, fontFamily: "Inter, sans-serif", border: `1px solid ${persona.accentColor}30` }}>
                    {cat}
                  </span>
                ))}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                  {persona.mbtiType}
                </span>
              </div>
              <h1 className="text-[22px] sm:text-[34px] font-bold text-gray-900 leading-tight mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                {persona.name}
                {persona.nativeName && (
                  <span
                    className="block text-[16px] sm:text-[20px] text-gray-400 mt-0.5"
                    style={{ fontFamily: "Fraunces, Georgia, serif" }}
                  >
                    {persona.nativeName}
                  </span>
                )}
              </h1>
              <p className="text-[14px] text-gray-600 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>{persona.title}</p>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl" style={{ fontFamily: "Inter, sans-serif" }}>{persona.shortBio}</p>
            </div>

            {/* Quick stats */}
            <div className="hidden md:flex flex-col gap-2 flex-shrink-0">
              {[
                { label: "Prompt v", value: persona.promptVersion },
                { label: "Sources", value: persona.dataSourceCount },
                { label: "Updated", value: persona.lastUpdated.slice(0, 7) },
              ].map((s) => (
                <div key={s.label} className="text-right">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>{s.label}</div>
                  <div className="text-[13px] font-semibold text-gray-800" style={{ fontFamily: "Inter, sans-serif" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-200" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
        <div className="max-w-screen-xl mx-auto px-5">
            <div className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 text-[12px] sm:text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden inline text-[10px]">{tab.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-screen-xl mx-auto px-5 py-8">
        <div className="flex gap-8">

          {/* ── Left identity sidebar ── */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 space-y-5">

              {/* Personality Dimensions */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-3" style={{ fontFamily: "Inter, sans-serif" }}>Personality Radar</p>
                <div className="space-y-3">
                  {(persona.personalityDimensions || []).map((dim) => (
                    <div key={dim.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11.5px] font-medium text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>{dim.label}</span>
                        <span className="text-[11px] font-mono font-bold" style={{ color: persona.accentColor }}>{dim.value}</span>
                      </div>
                      <div className="stat-bar-track">
                        <div className="stat-bar-fill" style={{ width: `${dim.value}%`, background: persona.accentColor } as React.CSSProperties} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>{dim.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traits */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-3" style={{ fontFamily: "Inter, sans-serif" }}>Core Traits</p>
                <div className="flex flex-wrap gap-1.5">
                  {(persona.personalityTraits || []).map((trait) => (
                    <span key={trait} className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Identity */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-1" style={{ fontFamily: "Inter, sans-serif" }}>Identity</p>
                {[
                  { label: "Born", value: persona.born },
                  { label: "Nationality", value: persona.nationality },
                  { label: "MBTI", value: persona.mbtiType ?? "—" },
                  { label: "Enneagram", value: persona.enneagramType ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-start gap-2">
                    <span className="text-[11px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>{item.label}</span>
                    <span className="text-[11px] font-medium text-gray-800 text-right" style={{ fontFamily: "Inter, sans-serif" }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Freshness */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>Data Freshness</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: freshness.dot }} />
                  <span className="text-[12px] font-semibold" style={{ color: freshness.color, fontFamily: "Inter, sans-serif" }}>{freshness.label}</span>
                </div>
                <p className="text-[10.5px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                  {persona.dataSourceCount} sources · Updated {persona.lastUpdated.slice(0, 7)}
                </p>
              </div>
            </div>
          </aside>

          {/* ── Right content ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ════ THINKING STYLE ════ */}
            {activeTab === "thinking" && (
              <div>
                <SectionHeader
                  title="Thinking Style"
                  subtitle={`How ${persona.name.split(" ")[0]} approaches problems, decisions, and strategy`}
                />

                {/* Decision making + problem solving */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} style={{ color: persona.accentColor }} />
                      <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Decision Making</span>
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{persona.decisionMakingStyle}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} style={{ color: persona.accentColor }} />
                      <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Problem Solving</span>
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{persona.problemSolvingApproach || "—"}</p>
                  </div>
                </div>

                {/* Thinking Frameworks */}
                <div className="mb-6">
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                    Mental Frameworks ({(persona.thinkingFrameworks || []).length})
                  </h3>
                  <div className="space-y-2">
                    {(persona.thinkingFrameworks || []).map((fw) => (
                      <FrameworkCard key={fw.name} framework={fw} accentColor={persona.accentColor} />
                    ))}
                  </div>
                </div>

                {/* Key Skills */}
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Key Skills</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(persona.keySkills || []).map((skill) => (
                      <div key={skill.name} className="bg-white rounded-xl border border-gray-200 p-3.5">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{skill.name}</span>
                          <span className="text-[11px] font-mono font-bold flex-shrink-0 ml-2" style={{ color: persona.accentColor }}>{skill.level}</span>
                        </div>
                        <div className="stat-bar-track mb-2">
                          <div className="stat-bar-fill" style={{ width: `${skill.level}%`, background: persona.accentColor } as React.CSSProperties} />
                        </div>
                        <p className="text-[11.5px] text-gray-500 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{skill.description}</p>
                        <span className="inline-block mt-1.5 text-[9.5px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${persona.accentColor}12`, color: persona.accentColor, fontFamily: "Inter, sans-serif" }}>
                          {skill.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════ WORKING STYLE ════ */}
            {activeTab === "working" && (
              <div>
                <SectionHeader
                  title="Working Style"
                  subtitle={`How ${persona.name.split(" ")[0]} operates day-to-day, leads teams, and communicates`}
                />

                {/* Working / Leadership / Team */}
                <div className="space-y-4 mb-6">
                  {[
                    { label: "Working Style", icon: <TrendingUp size={14} />, content: persona.workingStyle },
                    { label: "Leadership Style", icon: <Users size={14} />, content: persona.leadershipStyle },
                    { label: "Team Dynamics", icon: <Globe size={14} />, content: persona.teamDynamics },
                  ].filter((item) => item.content).map((item) => (
                    <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: persona.accentColor }}>{item.icon}</span>
                        <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>{item.label}</span>
                      </div>
                      <p className="text-[13px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{item.content}</p>
                    </div>
                  ))}
                </div>

                {/* Communication Style */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} style={{ color: persona.accentColor }} />
                    <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Communication Style</span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{persona.communicationStyle}</p>
                </div>

                {/* Vocabulary Patterns */}
                <div className="mb-6">
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Signature Vocabulary</h3>
                  <div className="space-y-2">
                    {(persona.vocabularyPatterns || []).map((vp) => (
                      <div key={vp.phrase} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                            background: vp.frequency === "Signature" ? `${persona.accentColor}15` : "#F3F4F6",
                            color: vp.frequency === "Signature" ? persona.accentColor : "#6B7280",
                            fontFamily: "Inter, sans-serif",
                          }}>
                            {vp.frequency}
                          </span>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900 mb-0.5" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                            "{vp.phrase}"
                          </p>
                          <p className="text-[11.5px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>{vp.context}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blind Spots */}
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Known Blind Spots</span>
                  </div>
                  <p className="text-[13px] text-amber-800 leading-relaxed mb-3" style={{ fontFamily: "Inter, sans-serif" }}>{persona.weaknesses}</p>
                  <ul className="space-y-1.5">
                    {(persona.blindSpots || []).map((bs) => (
                      <li key={bs} className="flex items-start gap-2 text-[12.5px] text-amber-700" style={{ fontFamily: "Inter, sans-serif" }}>
                        <ChevronRight size={12} className="flex-shrink-0 mt-0.5" />
                        {bs}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Resources */}
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Recommended Resources</h3>
                  <div className="space-y-2">
                    {(persona.recommendedResources || []).map((res) => (
                      <div key={res.title} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          <BookOpen size={14} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{res.title}</p>
                          <p className="text-[11.5px] text-gray-500 mb-1" style={{ fontFamily: "Inter, sans-serif" }}>{res.author} · {res.type}</p>
                          <p className="text-[11.5px] text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>{res.relevance}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════ AI PROMPTS ════ */}
            {activeTab === "prompts" && (
              <div>
                <SectionHeader
                  title="AI Persona Prompts"
                  subtitle="Copy and paste into any LLM to activate this persona"
                />

                {/* How to use */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Layers size={14} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>How to install this persona</p>
                      <p className="text-[12.5px] text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                        Copy the <strong>Full System Prompt</strong> and paste it as the <em>system message</em> in ChatGPT, Claude, or any LLM that supports custom instructions. The prompt includes personality rules, communication style, vocabulary patterns, thinking frameworks, and behavioral constraints — everything the model needs to strictly copy {persona.name.split(" ")[0]}'s thinking style.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick prompt */}
                <PromptBlock
                  title="Quick Prompt"
                  subtitle="≤ 280 chars — for fast context injection"
                  prompt={persona.aiPersonaPromptShort}
                  accentColor={persona.accentColor}
                />

                <div className="mt-4">
                  <PromptBlock
                    title="Full System Prompt"
                    subtitle={`v${persona.promptVersion} — complete behavioral rules`}
                    prompt={persona.aiPersonaPrompt}
                    accentColor={persona.accentColor}
                    mono
                  />
                </div>

                {/* Use-case prompts */}
                {(persona.useCasePrompts || []).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                      Use-Case Prompts ({(persona.useCasePrompts || []).length})
                    </h3>
                    <div className="space-y-3">
                      {(persona.useCasePrompts || []).map((uc) => (
                        <div key={uc.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[18px]">{uc.icon}</span>
                              <div>
                                <p className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{uc.title}</p>
                                <p className="text-[11px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>{uc.description}</p>
                              </div>
                            </div>
                            <CopyButton text={uc.prompt} />
                          </div>
                          <div className="px-4 py-3 bg-gray-50">
                            <p className="text-[11.5px] text-gray-600 leading-relaxed line-clamp-3 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {uc.prompt}
                            </p>
                          </div>
                          <div className="px-4 py-2 flex gap-1.5">
                            {uc.tags.map((tag) => (
                              <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt changelog */}
                <div className="mt-6">
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Prompt Changelog</h3>
                  <div className="space-y-2">
                    {(persona.promptChangelog || []).map((v) => (
                      <div key={v.version} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-3.5">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 flex-shrink-0" style={{ fontFamily: "Inter, sans-serif" }}>
                          v{v.version}
                        </span>
                        <div>
                          <p className="text-[10.5px] text-gray-400 mb-0.5" style={{ fontFamily: "Inter, sans-serif" }}>{v.date}</p>
                          <p className="text-[12.5px] text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>{v.changes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════ OVERVIEW ════ */}
            {activeTab === "overview" && (
              <div>
                <SectionHeader title="Biography" subtitle={`${persona.name}'s full story and background`} />

                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                  <p className="text-[14px] text-gray-700 leading-[1.8]" style={{ fontFamily: "Inter, sans-serif" }}>{persona.fullBio}</p>
                </div>

                {/* Famous Quotes */}
                <div className="mb-6">
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Signature Quotes</h3>
                  <div className="space-y-3">
                    {(persona.famousQuotes || []).map((q) => (
                      <blockquote
                        key={q}
                        className="relative pl-5 py-1"
                        style={{ borderLeft: `3px solid ${persona.accentColor}` }}
                      >
                        <p className="text-[14px] text-gray-800 italic leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>"{q}"</p>
                      </blockquote>
                    ))}
                  </div>
                </div>

                {/* Accomplishments timeline */}
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Accomplishments Timeline</h3>
                  <div className="relative">
                    <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-200" />
                    <div className="space-y-4">
                      {(persona.accomplishments || []).map((acc) => (
                        <div key={acc.title} className="flex gap-4 relative">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold z-10"
                            style={{ background: acc.impact === "Transformative" ? persona.accentColor : acc.impact === "High" ? `${persona.accentColor}80` : "#D1D5DB", fontFamily: "Inter, sans-serif" }}
                          >
                            {acc.year.slice(2)}
                          </div>
                          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3.5 mb-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{acc.title}</p>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{
                                background: acc.impact === "Transformative" ? `${persona.accentColor}15` : "#F3F4F6",
                                color: acc.impact === "Transformative" ? persona.accentColor : "#6B7280",
                                fontFamily: "Inter, sans-serif",
                              }}>
                                {acc.impact}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-gray-500 mb-1.5" style={{ fontFamily: "Inter, sans-serif" }}>{acc.year}</p>
                            <p className="text-[12.5px] text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{acc.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {acc.tags.map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ NEWS ════ */}
            {activeTab === "news" && (
              <div>
                <SectionHeader title="Recent News" subtitle={`Latest developments and actions from ${persona.name}`} />
                <div className="space-y-3">
                  {(persona.recentNews || []).map((item) => (
                    <div key={item.headline} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-[14px] font-semibold text-gray-900 leading-snug" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{item.headline}</h4>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.sentiment === "Positive" ? "bg-green-50 text-green-700" :
                          item.sentiment === "Negative" ? "bg-red-50 text-red-700" :
                          item.sentiment === "Controversial" ? "bg-orange-50 text-orange-700" :
                          "bg-gray-100 text-gray-600"
                        }`} style={{ fontFamily: "Inter, sans-serif" }}>
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-gray-600 leading-relaxed mb-2" style={{ fontFamily: "Inter, sans-serif" }}>{item.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {item.date}</span>
                          <span className="flex items-center gap-1"><Newspaper size={10} /> {item.source}</span>
                        </div>
                        <div className="flex gap-1">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════ NETWORK ════ */}
            {activeTab === "network" && (
              <div>
                <SectionHeader title="Network & Relationships" subtitle={`${persona.name}'s key connections and how they relate`} />

                {relatedPersonas.length > 0 ? (
                  <div className="space-y-3">
                    {relatedPersonas.map(({ persona: related, relationship }) => (
                      <div key={related.id} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start gap-4">
                          <PersonaAvatarThumb persona={related} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link href={`/persona/${related.id}`}>
                                <span className="text-[14px] font-semibold text-gray-900 hover:underline cursor-pointer" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{related.name}</span>
                              </Link>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                                background: relationship.type === "Ally" ? "#DCFCE7" : relationship.type === "Rival" ? "#FEE2E2" : relationship.type === "Mentor" ? "#EDE9FE" : "#FEF3C7",
                                color: relationship.type === "Ally" ? "#15803D" : relationship.type === "Rival" ? "#DC2626" : relationship.type === "Mentor" ? "#7C3AED" : "#B45309",
                                fontFamily: "Inter, sans-serif",
                              }}>
                                {relationship.type}
                              </span>
                              <span className="text-[10px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>{relationship.status}</span>
                            </div>
                            <p className="text-[12.5px] text-gray-600 leading-relaxed mb-2" style={{ fontFamily: "Inter, sans-serif" }}>{relationship.description}</p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-24">
                                <div className="stat-bar-track">
                                  <div className="stat-bar-fill" style={{ width: `${relationship.strength}%`, background: related.accentColor } as React.CSSProperties} />
                                </div>
                              </div>
                              <span className="text-[10.5px] text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>Bond {relationship.strength}/100 · since {relationship.since}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Network size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-[13px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>No relationships mapped yet</p>
                  </div>
                )}

                {/* All personas mini-map */}
                <div className="mt-6">
                  <h3 className="text-[15px] font-semibold text-gray-800 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>All Personas in Library</h3>
                  <div className="flex flex-wrap gap-2">
                    {personas.filter((p) => p.id !== persona.id).map((p) => (
                      <Link key={p.id} href={`/persona/${p.id}`}>
                        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                          <PersonaAvatarThumb persona={p} size="sm" />
                          <span className="text-[12px] font-medium text-gray-700 whitespace-nowrap" style={{ fontFamily: "Inter, sans-serif" }}>{p.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════ INNER VOICE (Mental Models) ════ */}
            {activeTab === "mental" && (
              <div>
                <SectionHeader
                  title="Inner Voice"
                  subtitle={`What ${persona.name.split(" ")[0]} actually thinks when no one is watching`}
                />
                <div className="rounded-xl border border-gray-200 bg-white p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb size={14} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>How to read this section</p>
                      <p className="text-[12.5px] text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                        These are reconstructions based on interviews, memoirs, biographies, and public statements. Each mental model shows the trigger that activates it, the internal monologue that runs through this person's mind, and the output behavior it produces. Think of it as a window into how they actually reason — not the polished version they tell the public, but the private cognitive engine.
                      </p>
                    </div>
                  </div>
                </div>

                {persona.mentalModels && persona.mentalModels.length > 0 ? (
                  <div className="space-y-2">
                    {persona.mentalModels.map((model) => (
                      <MentalModelCard key={model.name} model={model} accentColor={persona.accentColor} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Brain size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-[13px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>Mental model reconstruction in progress</p>
                  </div>
                )}

                {/* Decision Journal */}
                {persona.decisionJournal && persona.decisionJournal.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-[15px] font-semibold text-gray-800 mb-4" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                      Decision Journal ({persona.decisionJournal.length})
                    </h3>
                    <div className="space-y-4">
                      {persona.decisionJournal.map((entry, idx) => (
                        <div key={`${entry.year}-${idx}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                            <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800" style={{ fontFamily: "Inter, sans-serif" }}>
                              {entry.year}
                            </span>
                            <p className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                              {entry.situation}
                            </p>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1.5" style={{ fontFamily: "Inter, sans-serif" }}>
                                Options Considered
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {entry.optionsTheyConsidered.map((opt, i) => (
                                  <span key={i} className="text-[11.5px] px-2 py-1 rounded bg-gray-100 text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-lg p-3" style={{ background: `${persona.accentColor}08`, border: `1px solid ${persona.accentColor}20` }}>
                              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                Why This Choice
                              </p>
                              <p className="text-[12.5px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                {entry.whyTheyPickedIt}
                              </p>
                            </div>
                            <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
                              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                What Happened
                              </p>
                              <p className="text-[12.5px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                {entry.whatHappened}
                              </p>
                            </div>
                            {entry.wouldDoDifferently && (
                              <div className="rounded-lg p-3 bg-amber-50 border border-amber-200">
                                <p className="text-[10.5px] font-bold text-amber-700 uppercase tracking-wide mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                  What They'd Do Differently
                                </p>
                                <p className="text-[12.5px] text-amber-800 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                  {entry.wouldDoDifferently}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════ COMPETITIVE INTELLIGENCE ════ */}
            {activeTab === "competition" && (
              <div>
                <SectionHeader
                  title="Competitive Intelligence"
                  subtitle={`How ${persona.name.split(" ")[0]} sees the battlefield — rivals, threats, and strategic worldview`}
                />

                {/* Competitor Graph */}
                <CompetitorGraph
                  competitors={persona.competitors ?? []}
                  competitiveWorldview={persona.competitiveWorldview}
                  accentColor={persona.accentColor}
                  personaName={persona.name}
                />

                {/* Skill Chain */}
                {persona.skillChain && persona.skillChain.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-[15px] font-semibold text-gray-800 mb-4" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                      How They Actually Built Their Skills
                    </h3>
                    <div className="space-y-2">
                      {persona.skillChain.map((entry) => (
                        <SkillChainCard key={entry.name} entry={entry} accentColor={persona.accentColor} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Failure Cases */}
                {persona.failureCases && persona.failureCases.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-[15px] font-semibold text-gray-800 mb-4" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                      Real Failures (What Actually Happened)
                    </h3>
                    <div className="space-y-4">
                      {persona.failureCases.map((fc, idx) => (
                        <div key={`${fc.year}-${idx}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-3 p-4 bg-red-50 border-b border-red-100">
                            <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-red-200 text-red-800" style={{ fontFamily: "Inter, sans-serif" }}>
                              {fc.year}
                            </span>
                            <p className="text-[13px] font-semibold text-red-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                              {fc.whatFailed}
                            </p>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                Why It Failed
                              </p>
                              <p className="text-[12.5px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                {fc.whyItFailed}
                              </p>
                            </div>
                            <div className="rounded-lg p-3 bg-green-50 border border-green-200">
                              <p className="text-[10.5px] font-bold text-green-700 uppercase tracking-wide mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                What They Learned
                              </p>
                              <p className="text-[12.5px] text-green-800 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                {fc.whatTheyLearned}
                              </p>
                            </div>
                            <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
                              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                Public Narrative
                              </p>
                              <p className="text-[12.5px] text-gray-700 leading-relaxed italic" style={{ fontFamily: "Inter, sans-serif" }}>
                                {fc.publicNarrative}
                              </p>
                            </div>
                            {fc.privateReality && (
                              <div className="rounded-lg p-3" style={{ background: `${persona.accentColor}08`, border: `1px solid ${persona.accentColor}20` }}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Quote size={11} style={{ color: persona.accentColor }} />
                                  <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: persona.accentColor, fontFamily: "Inter, sans-serif" }}>
                                    Private Reality
                                  </span>
                                </div>
                                <p className="text-[12.5px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                  {fc.privateReality}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
