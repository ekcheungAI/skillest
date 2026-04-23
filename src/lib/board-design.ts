/* ─────────────────────────────────────────────────────────────────────────────
   Board Design System — Shared Constants
   ───────────────────────────────────────────────────────────────────────────── */

import type { SeatRole } from "@/lib/boards";

/* Role accent colors — used on role badges, top borders, and role indicators */
export const ROLE_COLORS: Record<SeatRole, string> = {
  chair: "#1A1A1A",
  domain_specialist: "#0EA5E9",
  operator: "#10B981",
  contrarian: "#EF4444",
  risk_reviewer: "#8B5CF6",
};

/* Category accent colors — used on category badges throughout board UI */
export const CATEGORY_COLORS: Record<string, string> = {
  Tech: "#0EA5E9",
  Business: "#F59E0B",
  Entrepreneurship: "#8B5CF6",
  Finance: "#10B981",
  Politics: "#EF4444",
  Science: "#06B6D4",
  Film: "#EC4899",
  Investing: "#84CC16",
  Trading: "#E11D48",
  Crypto: "#F7931A",
  Marketing: "#8B5CF6",
  Philosophy: "#A78BFA",
  Military: "#6B7280",
  Basketball: "#F97316",
  Football: "#16A34A",
  Soccer: "#0EA5E9",
  Tennis: "#84CC16",
  Golf: "#10B981",
  Swimming: "#06B6D4",
  TrackAndField: "#EF4444",
  AutoRacing: "#DC2626",
  Baseball: "#F59E0B",
  MMA: "#7C3AED",
  Boxing: "#EC4899",
  Gymnastics: "#EC4899",
  Hockey: "#3B82F6",
};
