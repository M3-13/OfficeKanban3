import type { Board } from "../api/boards";

interface BoardHeaderProps {
  board: Board;
  onDelete?: () => void;
}

export default function BoardHeader({ board, onDelete }: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h1 className="text-xl font-semibold">{board.name}</h1>
      {onDelete && (
        <button
          onClick={onDelete}
          className="bg-danger text-white rounded-md py-2.5 px-5 font-medium min-h-[44px] hover:bg-[#DC2626] active:scale-[0.97] transition-transform duration-150 text-sm"
        >
          Board löschen
        </button>
      )}
    </div>
  );
}
