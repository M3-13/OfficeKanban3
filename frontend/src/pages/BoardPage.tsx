import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import * as boardsApi from "../api/boards";
import type { Board, Column, ColumnCreate } from "../api/boards";
import * as ticketsApi from "../api/tickets";
import type { Ticket, TicketCreate, TicketUpdate } from "../api/tickets";
import BoardHeader from "../components/BoardHeader";
import ColumnView from "../components/ColumnView";
import TicketDetailModal from "../components/TicketDetailModal";
import { useWebSocket } from "../hooks/useWebSocket";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const boardId = Number(id);

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tickets, setTickets] = useState<Record<number, Ticket[]>>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newColName, setNewColName] = useState("");
  const [loading, setLoading] = useState(true);

  useWebSocket(boardId);

  const loadBoard = useCallback(async () => {
    if (!boardId || isNaN(boardId)) return;
    setLoading(true);
    try {
      const [boardData, columnsData] = await Promise.all([
        boardsApi.getBoard(boardId),
        boardsApi.listColumns(boardId),
      ]);
      setBoard(boardData);
      setColumns(columnsData);

      const ticketsMap: Record<number, Ticket[]> = {};
      await Promise.all(
        columnsData.map(async (col) => {
          try {
            ticketsMap[col.id] = await ticketsApi.listTickets(col.id);
          } catch {
            ticketsMap[col.id] = [];
          }
        }),
      );
      setTickets(ticketsMap);
    } catch {
      navigate("/boards");
    } finally {
      setLoading(false);
    }
  }, [boardId, navigate]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId) return;

      const sourceColId = Number(source.droppableId.replace("column-", ""));
      const destColId = Number(destination.droppableId.replace("column-", ""));
      const ticketId = Number(draggableId.replace("ticket-", ""));

      try {
        await ticketsApi.updateTicket(ticketId, { column_id: destColId });
        setTickets((prev) => {
          const sourceTickets = prev[sourceColId] || [];
          const destTickets = prev[destColId] || [];
          const ticket = sourceTickets.find((t) => t.id === ticketId);
          if (!ticket) return prev;
          return {
            ...prev,
            [sourceColId]: sourceTickets.filter((t) => t.id !== ticketId),
            [destColId]: [...destTickets, { ...ticket, column_id: destColId }],
          };
        });
      } catch {
        await loadBoard();
      }
    },
    [loadBoard],
  );

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !boardId) return;
    try {
      const column = await boardsApi.createColumn(boardId, {
        name: newColName.trim(),
        position: columns.length,
      });
      setColumns([...columns, column]);
      setTickets((prev) => ({ ...prev, [column.id]: [] }));
      setNewColName("");
    } catch {
      // silent
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    if (!window.confirm("Spalte wirklich löschen?")) return;
    try {
      await boardsApi.deleteColumn(boardId, columnId);
      setColumns(columns.filter((c) => c.id !== columnId));
      setTickets((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
    } catch {
      // silent
    }
  };

  const handleCreateTicket = async (colId: number, data: TicketCreate) => {
    try {
      const ticket = await ticketsApi.createTicket(colId, data);
      setTickets((prev) => ({
        ...prev,
        [colId]: [...(prev[colId] || []), ticket],
      }));
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
        if (axiosErr.response?.status === 409) {
          alert(axiosErr.response.data?.detail || "WIP-Limit erreicht");
        }
      }
    }
  };

  const handleUpdateTicket = async (ticketId: number, data: TicketUpdate) => {
    try {
      const updated = await ticketsApi.updateTicket(ticketId, data);
      setTickets((prev) => {
        const next = { ...prev };
        for (const colId of Object.keys(next)) {
          const numColId = Number(colId);
          const idx = next[numColId].findIndex((t) => t.id === ticketId);
          if (idx >= 0) {
            if (data.column_id && data.column_id !== numColId) {
              const ticket = next[numColId].splice(idx, 1)[0];
              next[data.column_id] = [
                ...(next[data.column_id] || []),
                { ...ticket, column_id: data.column_id },
              ];
            } else {
              next[numColId][idx] = updated;
            }
            break;
          }
        }
        return next;
      });
      setSelectedTicket((prev) => (prev?.id === ticketId ? updated : prev));
    } catch {
      // silent
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    try {
      await ticketsApi.deleteTicket(ticketId);
      setTickets((prev) => {
        const next = { ...prev };
        for (const colId of Object.keys(next)) {
          next[Number(colId)] = next[Number(colId)].filter((t) => t.id !== ticketId);
        }
        return next;
      });
      setSelectedTicket(null);
    } catch {
      // silent
    }
  };

  const handleDeleteBoard = async () => {
    if (!window.confirm("Board wirklich löschen? Alle Daten gehen verloren.")) return;
    try {
      await boardsApi.deleteBoard(boardId);
      navigate("/boards");
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Laden...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Board nicht gefunden.</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <BoardHeader board={board} onDelete={handleDeleteBoard} />

      <form onSubmit={handleCreateColumn} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newColName}
          onChange={(e) => setNewColName(e.target.value)}
          placeholder="Neue Spalte..."
          className="border border-border rounded-md px-4 py-2.5 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none w-60"
        />
        <button
          type="submit"
          className="bg-accent text-white rounded-md py-2.5 px-5 font-medium min-h-[44px] hover:bg-accent-hover active:scale-[0.97] transition-transform duration-150 text-sm shrink-0"
        >
          Spalte erstellen
        </button>
      </form>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {columns.map((column) => (
          <ColumnView
            key={column.id}
            column={column}
            tickets={tickets[column.id] || []}
            onTicketClick={(ticket) => setSelectedTicket(ticket)}
            onCreateTicket={(data) => handleCreateTicket(column.id, data)}
            onDeleteColumn={() => handleDeleteColumn(column.id)}
          />
        ))}
        {columns.length === 0 && (
          <p className="text-muted text-sm py-8">
            Noch keine Spalten. Erstelle deine erste Spalte!
          </p>
        )}
      </div>

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={(data) => handleUpdateTicket(selectedTicket.id, data)}
          onDelete={() => handleDeleteTicket(selectedTicket.id)}
        />
      )}
    </DragDropContext>
  );
}
