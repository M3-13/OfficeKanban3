import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as boardsApi from "../api/boards";
import type { Board } from "../api/boards";

export default function BoardListPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  const loadBoards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardsApi.listBoards();
      setBoards(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const board = await boardsApi.createBoard(newName.trim());
      setBoards([board, ...boards]);
      setNewName("");
    } catch {
      // silent
    }
  };

  const handleDelete = async (boardId: number) => {
    if (!window.confirm("Board wirklich löschen?")) return;
    try {
      await boardsApi.deleteBoard(boardId);
      setBoards(boards.filter((b) => b.id !== boardId));
    } catch {
      // silent
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Meine Boards</h2>

      <form onSubmit={handleCreate} className="flex gap-2 mb-5">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name des neuen Boards"
          className="flex-1 border border-border rounded-md px-4 py-2.5 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none"
        />
        <button
          type="submit"
          className="bg-accent text-white rounded-md py-2.5 px-5 font-medium min-h-[44px] hover:bg-accent-hover active:scale-[0.97] transition-transform duration-150 text-sm shrink-0"
        >
          Erstellen
        </button>
      </form>

      {loading ? (
        <p className="text-muted text-sm">Laden...</p>
      ) : boards.length === 0 ? (
        <p className="text-muted text-sm">
          Noch keine Boards. Erstelle dein erstes Board!
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="bg-card_bg border border-border-light rounded-lg p-4 shadow-card hover:shadow-card-hover transition-shadow duration-150 cursor-pointer"
              onClick={() => navigate(`/boards/${board.id}`)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">{board.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(board.id);
                  }}
                  className="text-muted hover:text-danger text-lg leading-none w-7 h-7 flex items-center justify-center rounded-sm hover:bg-danger-light"
                  title="Board löschen"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-muted mt-2">
                Erstellt am{" "}
                {new Date(board.created_at).toLocaleDateString("de-DE")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
