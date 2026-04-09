// PersonaCard — Light Card-Game Design (matches Home.tsx inline PersonaCard)
// Used in PersonaMatch results

import { useState } from "react";
import { type Persona, getRarity, getRarityKey, type RarityKey } from "@/lib/personas";
import { Copy, Check, Layers, Brain, ArrowRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

interface PersonaCardProps {
  persona: Persona;
  index: number;
  onToggle?: (id: string) => void;
  isSelected?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRarityFull(rarityKey: RarityKey) {
  const map: Record<RarityKey, { label: string; coverColor: string; badgeColor: string; badgeBg: string; shine: boolean }> = {
    C:   { label: "Common",       coverColor: "#6B7280", badgeColor: "#6B7280", badgeBg: "rgba(107,114,128,0.12)", shine: false },
    CC:  { label: "Uncommon",     coverColor: "#2563EB", badgeColor: "#2563EB", badgeBg: "rgba(37,99,235,0.12)", shine: false },
    R:   { label: "Rare",        coverColor: "#7C3AED", badgeColor: "#7C3AED", badgeBg: "rgba(124,58,237,0.12)", shine: false },
    RR:  { label: "Double Rare", coverColor: "#B45309", badgeColor: "#B45309", badgeBg: "rgba(180,83,9,0.12)", shine: true },
    RRR: { label: "Ultra Rare",  coverColor: "#991B1B", badgeColor: "#991B1B", badgeBg: "rgba(153,27,27,0.12)", shine: true },
  };
  return map[rarityKey] ?? map["C"];
}

export default function PersonaCard({ persona, index, onToggle, isSelected = false }: PersonaCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const rarityKey = getRarityKey(persona);
  const rarity = getRarityFull(rarityKey);
  const archetype = persona.thinkingFrameworks[0]?.name ?? "Strategic Thinker";
  const topDims = persona.personalityDimensions.slice(0, 3);
  const initials = getInitials(persona.name);

  const hash = persona.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const angle = 135 + (hash % 30);
  const svgPattern = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>
    <circle cx='30' cy='30' r='20' fill='none' stroke='rgba(255,255,255,0.10)' stroke-width='1'/>
    <circle cx='0' cy='0' r='15' fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1'/>
    <circle cx='60' cy='60' r='15' fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1'/>
    <circle cx='60' cy='0' r='10' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/>
  </svg>`;
  const encodedSvg = `url("data:image/svg+xml,${encodeURIComponent(svgPattern)}")`;

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(persona.aiPersonaPrompt);
      setCopied(true);
      toast.success(`${persona.name} persona prompt copied!`, {
        description: "Paste this into your LLM system prompt to activate the persona.",
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please try again.");
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle?.(persona.id);
  };

  const animationDelay = `${index * 80}ms`;

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{
        background: "white",
        border: isSelected
          ? `2px solid ${persona.accentColor}`
          : "1px solid rgba(0,0,0,0.08)",
        boxShadow: isSelected ? `0 0 0 3px ${persona.accentColor}20` : "0 1px 4px rgba(0,0,0,0.06)",
        animationDelay,
        opacity: 0,
        animation: `fadeInUp 0.5s ease-out ${animationDelay} forwards`,
      }}
    >
      {/* ── Cover area: rarity-driven color ── */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 110 }}>
        {/* SVG pattern + gradient cover */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `${encodedSvg}, linear-gradient(${angle}deg, ${rarity.coverColor}F0 0%, ${rarity.coverColor}BB 100%)`,
          }}
        />
        {/* RR/RRR shimmer */}
        {rarity.shine && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 70%)",
            }}
          />
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
            style={{ background: rarity.badgeBg, color: rarity.badgeColor, fontFamily: "Inter, sans-serif" }}
          >
            {rarity.label}
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

        {/* Avatar centered at bottom */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center" style={{ zIndex: 10 }}>
          <div
            className="rounded-full flex items-center justify-center font-bold shadow-lg"
            style={{
              width: 60,
              height: 60,
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(6px)",
              border: "2px solid rgba(255,255,255,0.55)",
              color: "#FFFFFF",
              fontSize: 20,
              fontFamily: "Fraunces, Georgia, serif",
              flexShrink: 0,
              letterSpacing: "0.02em",
              textShadow: "0 1px 3px rgba(0,0,0,0.35)",
            }}
          >
            {imgFailed || !persona.image ? initials : (
              <img
                src={persona.image}
                alt={persona.name}
                className="rounded-full object-cover object-top"
                style={{ width: 56, height: 56 }}
                onError={() => setImgFailed(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-col flex-1 px-4 pt-4 pb-4">
        {/* Name + title */}
        <div className="text-center mb-3">
          <h3 className="text-[15px] font-bold text-gray-900 leading-tight" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            {persona.name}{persona.nativeName && (
              <span className="text-[13px] font-normal text-gray-400 ml-1.5" style={{ fontFamily: "Inter, sans-serif" }}>
                {persona.nativeName}
              </span>
            )}
          </h3>
          <p className="text-[10.5px] text-gray-500 mt-0.5 line-clamp-1" style={{ fontFamily: "Inter, sans-serif" }}>
            {persona.title}
          </p>
        </div>

        {/* Archetype badge */}
        <div className="flex justify-center mb-3">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: `${persona.accentColor}15`,
              border: `1px solid ${persona.accentColor}30`,
              color: persona.accentColor,
              fontFamily: "Inter, sans-serif",
            }}
          >
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
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${d.value}%`,
                    background: persona.accentColor,
                  }}
                />
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

        {/* Spacer */}
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
          {onToggle && (
            <button
              onClick={handleToggle}
              className="flex items-center gap-1 text-[11.5px] font-semibold py-2 px-3 rounded-lg transition-all"
              style={{
                background: isSelected ? persona.accentColor : `${persona.accentColor}15`,
                color: isSelected ? "white" : persona.accentColor,
                border: `1px solid ${persona.accentColor}40`,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {isSelected ? <Check size={10} /> : <Layers size={10} />}
              {isSelected ? "Added" : "Add"}
            </button>
          )}
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1 text-[11.5px] font-semibold py-2 px-3 rounded-lg transition-all active:scale-95"
            style={{
              background: copied ? "#10B981" : persona.accentColor,
              color: "white",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
