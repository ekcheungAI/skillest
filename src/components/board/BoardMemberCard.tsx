import type { Persona } from "@/lib/personas";
import type { BoardMember } from "@/lib/boards";
import { SEAT_ROLE_CONFIG } from "@/lib/boards";
import { ROLE_COLORS } from "@/lib/board-design";

interface BoardMemberCardProps {
  member: BoardMember;
  persona: Persona;
  onRemove?: () => void;
  compact?: boolean;
  confidenceNote?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function BoardMemberCard({
  member,
  persona,
  onRemove,
  compact = false,
  confidenceNote,
}: BoardMemberCardProps) {
  const color = persona.accentColor || "#6B7280";
  const roleColor = ROLE_COLORS[member.role];
  const roleConfig = SEAT_ROLE_CONFIG[member.role];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            border: `2px solid ${roleColor}`,
            fontFamily: "Fraunces, Georgia, serif",
          }}
        >
          {getInitials(persona.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-gray-900 truncate">
            {persona.name}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {roleConfig.label}
          </p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors text-[11px] font-bold"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-[14px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeft: `4px solid ${roleColor}` }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: "18px",
            }}
          >
            {getInitials(persona.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-gray-900">
              {persona.name}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
              {persona.title}
            </p>
            <span
              className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${roleColor}15`,
                color: roleColor,
              }}
            >
              {roleConfig.icon} {roleConfig.label}
            </span>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500 transition-colors text-[14px] font-bold"
            >
              ×
            </button>
          )}
        </div>

        {confidenceNote && (
          <p className="mt-2 text-[11px] text-gray-500 leading-relaxed italic">
            {confidenceNote}
          </p>
        )}

        {member.inclusionReason && (
          <p className="mt-2 text-[11px] text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-800">Why included:</span> {member.inclusionReason}
          </p>
        )}
      </div>
    </div>
  );
}
