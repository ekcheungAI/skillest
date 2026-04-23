import { useState } from "react";
import type { BoardMember, SeatRole } from "@/lib/boards";
import { SEAT_ROLE_CONFIG } from "@/lib/boards";
import type { Persona } from "@/lib/personas";
import { ROLE_COLORS } from "@/lib/board-design";
import { Info, ChevronDown } from "lucide-react";

interface SeatRolePickerProps {
  members: BoardMember[];
  personas: Persona[];
  onUpdate: (memberId: string, updates: Partial<BoardMember>) => void;
}

function RoleOption({
  role,
  isSelected,
  onClick,
}: {
  role: SeatRole;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = SEAT_ROLE_CONFIG[role];
  const color = ROLE_COLORS[role];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
        isSelected ? "border-gray-900 bg-gray-50 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      <div
        className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5"
        style={{ background: color, fontFamily: "Fraunces, Georgia, serif" }}
      >
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[12px] font-semibold ${isSelected ? "text-gray-900" : "text-gray-700"}`}
        >
          {config.label}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
          {config.description}
        </p>
      </div>
    </button>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function MemberRoleRow({
  member,
  persona,
  onUpdate,
}: {
  member: BoardMember;
  persona: Persona;
  onUpdate: (memberId: string, updates: Partial<BoardMember>) => void;
}) {
  const [open, setOpen] = useState(false);
  const allRoles: SeatRole[] = [
    "chair",
    "domain_specialist",
    "operator",
    "contrarian",
    "risk_reviewer",
  ];
  const color = persona.accentColor || "#6B7280";

  return (
    <div
      className="bg-white rounded-[14px] border border-gray-100 overflow-hidden"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {/* Member header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontFamily: "Fraunces, Georgia, serif" }}
        >
          {getInitials(persona.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900">
            {persona.name}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {persona.title}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{
              background: `${ROLE_COLORS[member.role]}15`,
              color: ROLE_COLORS[member.role],
            }}
          >
            {SEAT_ROLE_CONFIG[member.role].label}
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Role picker */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50">
          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider">
            Assign seat role
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allRoles.map((role) => (
              <RoleOption
                key={role}
                role={role}
                isSelected={member.role === role}
                onClick={() => onUpdate(member.id, { role })}
              />
            ))}
          </div>

          {/* Show persona boundaries as hints */}
          {persona.honestBoundaries && persona.honestBoundaries.length > 0 && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-[10px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                <Info size={10} />
                Honest Boundaries (consider before assigning)
              </p>
              <div className="space-y-1">
                {persona.honestBoundaries.slice(0, 2).map((b, i) => (
                  <p key={i} className="text-[10px] text-amber-700 leading-relaxed">
                    · {b.limitation}: {b.explanation}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SeatRolePicker({ members, personas, onUpdate }: SeatRolePickerProps) {
  const allRoles: SeatRole[] = [
    "chair",
    "domain_specialist",
    "operator",
    "contrarian",
    "risk_reviewer",
  ];

  const usedRoles = new Set(members.map((m) => m.role));

  return (
    <div className="space-y-5">
      {/* Role legend */}
      <div className="flex flex-wrap gap-3">
        {allRoles.map((role) => {
          const config = SEAT_ROLE_CONFIG[role];
          const color = ROLE_COLORS[role];
          const inUse = usedRoles.has(role);
          return (
            <div
              key={role}
              className="flex items-center gap-1.5 text-[11px]"
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[9px]"
                style={{ background: color, fontFamily: "Fraunces, Georgia, serif" }}
              >
                {config.icon}
              </div>
              <span className={inUse ? "text-gray-700 font-medium" : "text-gray-400"}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Per-member role assignment */}
      <div className="space-y-3">
        {members.map((member) => {
          const persona = personas.find((p) => p.id === member.personaId);
          if (!persona) return null;
          return (
            <MemberRoleRow
              key={member.id}
              member={member}
              persona={persona}
              onUpdate={onUpdate}
            />
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[12px] text-gray-400">
            Add members first, then assign their seat roles
          </p>
        </div>
      )}
    </div>
  );
}
