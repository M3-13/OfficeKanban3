import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Column } from "../api/boards";
import type { Ticket } from "../api/tickets";
import type { TicketCreate } from "../api/tickets";
import TicketCard from "./TicketCard";

interface ColumnViewProps {
  column: Column;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onCreateTicket: (data: TicketCreate) => void;
  onDeleteColumn?: () => void;
}

export default function ColumnView({
  column,
  tickets,
  onTicketClick,
  onCreateTicket,
  onDeleteColumn,
}: ColumnViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const isWipExceeded =
    column.wip_limit !== null && tickets.length >= column.wip_limit;
  const isWipWarning =
    column.wip_limit !== null &&
    !isWipExceeded &&
    tickets.length >= column.wip_limit - 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateTicket({ title: newTitle.trim() });
    setNewTitle("");
    setShowForm(false);
  };

  return (
    <div
      className={`
        bg-card_bg border rounded-lg p-3 min-w-[280px] max-w-[340px]
        flex flex-col
        shadow-[0_1px_3px_rgba(0,0,0,0.06)]
        ${isWipExceeded ? "border-danger bg-[#FEF2F2]" : "border-border-light"}
        transition-border duration-250
      `}
    >
      <div
        className={`pb-3 border-b border-border-light flex items-center justify-between ${
          isWipExceeded ? "bg-danger-light rounded-t-lg -mx-3 -mt-3 px-3 pt-3 pb-3" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.name}</h3>
          <span className="text-xs text-muted">
            {tickets.length}
            {column.wip_limit !== null && ` / ${column.wip_limit}`}
          </span>
          {isWipExceeded && (
            <span className="text-xs text-danger font-medium">WIP-Limit überschritten</span>
          )}
          {isWipWarning && !isWipExceeded && (
            <span className="text-xs text-warning font-medium">WIP-Warnung</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-muted hover:text-fg text-lg leading-none w-7 h-7 flex items-center justify-center rounded-sm hover:bg-border-light"
            title="Ticket hinzufügen"
          >
            +
          </button>
          {onDeleteColumn && (
            <button
              onClick={onDeleteColumn}
              className="text-muted hover:text-danger text-sm leading-none w-7 h-7 flex items-center justify-center rounded-sm hover:bg-danger-light"
              title="Spalte löschen"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 mb-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ticket-Titel..."
            autoFocus
            className="w-full border border-border rounded-md px-4 py-2.5 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none mb-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-accent text-white rounded-md py-2.5 px-4 font-medium min-h-[44px] hover:bg-accent-hover active:scale-[0.97] transition-transform duration-150 text-sm"
            >
              Hinzufügen
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-transparent text-accent border border-border rounded-md py-2.5 px-4 font-medium min-h-[44px] hover:bg-accent-subtle hover:border-accent active:scale-[0.97] transition-transform duration-150 text-sm"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <Droppable droppableId={`column-${column.id}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto min-h-[60px] mt-3 space-y-2 ${
              snapshot.isDraggingOver ? "bg-accent-subtle rounded-md" : ""
            }`}
          >
            {tickets.map((ticket, index) => (
              <Draggable
                key={ticket.id}
                draggableId={`ticket-${ticket.id}`}
                index={index}
              >
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <TicketCard
                      ticket={ticket}
                      onClick={() => onTicketClick(ticket)}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
