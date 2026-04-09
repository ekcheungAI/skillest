// MentalModelCard — shows an internal monologue reconstruction as a thought process flow
// Displays: trigger → internal monologue → output, with confidence badge

import { useState } from "react";
import { Brain, ChevronDown, MessageSquare, Zap, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import type { MentalModel } from "@/lib/personas";

const CONFIDENCE_CONFIG = {
  "Firmly Held": { icon: ShieldCheck, color: "#15803D", bg: "#DCFCE7" },
  "Pragmatic":   { icon: Shield,      color: "#B45309", bg: "#FEF3C7" },
  "Occasionally Questioned": { icon: ShieldAlert, color: "#991B1B", bg: "#FEE2E2" },
} as const;

interface Props {
  model: MentalModel;
  accentColor: string;
}

export function MentalModelCard({ model, accentColor }: Props) {
  const [open, setOpen] = useState(false);
  const cfg = CONFIDENCE_CONFIG[model.confidence];
  const ConfidenceIcon = cfg.icon;

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
            <Brain size={15} style={{ color: accentColor }} />
          </div>
          <div>
            <span
              className="text-[14px] font-semibold text-gray-900 block"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              {model.name}
            </span>
            <span
              className="text-[11px] text-gray-400 mt-0.5 block"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {model.origin}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color, fontFamily: "Inter, sans-serif" }}
          >
            <ConfidenceIcon size={10} />
            {model.confidence}
          </span>
          <ChevronDown
            size={15}
            className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: `${accentColor}20` }}>

          {/* Trigger */}
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={11} style={{ color: accentColor }} />
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: accentColor, fontFamily: "Inter, sans-serif" }}
              >
                Trigger
              </span>
            </div>
            <p
              className="text-[12.5px] text-gray-600 italic leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              When: {model.trigger}
            </p>
          </div>

          {/* Internal Monologue — the crown jewel */}
          <div
            className="rounded-lg p-3.5"
            style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare size={11} style={{ color: accentColor }} />
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: accentColor, fontFamily: "Inter, sans-serif" }}
              >
                Internal Monologue
              </span>
            </div>
            <p
              className="text-[12.5px] text-gray-800 leading-relaxed italic"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              "{model.internalMonologue}"
            </p>
          </div>

          {/* Output */}
          <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={11} className="text-amber-500" />
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Resulting Behavior
              </span>
            </div>
            <p
              className="text-[12.5px] text-gray-600 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {model.output}
            </p>
          </div>

          {/* Confidence badge mobile */}
          <div className="sm:hidden">
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color, fontFamily: "Inter, sans-serif" }}
            >
              <ConfidenceIcon size={10} />
              {model.confidence}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
