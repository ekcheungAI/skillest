// SkillChainCard — shows the authentic backstory of a skill
// Displays: origin story, real usage, failure case, related blind spot

import { useState } from "react";
import { ChevronDown, Lightbulb, AlertTriangle, Wrench, RotateCcw } from "lucide-react";
import type { SkillChainEntry } from "@/lib/personas";

interface Props {
  entry: SkillChainEntry;
  accentColor: string;
}

export function SkillChainCard({ entry, accentColor }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        background: open ? `${accentColor}04` : "white",
        borderColor: open ? `${accentColor}30` : "#E5E7EB",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}15` }}
          >
            <Wrench size={14} style={{ color: accentColor }} />
          </div>
          <span
            className="text-[14px] font-semibold text-gray-900"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            {entry.name}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: `${accentColor}20` }}>

          {/* Origin Story */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 mt-3">
              <Lightbulb size={11} style={{ color: accentColor }} />
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: accentColor, fontFamily: "Inter, sans-serif" }}
              >
                Origin Story
              </span>
            </div>
            <p
              className="text-[12.5px] text-gray-700 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {entry.originStory}
            </p>
          </div>

          {/* How They Actually Use It */}
          <div
            className="rounded-lg p-3"
            style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Wrench size={11} style={{ color: accentColor }} />
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: accentColor, fontFamily: "Inter, sans-serif" }}
              >
                Real-World Usage
              </span>
            </div>
            <p
              className="text-[12.5px] text-gray-700 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {entry.howTheyActuallyUseIt}
            </p>
          </div>

          {/* When They Fail */}
          <div className="rounded-lg p-3 bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-1.5 mb-1.5">
              <RotateCcw size={11} className="text-amber-600" />
              <span
                className="text-[10.5px] font-bold uppercase tracking-wide text-amber-700"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                When This Skill Fails
              </span>
            </div>
            <p
              className="text-[12.5px] text-amber-800 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {entry.whenTheyFail}
            </p>
          </div>

          {/* Related Blind Spot */}
          <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={11} className="text-orange-600" />
              <span
                className="text-[10.5px] font-bold uppercase tracking-wide text-orange-700"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Related Blind Spot
              </span>
            </div>
            <p
              className="text-[12.5px] text-gray-700 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {entry.relatedBlindSpot}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
