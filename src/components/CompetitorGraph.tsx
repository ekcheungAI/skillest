// CompetitorGraph — shows a competitive intelligence panel
// Displays: competitor cards with relationship type, competitive dynamic, and private quote

import { useState } from "react";
import {
  Swords, TrendingUp, Target, Shield, Quote, ChevronDown,
  Star, AlertTriangle, CheckCircle2, XCircle, ArrowRightLeft
} from "lucide-react";
import type { CompetitorProfile, CompetitiveWorldview } from "@/lib/personas";

const RELATIONSHIP_STYLES = {
  "Primary Rival":  { bg: "#FEE2E2", color: "#DC2626", icon: Swords },
  "Aspirational":   { bg: "#EDE9FE", color: "#7C3AED", icon: TrendingUp },
  "Former Partner":  { bg: "#FEF3C7", color: "#B45309", icon: ArrowRightLeft },
  "Acquired":        { bg: "#DCFCE7", color: "#15803D", icon: CheckCircle2 },
  "Cooperative":    { bg: "#DBEAFE", color: "#1D4ED8", icon: Target },
} as const;

const STATUS_STYLES = {
  Active:     { bg: "#DCFCE7", color: "#15803D" },
  Historical: { bg: "#F3F4F6", color: "#6B7280" },
  Acquired:   { bg: "#DCFCE7", color: "#15803D" },
} as const;

const THREAT_STYLES = {
  "Existential": { bg: "#FEE2E2", color: "#991B1B" },
  "High":        { bg: "#FEE2E2", color: "#DC2626" },
  "Medium":      { bg: "#FEF3C7", color: "#B45309" },
  "Low":         { bg: "#F3F4F6", color: "#6B7280" },
} as const;

interface CompetitorCardProps {
  competitor: CompetitorProfile;
  accentColor: string;
}

function CompetitorCard({ competitor, accentColor }: CompetitorCardProps) {
  const [open, setOpen] = useState(false);
  const style = RELATIONSHIP_STYLES[competitor.relationship] ?? RELATIONSHIP_STYLES["Primary Rival"];
  const statusStyle = STATUS_STYLES[competitor.status] ?? STATUS_STYLES["Active"];
  const Icon = style.icon;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${style.color}15` }}
          >
            <Icon size={13} style={{ color: style.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              {competitor.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: style.bg, color: style.color, fontFamily: "Inter, sans-serif" }}
              >
                {competitor.relationship}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: statusStyle.bg, color: statusStyle.color, fontFamily: "Inter, sans-serif" }}
              >
                {competitor.status}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""} flex-shrink-0`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <p className="text-[12px] text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
            <span className="font-semibold text-gray-700">Market: </span>{competitor.marketPosition}
          </p>

          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
              How They Compete
            </p>
            <p className="text-[12.5px] text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              {competitor.competitiveDynamic}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
              Musk's Response
            </p>
            <p className="text-[12.5px] text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              {competitor.tacticalResponse}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 size={10} className="text-green-600" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-green-700" style={{ fontFamily: "Inter, sans-serif" }}>
                  Wins
                </span>
              </div>
              <p className="text-[11.5px] text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                {competitor.whatTheyDoBetter}
              </p>
            </div>
            <div className="rounded-lg p-3 bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle size={10} className="text-amber-600" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700" style={{ fontFamily: "Inter, sans-serif" }}>
                  Vulnerable
                </span>
              </div>
              <p className="text-[11.5px] text-amber-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                {competitor.whatTheyDoWorse}
              </p>
            </div>
          </div>

          {competitor.privateQuote && (
            <div
              className="rounded-lg p-3"
              style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Quote size={11} style={{ color: accentColor }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: accentColor, fontFamily: "Inter, sans-serif" }}
                >
                  Private Quote
                </span>
              </div>
              <p
                className="text-[12px] text-gray-700 italic leading-relaxed"
                style={{ fontFamily: "Fraunces, Georgia, serif" }}
              >
                "{competitor.privateQuote}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  competitors: CompetitorProfile[];
  competitiveWorldview?: CompetitiveWorldview;
  accentColor: string;
  personaName: string;
}

export function CompetitorGraph({ competitors, competitiveWorldview, accentColor, personaName }: Props) {
  const [activeSection, setActiveSection] = useState<"competitors" | "worldview">("competitors");

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {[
          { id: "competitors" as const, label: `Competitors (${competitors.length})` },
          { id: "worldview" as const, label: "Strategic View" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all`}
            style={{
              background: activeSection === tab.id ? accentColor : "white",
              borderColor: activeSection === tab.id ? accentColor : "#E5E7EB",
              color: activeSection === tab.id ? "white" : "#6B7280",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === "competitors" && (
        <div className="space-y-3">
          {competitors.length > 0 ? (
            competitors.map((comp) => (
              <CompetitorCard key={comp.name} competitor={comp} accentColor={accentColor} />
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <Swords size={22} className="text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                No competitor data mapped yet
              </p>
            </div>
          )}
        </div>
      )}

      {activeSection === "worldview" && competitiveWorldview && (
        <div className="space-y-5">
          {/* Market Frame */}
          {competitiveWorldview.marketFrame && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                How They See the Market
              </p>
              <p className="text-[13px] text-gray-700 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                {competitiveWorldview.marketFrame}
              </p>
            </div>
          )}

          {/* Threat Ranking */}
          {competitiveWorldview.threatRanking && competitiveWorldview.threatRanking.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                Threat Ranking
              </p>
              <div className="space-y-2">
                {competitiveWorldview.threatRanking.map((threat) => {
                  const ts = THREAT_STYLES[threat.threatLevel];
                  return (
                    <div key={threat.name} className="flex items-start gap-3">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                        style={{ background: ts.bg, color: ts.color, fontFamily: "Inter, sans-serif" }}
                      >
                        {threat.threatLevel}
                      </span>
                      <div>
                        <p className="text-[12.5px] font-semibold text-gray-800" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                          {threat.name}
                        </p>
                        <p className="text-[11.5px] text-gray-500 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                          {threat.reason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strategic Fears */}
          {competitiveWorldview.strategicFears && competitiveWorldview.strategicFears.length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={13} className="text-red-600" />
                <p className="text-[11px] font-bold text-red-700 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                  Strategic Fears
                </p>
              </div>
              <ul className="space-y-1.5">
                {competitiveWorldview.strategicFears.map((fear) => (
                  <li key={fear} className="flex items-start gap-2 text-[12.5px] text-red-800" style={{ fontFamily: "Inter, sans-serif" }}>
                    <span className="text-red-400 mt-0.5">—</span>
                    {fear}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strategic Confidence */}
          {competitiveWorldview.strategicConfidence && competitiveWorldview.strategicConfidence.length > 0 && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={13} className="text-green-600" />
                <p className="text-[11px] font-bold text-green-700 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                  Core Beliefs (What They Trust)
                </p>
              </div>
              <ul className="space-y-1.5">
                {competitiveWorldview.strategicConfidence.map((conf) => (
                  <li key={conf} className="flex items-start gap-2 text-[12.5px] text-green-800" style={{ fontFamily: "Inter, sans-serif" }}>
                    <span className="text-green-400 mt-0.5">+</span>
                    {conf}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contrarian Beliefs */}
          {competitiveWorldview.contrarianBeliefs && competitiveWorldview.contrarianBeliefs.length > 0 && (
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={13} className="text-purple-600" />
                <p className="text-[11px] font-bold text-purple-700 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                  Contrarian Beliefs
                </p>
              </div>
              <ul className="space-y-1.5">
                {competitiveWorldview.contrarianBeliefs.map((belief) => (
                  <li key={belief} className="flex items-start gap-2 text-[12.5px] text-purple-800" style={{ fontFamily: "Inter, sans-serif" }}>
                    <span className="text-purple-400 mt-0.5">~</span>
                    {belief}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeSection === "worldview" && !competitiveWorldview && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <Shield size={22} className="text-gray-300 mx-auto mb-2" />
          <p className="text-[13px] text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
            No strategic worldview data yet
          </p>
        </div>
      )}
    </div>
  );
}
