// RelationshipGraph — Visual relationship map between personas
// Shows allies, rivals, mentors, and partners

import { personas, getPersonaById, type Relationship } from "@/lib/personas";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "wouter";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  Ally:    "#10B981",
  Rival:   "#EF4444",
  Mentor:  "#8B5CF6",
  Mentee:  "#8B5CF6",
  Partner: "#0EA5E9",
  Critic:  "#F97316",
};

interface RelationshipGraphProps {
  currentPersonaId: string;
  accentColor: string;
}

export default function RelationshipGraph({ currentPersonaId, accentColor }: RelationshipGraphProps) {
  const currentPersona = getPersonaById(currentPersonaId);
  if (!currentPersona || currentPersona.relationships.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "oklch(0.45 0.01 240)" }}>
        <Users size={24} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm font-mono">No relationships indexed yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {currentPersona.relationships.map((rel) => {
        const related = getPersonaById(rel.personaId);
        if (!related) return null;
        const relColor = RELATIONSHIP_COLORS[rel.type] || accentColor;

        return (
          <div
            key={rel.personaId}
            className="rounded-xl overflow-hidden"
            style={{ background: "oklch(0.15 0.012 240)", border: "1px solid oklch(1 0 0 / 8%)" }}
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Portrait */}
                <div
                  className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ border: `2px solid ${relColor}44`, background: `${relColor}10` }}
                >
                  {related.image ? (
                    <img
                      src={related.image}
                      alt={related.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{ color: relColor, fontFamily: "Fraunces, serif", fontSize: "1rem" }}
                    >
                      {getInitials(related.name)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: "oklch(0.88 0.005 240)" }}>{related.name}</span>
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{ background: `${relColor}20`, border: `1px solid ${relColor}40`, color: relColor }}
                    >
                      {rel.type}
                    </span>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "oklch(1 0 0 / 5%)", color: "oklch(0.45 0.01 240)", border: "1px solid oklch(1 0 0 / 8%)" }}
                    >
                      {rel.status}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: "oklch(0.60 0.008 240)" }}>
                    {rel.description}
                  </p>
                  <div className="flex items-center gap-4">
                    {/* Strength bar */}
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-mono" style={{ color: "oklch(0.45 0.01 240)" }}>Bond</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(1 0 0 / 8%)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${rel.strength}%`,
                            background: `linear-gradient(90deg, ${relColor}66, ${relColor})`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: relColor }}>{rel.strength}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: "oklch(0.45 0.01 240)" }}>Since {rel.since}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* View persona link */}
            <Link href={`/persona/${related.id}`}>
              <div
                className="flex items-center justify-between px-4 py-2 cursor-pointer transition-colors"
                style={{ borderTop: "1px solid oklch(1 0 0 / 6%)", background: "oklch(1 0 0 / 2%)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = `${relColor}08`)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "oklch(1 0 0 / 2%)")}
              >
                <span className="text-xs font-mono" style={{ color: "oklch(0.45 0.01 240)" }}>
                  View {related.name}'s full profile
                </span>
                <ArrowRight size={12} style={{ color: relColor }} />
              </div>
            </Link>
          </div>
        );
      })}

      {/* All personas mini-map */}
      <div
        className="p-4 rounded-xl mt-4"
        style={{ background: "oklch(0.14 0.01 240)", border: "1px solid oklch(1 0 0 / 6%)" }}
      >
        <div className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.45 0.01 240)" }}>
          All Personas in Library
        </div>
        <div className="flex flex-wrap gap-2">
          {personas.map((p) => (
            <Link key={p.id} href={`/persona/${p.id}`}>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: p.id === currentPersonaId ? `${p.accentColor}20` : "oklch(1 0 0 / 5%)",
                  border: `1px solid ${p.id === currentPersonaId ? p.accentColor + "40" : "oklch(1 0 0 / 8%)"}`,
                }}
                onMouseEnter={(e) => { if (p.id !== currentPersonaId) (e.currentTarget as HTMLElement).style.background = `${p.accentColor}10`; }}
                onMouseLeave={(e) => { if (p.id !== currentPersonaId) (e.currentTarget as HTMLElement).style.background = "oklch(1 0 0 / 5%)"; }}
              >
                <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: `${p.accentColor}20` }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <span className="text-xs font-bold" style={{ color: p.accentColor }}>
                      {getInitials(p.name)}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold" style={{ color: p.id === currentPersonaId ? p.accentColor : "oklch(0.65 0.008 240)" }}>
                  {p.name.split(" ")[0]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
