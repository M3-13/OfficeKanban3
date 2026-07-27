import type { Board } from "../api/boards";
import type { SwimlaneCriterion } from "./SwimlaneView";

interface BoardHeaderProps {
  board: Board;
  onDelete?: () => void;
  swimlane: SwimlaneCriterion;
  onSwimlaneChange: (criterion: SwimlaneCriterion) => void;
}

const SWIMLANE_OPTIONS: { value: SwimlaneCriterion; label: string }[] = [
  { value: "none", label: "Keine" },
  { value: "assignee", label: "Assignee" },
  { value: "priority", label: "Priorität" },
  { value: "tag", label: "Tag" },
];

export default function BoardHeader({
  board,
  onDelete,
  swimlane,
  onSwimlaneChange,
}: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h1 className="text-xl font-semibold">{board.name}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="swimlane-select" className="text-sm text-muted">
            Swimlanes:
          </label>
          <select
            id="swimlane-select"
            value={swimlane}
            onChange={(e) =>
              onSwimlaneChange(e.target.value as SwimlaneCriterion)
            }
            className="border border-border rounded-md px-3 py-2 text-sm min-h-[44px] bg-card_bg focus:border-accent focus:ring-3 focus:ring-accent-light outline-none"
          >
            {SWIMLANE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="bg-danger text-white rounded-md py-2.5 px-5 font-medium min-h-[44px] hover:bg-[#DC2626] active:scale-[0.97] transition-transform duration-150 text-sm"
          >
            Board löschen
          </button>
        )}
      </div>
    </div>
  );
}
