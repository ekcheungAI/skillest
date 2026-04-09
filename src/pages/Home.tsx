// DESIGN: Premium Card Game Library — Card-Game Picker
// Background: warm cream #F7F6F2 | Cards: white with 4px colored left spine
// Typography: Fraunces (display) + Inter (body)
// Layout: sticky left sidebar (w-44) + 3-column card grid + bottom stack tray
// Cards: gradient cover bg (auto-generated from accent color) + DP avatar or initials fallback
// Hero: includes "How to Use" steps inline on the right side of the banner

import { useState, useMemo, useCallback } from "react";
import { Link } from "wouter";
import {
  Search, X, Layers, Copy, Brain,
  Globe, TrendingUp, Users, Zap, BookOpen,
  CheckCircle2, ArrowRight
} from "lucide-react";
import { personas, getRarity, getRarityKey, RARITY_CONFIG, type RarityKey, type PersonaCategory, type Persona } from "@/lib/personas";
import { toast } from "sonner";

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  "All":             { icon: "✦",  color: "#1A1A1A" },
  "Tech":            { icon: "⚡", color: "#0EA5E9" },
  "Business":        { icon: "📈", color: "#F59E0B" },
  "Entrepreneurship":{ icon: "🚀", color: "#8B5CF6" },
  "Finance":         { icon: "💰", color: "#10B981" },
  "Politics":        { icon: "🏛️", color: "#EF4444" },
  "Science":         { icon: "🔬", color: "#06B6D4" },
  "Film":            { icon: "🎬", color: "#EC4899" },
  "Investing":       { icon: "📊", color: "#84CC16" },
  "Trading":         { icon: "📉", color: "#E11D48" },
  "Crypto":          { icon: "₿",  color: "#F7931A" },
  "Marketing":       { icon: "📣", color: "#8B5CF6" },
  "Philosophy":      { icon: "🧠", color: "#A78BFA" },
  "Military":        { icon: "⚔️", color: "#6B7280" },
  // ─── Sports ──────────────────────────────────────────────────────
  "Basketball":       { icon: "🏀", color: "#F97316" },
  "Football":        { icon: "🏈", color: "#16A34A" },
  "Soccer":          { icon: "⚽", color: "#0EA5E9" },
  "Tennis":          { icon: "🎾", color: "#84CC16" },
  "Golf":            { icon: "⛳", color: "#10B981" },
  "Swimming":        { icon: "🏊", color: "#06B6D4" },
  "TrackAndField":    { icon: "🏃", color: "#EF4444" },
  "AutoRacing":      { icon: "🏎️", color: "#DC2626" },
  "Baseball":        { icon: "⚾", color: "#F59E0B" },
  "MMA":            { icon: "🥊", color: "#7C3AED" },
  "Boxing":          { icon: "🥊", color: "#EC4899" },
  "Gymnastics":      { icon: "🤸", color: "#EC4899" },
  "Hockey":          { icon: "🏒", color: "#3B82F6" },
};

const REGION_OPTIONS = [
  { label: "All Regions", flag: "🌍" },
  { label: "North America", flag: "🇺🇸" },
  { label: "East Asia", flag: "🇨🇳" },
  { label: "Europe", flag: "🇪🇺" },
  { label: "South Asia", flag: "🇮🇳" },
  { label: "Middle East", flag: "🇦🇪" },
];

const SORT_OPTIONS = [
  { value: "default",     label: "Featured" },
  { value: "name",        label: "Name A–Z" },
  { value: "freshness",   label: "Recently Updated" },
  { value: "connections", label: "Most Connected" },
];

// ─── Initials helper ─────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Cover background — driven by rarity tier color ─────────────────────────
function CoverBackground({ coverColor, shine, name }: { coverColor: string; shine: boolean; name: string }) {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const angle = 135 + (hash % 30); // subtle angle variation per persona

  const svgPattern = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>
    <circle cx='30' cy='30' r='20' fill='none' stroke='rgba(255,255,255,0.10)' stroke-width='1'/>
    <circle cx='0' cy='0' r='15' fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1'/>
    <circle cx='60' cy='60' r='15' fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1'/>
    <circle cx='60' cy='0' r='10' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/>
  </svg>`;
  const encodedSvg = `url("data:image/svg+xml,${encodeURIComponent(svgPattern)}")`;  

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `${encodedSvg}, linear-gradient(${angle}deg, ${coverColor}F0 0%, ${coverColor}BB 100%)`,
        }}
      />
      {/* Shine overlay for RR / RRR */}
      {shine && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 70%)`,
            }}
          />
          <div className="card-shine" />
        </>
      )}
    </>
  );
}

// ─── Avatar with DP + initials fallback ──────────────────────────────────────
function PersonaAvatar({
  persona,
  size = 72,
}: {
  persona: Persona;
  size?: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(persona.name);

  if (imgFailed || !persona.image) {
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold shadow-lg"
        style={{
          width: size,
          height: size,
          // White semi-transparent background so initials always contrast against any cover color
          background: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(6px)",
          border: "2px solid rgba(255,255,255,0.55)",
          color: "#FFFFFF",
          fontSize: size * 0.34,
          fontFamily: "Fraunces, Georgia, serif",
          flexShrink: 0,
          letterSpacing: "0.02em",
          textShadow: "0 1px 3px rgba(0,0,0,0.35)",
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={persona.image}
      alt={persona.name}
      className="rounded-full object-cover object-top border-2 border-white/60 shadow-md"
      style={{ width: size, height: size, flexShrink: 0 }}
      onError={() => setImgFailed(true)}
    />
  );
}

// ─── Persona Card ─────────────────────────────────────────────────────────────
function PersonaCard({
  persona,
  isSelected,
  onToggle,
  index,
}: {
  persona: Persona;
  isSelected: boolean;
  onToggle: (id: string) => void;
  index: number;
}) {
  const rarity = getRarity(persona);
  const archetype = persona.thinkingFrameworks[0]?.name ?? "Strategic Thinker";
  const topDims = persona.personalityDimensions.slice(0, 3);

  return (
    <div
      className="persona-card animate-card-in flex flex-col"
      style={{
        "--persona-accent": persona.accentColor,
        animationDelay: `${index * 50}ms`,
        outline: isSelected ? `2px solid ${persona.accentColor}` : "none",
        outlineOffset: "2px",
      } as React.CSSProperties}
    >
      {/* ── Cover area: rarity-driven color + centered DP ── */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 110 }}>
        <CoverBackground coverColor={rarity.coverColor} shine={rarity.shine} name={persona.name} />

        {/* Top badges */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
            style={{ background: rarity.badgeBg, color: rarity.badgeColor, fontFamily: "Inter, sans-serif" }}
          >
            {rarity.fullLabel}
          </span>
        </div>
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: persona.freshnessStatus === "LIVE" ? "#4ADE80" : persona.freshnessStatus === "RECENT" ? "#FCD34D" : "#9CA3AF" }}
          />
          <span className="text-[9px] font-semibold text-white/90" style={{ fontFamily: "Inter, sans-serif" }}>
            {persona.freshnessStatus}
          </span>
        </div>

        {/* Avatar fully inside cover, centered at bottom with padding */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center" style={{ zIndex: 10 }}>
          <PersonaAvatar persona={persona} size={60} />
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-col flex-1 px-4 pt-4 pb-4">
        {/* Name + title */}
        <div className="text-center mb-3">
          <h3 className="text-[15px] font-bold text-gray-900 leading-tight" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            {persona.name}{persona.nativeName && (
              <span className="text-[13px] font-normal text-gray-400 ml-1.5" style={{ fontFamily: "Inter, sans-serif" }}>{persona.nativeName}</span>
            )}
          </h3>
          <p className="text-[10.5px] text-gray-500 mt-0.5 line-clamp-1" style={{ fontFamily: "Inter, sans-serif" }}>
            {persona.title}
          </p>
        </div>

        {/* Archetype badge */}
        <div className="flex justify-center mb-3">
          <span className="archetype-badge" style={{ "--persona-accent": persona.accentColor } as React.CSSProperties}>
            <Brain size={9} />
            {archetype}
          </span>
        </div>

        {/* Short bio */}
        <p className="text-[11.5px] text-gray-600 leading-relaxed line-clamp-2 mb-3 text-center" style={{ fontFamily: "Inter, sans-serif" }}>
          {persona.shortBio}
        </p>

        {/* Top 3 personality stats */}
        <div className="space-y-1.5 mb-3">
          {topDims.map((d) => (
            <div key={d.label}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-medium text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>{d.label}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: persona.accentColor }}>{d.value}</span>
              </div>
              <div className="stat-bar-track">
                <div className="stat-bar-fill" style={{ width: `${d.value}%`, background: persona.accentColor }} />
              </div>
            </div>
          ))}
        </div>

        {/* Trait chips */}
        <div className="flex flex-wrap justify-center gap-1 mb-4">
          {persona.personalityTraits.slice(0, 2).map((trait) => (
            <span key={trait} className="text-[9.5px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
              {trait}
            </span>
          ))}
          <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
            🌍 {persona.nationality.split("(")[0].trim().split("-")[0].trim()}
          </span>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link href={`/persona/${persona.id}`} className="flex-1">
            <button
              className="w-full flex items-center justify-center gap-1.5 text-[11.5px] font-medium py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <BookOpen size={10} />
              View Profile
            </button>
          </Link>
          <button
            onClick={() => onToggle(persona.id)}
            className="flex items-center gap-1 text-[11.5px] font-semibold py-2 px-3 rounded-lg transition-all"
            style={{
              background: isSelected ? persona.accentColor : `${persona.accentColor}15`,
              color: isSelected ? "white" : persona.accentColor,
              border: `1px solid ${persona.accentColor}40`,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {isSelected ? <CheckCircle2 size={10} /> : <Layers size={10} />}
            {isSelected ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stack Tray ───────────────────────────────────────────────────────────────
function StackTray({
  selected,
  allPersonas,
  onRemove,
  onClear,
}: {
  selected: string[];
  allPersonas: Persona[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const selectedPersonas = allPersonas.filter((p) => selected.includes(p.id));

  const handleCopyStack = useCallback(() => {
    if (selectedPersonas.length === 0) return;

    if (selectedPersonas.length === 1) {
      navigator.clipboard.writeText(selectedPersonas[0].aiPersonaPrompt);
      toast.success(`${selectedPersonas[0].name}'s system prompt copied!`);
      return;
    }

    const combined = `You are a composite AI agent embodying the combined thinking styles and working methods of ${selectedPersonas.map((p) => p.name).join(", ")}.

═══════════════════════════════════════════════════════
COMPOSITE PERSONA STACK — ${selectedPersonas.length} PERSONAS
═══════════════════════════════════════════════════════

${selectedPersonas
  .map(
    (p, i) => `
━━━ PERSONA ${i + 1}: ${p.name.toUpperCase()} ━━━
${p.aiPersonaPrompt}
`
  )
  .join("\n")}

═══════════════════════════════════════════════════════
SYNTHESIS RULES
═══════════════════════════════════════════════════════
When responding, blend the above personas proportionally:
- Draw on each person's specific vocabulary patterns and speech rhythm
- Apply their decision-making frameworks in sequence (first filter through Persona 1's lens, then Persona 2's, etc.)
- When perspectives conflict, acknowledge the tension explicitly and synthesize a resolution that honors both
- Never break character — if asked who you are, describe yourself as a composite of these thinkers
- Prioritize the framework most relevant to the question type (technical → lean on the most technical persona; negotiation → lean on the most strategic)`;

    navigator.clipboard.writeText(combined);
    toast.success(`Composite stack prompt for ${selectedPersonas.length} personas copied!`);
  }, [selectedPersonas]);

  if (selected.length === 0) return null;

  return (
    <div className="stack-tray visible">
      <div className="max-w-screen-xl mx-auto px-5">
        {/* Mobile: collapsed strip (shown when not expanded) */}
        <div className="md:hidden">
          {!mobileExpanded ? (
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                  <Layers size={12} className="text-white" />
                </div>
                <span className="text-[12px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                  {selected.length} in stack
                </span>
                <span className="text-[10px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                  {selectedPersonas.map((p) => p.name.split(" ")[0]).join(" · ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyStack}
                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Copy size={10} />
                  Copy
                </button>
                <button
                  onClick={() => setMobileExpanded(true)}
                  className="text-[11px] text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Expand
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Expanded mobile content */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-gray-700" />
                  <span className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                    Agent Stack
                  </span>
                  <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {selected.length}
                  </span>
                </div>
                <button
                  onClick={() => setMobileExpanded(false)}
                  className="text-[11px] text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Collapse
                </button>
              </div>

              {/* Persona chips */}
              <div className="flex flex-wrap gap-2 py-3">
                {selectedPersonas.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full pl-0.5 pr-2.5 py-0.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border border-white"
                      style={{ background: `${p.accentColor}20`, color: p.accentColor }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <span className="text-[11px] font-medium text-gray-800">{p.name}</span>
                    <button onClick={() => onRemove(p.id)} className="text-gray-400 hover:text-gray-600 ml-0.5">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Expanded prompt preview */}
              <div className="pb-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-40 overflow-y-auto">
                  <p className="text-[10px] font-mono text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {selectedPersonas.length === 1
                      ? selectedPersonas[0].aiPersonaPrompt.slice(0, 500) + "..."
                      : `Composite stack: ${selectedPersonas.map((p) => p.name).join(" + ")} — ${selectedPersonas.length} thinking styles combined.`}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pb-3">
                <button onClick={onClear} className="flex-1 text-[11px] text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200" style={{ fontFamily: "Inter, sans-serif" }}>
                  Clear
                </button>
                <button
                  onClick={() => { handleCopyStack(); setMobileExpanded(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg bg-gray-900 text-white"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Copy size={11} />
                  Copy Prompt
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop: full tray */}
        <div className="hidden md:block">
          {/* Header row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-gray-700" />
                <span className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                  Agent Stack
                </span>
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {selected.length}
                </span>
              </div>
              {/* Avatar row */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {selectedPersonas.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full pl-0.5 pr-2.5 py-0.5 flex-shrink-0">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border border-white"
                      style={{ background: `${p.accentColor}20`, color: p.accentColor }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <span className="text-[11px] font-medium text-gray-800 whitespace-nowrap">{p.name}</span>
                    <button onClick={() => onRemove(p.id)} className="text-gray-400 hover:text-gray-600 ml-0.5">
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {selectedPersonas.length > 1 && (
                  <span className="text-[10.5px] text-gray-400 flex-shrink-0" style={{ fontFamily: "Inter, sans-serif" }}>
                    → Composite agent
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-gray-500 hidden lg:block" style={{ fontFamily: "Inter, sans-serif" }}>
                {selectedPersonas.length === 1 ? "Single persona prompt ready" : `${selectedPersonas.length} personas — composite prompt ready`}
              </span>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[11px] text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {expanded ? "Hide" : "Preview"}
              </button>
              <button
                onClick={onClear}
                className="text-[11px] text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Clear
              </button>
              <button
                onClick={handleCopyStack}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Copy size={11} />
                Copy Prompt
              </button>
            </div>
          </div>

          {/* Prompt preview */}
          {expanded && (
            <div className="pb-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-32 overflow-y-auto">
                <p className="text-[10px] font-mono text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedPersonas.length === 1
                    ? selectedPersonas[0].aiPersonaPrompt.slice(0, 500) + "..."
                    : `Composite stack: ${selectedPersonas.map((p) => p.name).join(" + ")} — ${selectedPersonas.length} thinking styles combined into a single system prompt.`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Home Page ───────────────────────────────────────────────────────────
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PersonaCategory | "All">("All");
  const [activeRegion, setActiveRegion] = useState("All Regions");
  const [activeRarity, setActiveRarity] = useState<RarityKey | null>(null);
  const [sortBy, setSortBy] = useState("default");
  const [selectedStack, setSelectedStack] = useState<string[]>([]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    personas.forEach((p) => p.categories.forEach((c) => cats.add(c)));
    return Array.from(cats);
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: personas.length };
    personas.forEach((p) => p.categories.forEach((c) => { counts[c] = (counts[c] ?? 0) + 1; }));
    return counts;
  }, []);

  const filteredPersonas = useMemo(() => {
    let result = [...personas];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nativeName ?? "").toLowerCase().includes(q) ||
          p.shortBio.toLowerCase().includes(q) ||
          p.categories.some((c) => c.toLowerCase().includes(q)) ||
          p.personalityTraits.some((t) => t.toLowerCase().includes(q)) ||
          p.thinkingFrameworks.some((f) => f.name.toLowerCase().includes(q))
      );
    }
    if (activeCategory !== "All") {
      result = result.filter((p) => p.categories.includes(activeCategory as PersonaCategory));
    }
    if (activeRegion !== "All Regions") {
      const regionMap: Record<string, string[]> = {
        "North America": ["American", "Canadian"],
        "East Asia": ["Chinese", "Hong Kong", "Japanese", "Korean", "Taiwanese"],
        "Europe": ["British", "German", "French", "Swedish"],
        "South Asia": ["Indian", "Pakistani"],
        "Middle East": ["Israeli", "Saudi"],
      };
      const nationalities = regionMap[activeRegion] ?? [];
      result = result.filter((p) => nationalities.some((n) => p.nationality.includes(n)));
    }
    if (activeRarity !== null) {
      result = result.filter((p) => getRarityKey(p) === activeRarity);
    }
    if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "freshness") result.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    else if (sortBy === "connections") result.sort((a, b) => b.relationships.length - a.relationships.length);
    return result;
  }, [searchQuery, activeCategory, activeRegion, activeRarity, sortBy]);

  const toggleStack = useCallback((id: string) => {
    setSelectedStack((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const hasFilters = activeCategory !== "All" || activeRegion !== "All Regions" || searchQuery !== "" || activeRarity !== null;

  return (
    <div className="min-h-screen" style={{ background: "#F7F6F2" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/95 border-b border-gray-200" style={{ backdropFilter: "blur(8px)", boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              Persona Library
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hidden sm:block">
              BETA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-gray-400 hidden md:block" style={{ fontFamily: "Inter, sans-serif" }}>
              {personas.length} personas · Free & open
            </span>
            <Link href="/match">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[11.5px] font-semibold hover:bg-amber-100 transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
                <Zap size={11} className="text-amber-500" />
                Find My Match
              </div>
            </Link>
            {selectedStack.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                <Layers size={12} />
                {selectedStack.length} in stack
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Banner — compact two-column ── */}
      <div className="border-b border-gray-200/60" style={{ background: "linear-gradient(135deg, #FAFAF8 0%, #F5F3EE 60%, #EEF0F5 100%)" }}>
        <div className="max-w-screen-xl mx-auto px-5 py-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center">

            {/* Left: headline */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-gray-600 text-[10px] font-semibold mb-2.5 border border-gray-200 bg-white/70" style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}>
                <Zap size={9} className="text-amber-500" />
                DEEP-RESEARCH AI PERSONA PROFILES
              </div>
              <h1 className="text-[26px] sm:text-[32px] font-bold text-gray-900 leading-[1.1] mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                Think Like the <em>World's Greatest</em> Minds
              </h1>
              <p className="text-[12.5px] text-gray-500 leading-relaxed mb-3 max-w-md" style={{ fontFamily: "Inter, sans-serif" }}>
                Deep-research profiles of iconic leaders — thinking frameworks, working style, and AI-ready system prompts. One click to install into any LLM agent.
              </p>
              <div className="flex flex-wrap gap-4 text-[11.5px]" style={{ fontFamily: "Inter, sans-serif" }}>
                {[
                  { icon: <Users size={11} />, value: `${personas.length}`, label: "Personas" },
                  { icon: <Brain size={11} />, value: "9+", label: "Sections each" },
                  { icon: <Zap size={11} />, value: "100%", label: "Prompt ready" },
                  { icon: <TrendingUp size={11} />, value: "Weekly", label: "Updates" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-1 text-gray-600">
                    <span className="text-gray-400">{stat.icon}</span>
                    <span className="font-semibold text-gray-800">{stat.value}</span>
                    <span className="text-gray-500">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: How to Use — compact horizontal steps */}
            <div className="w-full lg:w-auto flex-shrink-0">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                How to use
              </p>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                {[
                  { step: "01", title: "Browse & Learn",      desc: "Explore thinking frameworks & working style",     icon: <BookOpen size={11} />, color: "#0EA5E9" },
                  { step: "02", title: "Build Your Stack",    desc: "Add personas for a composite AI thinking style",  icon: <Layers size={11} />,   color: "#8B5CF6" },
                  { step: "03", title: "Install in Agent",    desc: "Copy prompt → paste into ChatGPT or Claude",     icon: <Copy size={11} />,     color: "#10B981" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors min-w-[240px]">
                    <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${item.color}15`, color: item.color }}>
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-mono font-bold text-gray-400">{item.step}</span>
                        <span className="text-[11.5px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{item.title}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
                {/* Persona Match CTA */}
                <Link href="/match">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors min-w-[240px] cursor-pointer">
                    <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-amber-500">
                      <Zap size={11} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-mono font-bold text-amber-500">NEW</span>
                        <span className="text-[11.5px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Find My Match</span>
                      </div>
                      <p className="text-[10px] text-amber-700 leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>Describe your style → get your ideal agent stack</p>
                    </div>
                    <ArrowRight size={11} className="text-amber-500 flex-shrink-0" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: sidebar + 3-col grid ── */}
      <div
        className="max-w-screen-xl mx-auto px-5 py-8 flex gap-7"
        style={{ paddingBottom: selectedStack.length > 0 ? "160px" : "48px" }}
      >
        {/* ── Left Sidebar ── */}
        <aside className="w-44 flex-shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-5">

            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[12px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-400"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1" style={{ fontFamily: "Inter, sans-serif" }}>Category</p>
              <div className="space-y-0.5">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as PersonaCategory | "All")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] transition-colors ${activeCategory === cat ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-[12px]">{CATEGORY_CONFIG[cat]?.icon ?? "•"}</span>
                      {cat}
                    </span>
                    <span className={`text-[10px] font-mono tabular-nums ${activeCategory === cat ? "text-gray-300" : "text-gray-400"}`}>
                      {categoryCounts[cat] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1" style={{ fontFamily: "Inter, sans-serif" }}>Region</p>
              <div className="space-y-0.5">
                {REGION_OPTIONS.map(({ label, flag }) => (
                  <button
                    key={label}
                    onClick={() => setActiveRegion(label)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11.5px] transition-colors ${activeRegion === label ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <span className="text-[12px]">{flag}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity Filter */}
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1" style={{ fontFamily: "Inter, sans-serif" }}>Rarity</p>
              <div className="space-y-0.5">
                {(Object.keys(RARITY_CONFIG) as RarityKey[]).map((rk) => {
                  const config = RARITY_CONFIG[rk];
                  const count = personas.filter((p) => getRarityKey(p) === rk).length;
                  return (
                    <button
                      key={rk}
                      onClick={() => setActiveRarity(activeRarity === rk ? null : rk)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] transition-colors ${activeRarity === rk ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ background: config.coverColor }}
                        />
                        <span>{config.fullLabel}</span>
                      </span>
                      <span className={`text-[10px] font-mono tabular-nums ${activeRarity === rk ? "text-gray-300" : "text-gray-400"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1" style={{ fontFamily: "Inter, sans-serif" }}>Sort by</p>
              <div className="space-y-0.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11.5px] transition-colors ${sortBy === opt.value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={() => { setActiveCategory("All"); setActiveRegion("All Regions"); setSearchQuery(""); setActiveRarity(null); }}
                className="w-full text-[10.5px] text-gray-500 hover:text-gray-700 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <X size={10} /> Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* ── Card Grid ── */}
        <div className="flex-1 min-w-0">

          {/* Mobile search + filter pills */}
          <div className="lg:hidden mb-4 space-y-3">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            {/* Category pills — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as PersonaCategory | "All")}
                  className={`flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors ${activeCategory === cat ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {CATEGORY_CONFIG[cat]?.icon} {cat}
                </button>
              ))}
            </div>

            {/* Rarity pills — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(Object.keys(RARITY_CONFIG) as RarityKey[]).map((rk) => {
                const config = RARITY_CONFIG[rk];
                return (
                  <button
                    key={rk}
                    onClick={() => setActiveRarity(activeRarity === rk ? null : rk)}
                    className={`flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors ${activeRarity === rk ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"}`}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      background: activeRarity === rk ? config.coverColor : undefined,
                    }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-sm mr-1"
                      style={{ background: activeRarity === rk ? "rgba(255,255,255,0.8)" : config.coverColor }}
                    />
                    {config.fullLabel}
                  </button>
                );
              })}
            </div>

            {/* Region pills — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {REGION_OPTIONS.map(({ label, flag }) => (
                <button
                  key={label}
                  onClick={() => setActiveRegion(label)}
                  className={`flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors ${activeRegion === label ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {flag} {label.replace(" Regions", "")}
                </button>
              ))}
            </div>
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                {activeCategory === "All" ? "All Personas" : activeCategory}
              </h2>
              <p className="text-[11.5px] text-gray-500 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                {filteredPersonas.length} {filteredPersonas.length === 1 ? "persona" : "personas"}
                {selectedStack.length > 0 && ` · ${selectedStack.length} in stack`}
              </p>
            </div>
            {selectedStack.length > 0 && (
              <button
                onClick={() => setSelectedStack([])}
                className="text-[11px] text-gray-500 hover:text-gray-700 flex items-center gap-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <X size={10} /> Clear stack
              </button>
            )}
            {(activeRarity !== null || activeRegion !== "All Regions" || hasFilters) && (
              <button
                onClick={() => { setActiveRarity(null); setActiveRegion("All Regions"); setActiveCategory("All"); setSearchQuery(""); }}
                className="text-[11px] text-gray-500 hover:text-gray-700 flex items-center gap-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <X size={10} /> Clear filters
              </button>
            )}
          </div>

          {/* 3-column grid */}
          {filteredPersonas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPersonas.map((persona, i) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isSelected={selectedStack.includes(persona.id)}
                  onToggle={toggleStack}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search size={20} className="text-gray-400" />
              </div>
              <p className="text-[15px] font-medium text-gray-700 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>No personas found</p>
              <p className="text-[13px] text-gray-500 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>Try adjusting your search or filters</p>
              <button
                onClick={() => { setActiveCategory("All"); setActiveRegion("All Regions"); setSearchQuery(""); }}
                className="text-[12px] text-gray-600 hover:text-gray-900 underline"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stack Tray ── */}
      <StackTray
        selected={selectedStack}
        allPersonas={personas}
        onRemove={(id) => setSelectedStack((prev) => prev.filter((x) => x !== id))}
        onClear={() => setSelectedStack([])}
      />
    </div>
  );
}
