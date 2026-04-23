import { useState, useMemo } from "react";
import { Search, Plus, X, Info, Sparkles, ChevronDown } from "lucide-react";
import type { Persona, PersonaCategory } from "@/lib/personas";
import type { BoardMember } from "@/lib/boards";
import { CATEGORY_COLORS } from "@/lib/board-design";

interface BoardAssemblyProps {
  allPersonas: Persona[];
  selectedMembers: BoardMember[];
  onAdd: (personaId: string) => void;
  onRemove: (memberId: string) => void;
  suggestedIds?: string[];
  compact?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PersonaChip({
  member,
  persona,
  onRemove,
  showRole = false,
}: {
  member: BoardMember;
  persona: Persona;
  onRemove: () => void;
  showRole?: boolean;
}) {
  const color = persona.accentColor || "#6B7280";
  return (
    <div
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-[14px] px-3 py-2 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          fontFamily: "Fraunces, Georgia, serif",
        }}
      >
        {getInitials(persona.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-gray-900 truncate">
          {persona.name}
        </p>
        {showRole && (
          <p className="text-[10px] text-gray-400 truncate">
            {member.role.replace("_", " ")}
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function PersonaSuggestionCard({
  persona,
  onAdd,
  isSuggested,
  isSelected,
  compact,
}: {
  persona: Persona;
  onAdd: () => void;
  isSuggested: boolean;
  isSelected: boolean;
  compact?: boolean;
}) {
  const color = persona.accentColor || "#6B7280";
  const [imgFailed, setImgFailed] = useState(false);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontFamily: "Fraunces, Georgia, serif" }}
        >
          {getInitials(persona.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-gray-900 truncate">
            {persona.name}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {persona.title}
          </p>
        </div>
        <button
          onClick={onAdd}
          disabled={isSelected}
          className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold transition-all ${
            isSelected
              ? "bg-green-100 text-green-600"
              : isSuggested
              ? "bg-gray-900 text-white hover:bg-gray-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {isSelected ? "✓" : "+"}
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-[14px] border border-gray-100 p-3 hover:border-gray-200 hover:shadow-md transition-all"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start gap-2.5">
        {persona.image && !imgFailed ? (
          <img
            src={persona.image}
            alt={persona.name}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontFamily: "Fraunces, Georgia, serif" }}
          >
            {getInitials(persona.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">
                {persona.name}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {persona.title}
              </p>
            </div>
            <button
              onClick={onAdd}
              disabled={isSelected}
              className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold transition-all ${
                isSelected
                  ? "bg-green-100 text-green-600"
                  : isSuggested
                  ? "bg-gray-900 text-white hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {isSelected ? "✓" : "+"}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            {persona.shortBio}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {persona.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: `${CATEGORY_COLORS[cat] ?? "#6B7280"}15`,
                  color: CATEGORY_COLORS[cat] ?? "#6B7280",
                }}
              >
                {cat}
              </span>
            ))}
            {isSuggested && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                <Sparkles size={8} className="inline mr-0.5" />
                Suggested
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BoardAssembly({
  allPersonas,
  selectedMembers,
  onAdd,
  onRemove,
  suggestedIds = [],
  compact = false,
}: BoardAssemblyProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PersonaCategory | "All">("All");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const selectedIds = new Set(selectedMembers.map((m) => m.personaId));
  const selectedMap = new Map(selectedMembers.map((m) => [m.personaId, m]));

  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    allPersonas.forEach((p) => p.categories.forEach((c) => cats.add(c)));
    return Array.from(cats);
  }, [allPersonas]);

  const filteredPersonas = useMemo(() => {
    let result = allPersonas;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.shortBio.toLowerCase().includes(q) ||
          p.categories.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (categoryFilter !== "All") {
      result = result.filter((p) => p.categories.includes(categoryFilter as PersonaCategory));
    }
    return result;
  }, [allPersonas, search, categoryFilter]);

  const suggestedPersonas = suggestedIds
    .map((id) => allPersonas.find((p) => p.id === id))
    .filter(Boolean) as Persona[];

  const boardSize = selectedMembers.length;
  const sizeWarning =
    boardSize > 0
      ? boardSize < 3
        ? `Add ${3 - boardSize} more member${3 - boardSize > 1 ? "s" : ""} (minimum 3)`
        : boardSize > 7
        ? `Board has ${boardSize} members — recommended maximum is 7`
        : boardSize >= 4 && boardSize <= 5
        ? `Great board size (${boardSize})`
        : `${boardSize} members`
      : "No members selected";

  const sizeColor =
    boardSize < 3 ? "#F59E0B" : boardSize > 7 ? "#EF4444" : boardSize >= 4 && boardSize <= 5 ? "#10B981" : "#6B7280";

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search personas..."
            className="w-full pl-8 pr-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white focus:border-gray-400 outline-none"
          />
        </div>
        {filteredPersonas.slice(0, compact ? 4 : 20).map((p) => (
          <PersonaSuggestionCard
            key={p.id}
            persona={p}
            onAdd={() => onAdd(p.id)}
            isSuggested={suggestedIds.includes(p.id)}
            isSelected={selectedIds.has(p.id)}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected board + size indicator */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Board Members ({boardSize})
          </p>
          <span className="text-[11px] font-semibold" style={{ color: sizeColor }}>
            {sizeWarning}
          </span>
        </div>
        {selectedMembers.length === 0 ? (
          <div className="flex items-center justify-center h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-[12px] text-gray-400">
              Click personas on the right to add them to your board
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedMembers.map((member) => {
              const p = allPersonas.find((x) => x.id === member.personaId);
              if (!p) return null;
              return (
                <PersonaChip
                  key={member.id}
                  member={member}
                  persona={p}
                  onRemove={() => onRemove(member.id)}
                  showRole
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested personas */}
      {suggestedPersonas.length > 0 && showSuggestions && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <Sparkles size={10} className="inline mr-1 text-amber-500" />
              Suggested
            </p>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              Hide
            </button>
          </div>
          <div className="space-y-2">
            {suggestedPersonas.map((p) => (
              <PersonaSuggestionCard
                key={p.id}
                persona={p}
                onAdd={() => onAdd(p.id)}
                isSuggested={true}
                isSelected={selectedIds.has(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, title, or category..."
            className="w-full pl-8 pr-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white focus:border-gray-400 outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as PersonaCategory | "All")}
            className="text-[11px] px-2 py-2 rounded-lg border border-gray-200 bg-white focus:border-gray-400 outline-none appearance-none pr-6 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Persona grid */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
        {filteredPersonas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[12px] text-gray-400">
              No personas match your search
            </p>
          </div>
        ) : (
          filteredPersonas.map((p) => (
            <PersonaSuggestionCard
              key={p.id}
              persona={p}
              onAdd={() => onAdd(p.id)}
              isSuggested={suggestedIds.includes(p.id)}
              isSelected={selectedIds.has(p.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
