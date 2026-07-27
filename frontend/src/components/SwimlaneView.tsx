import type { Column } from "../api/boards";
import type { Ticket, TicketCreate } from "../api/tickets";
import ColumnView from "./ColumnView";

export type SwimlaneCriterion = "none" | "assignee" | "priority" | "tag";

interface SwimlaneGroup {
  key: string;
  label: string;
  tickets: Record<number, Ticket[]>;
}

interface SwimlaneViewProps {
  columns: Column[];
  tickets: Record<number, Ticket[]>;
  criterion: SwimlaneCriterion;
  onTicketClick: (ticket: Ticket) => void;
  onCreateTicket: (colId: number, data: TicketCreate) => void;
  onDeleteColumn: (colId: number) => void;
  currentUserId?: number;
}

const PRIORITY_LABELS: Record<number, string> = {
  1: "Niedrig",
  2: "Mittel",
  3: "Hoch",
  4: "Sehr hoch",
  5: "Kritisch",
};

function makeSwimlaneKey(prefix: string, value: string): string {
  return `${prefix}-${value}`;
}

function sanitizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function groupByAssignee(
  tickets: Record<number, Ticket[]>,
  currentUserId?: number,
): SwimlaneGroup[] {
  const assigneeIds = new Set<number>();
  for (const colTickets of Object.values(tickets)) {
    for (const t of colTickets) {
      if (t.assignee_id !== null) {
        assigneeIds.add(t.assignee_id);
      }
    }
  }

  const groups: SwimlaneGroup[] = [];
  const unassignedTickets: Record<number, Ticket[]> = {};

  for (const colId of Object.keys(tickets)) {
    const colTickets = tickets[Number(colId)];
    for (const t of colTickets) {
      if (t.assignee_id === null) {
        (unassignedTickets[t.column_id] ??= []).push(t);
      }
    }
  }

  if (Object.values(unassignedTickets).some((arr) => arr.length > 0)) {
    groups.push({
      key: makeSwimlaneKey("assignee", "none"),
      label: "Nicht zugewiesen",
      tickets: unassignedTickets,
    });
  }

  for (const assigneeId of Array.from(assigneeIds).sort((a, b) => a - b)) {
    const groupTickets: Record<number, Ticket[]> = {};
    for (const colId of Object.keys(tickets)) {
      const colTickets = tickets[Number(colId)];
      for (const t of colTickets) {
        if (t.assignee_id === assigneeId) {
          (groupTickets[t.column_id] ??= []).push(t);
        }
      }
    }
    const label =
      assigneeId === currentUserId
        ? "Mir zugewiesen"
        : `Benutzer #${assigneeId}`;
    groups.push({
      key: makeSwimlaneKey("assignee", String(assigneeId)),
      label,
      tickets: groupTickets,
    });
  }

  return groups;
}

function groupByPriority(
  tickets: Record<number, Ticket[]>,
): SwimlaneGroup[] {
  const groups: SwimlaneGroup[] = [];
  for (let priority = 5; priority >= 1; priority--) {
    const groupTickets: Record<number, Ticket[]> = {};
    for (const colId of Object.keys(tickets)) {
      const colTickets = tickets[Number(colId)];
      for (const t of colTickets) {
        if (t.priority === priority) {
          (groupTickets[t.column_id] ??= []).push(t);
        }
      }
    }
    if (Object.values(groupTickets).some((arr) => arr.length > 0)) {
      groups.push({
        key: makeSwimlaneKey("priority", String(priority)),
        label: PRIORITY_LABELS[priority] || `Priorität ${priority}`,
        tickets: groupTickets,
      });
    }
  }
  return groups;
}

function groupByTag(tickets: Record<number, Ticket[]>): SwimlaneGroup[] {
  const allTags = new Set<string>();
  for (const colTickets of Object.values(tickets)) {
    for (const t of colTickets) {
      if (t.tags) {
        for (const tag of t.tags) {
          allTags.add(tag);
        }
      }
    }
  }

  const groups: SwimlaneGroup[] = [];
  const untaggedTickets: Record<number, Ticket[]> = {};

  for (const colId of Object.keys(tickets)) {
    const colTickets = tickets[Number(colId)];
    for (const t of colTickets) {
      if (!t.tags || t.tags.length === 0) {
        (untaggedTickets[t.column_id] ??= []).push(t);
      }
    }
  }

  if (Object.values(untaggedTickets).some((arr) => arr.length > 0)) {
    groups.push({
      key: makeSwimlaneKey("tag", "none"),
      label: "Ohne Tag",
      tickets: untaggedTickets,
    });
  }

  const sortedTags = Array.from(allTags).sort();
  for (const tag of sortedTags) {
    const groupTickets: Record<number, Ticket[]> = {};
    for (const colId of Object.keys(tickets)) {
      const colTickets = tickets[Number(colId)];
      for (const t of colTickets) {
        if (t.tags && t.tags.includes(tag)) {
          (groupTickets[t.column_id] ??= []).push(t);
        }
      }
    }
    if (Object.values(groupTickets).some((arr) => arr.length > 0)) {
      groups.push({
        key: makeSwimlaneKey("tag", sanitizeKey(tag)),
        label: tag,
        tickets: groupTickets,
      });
    }
  }

  return groups;
}

function groupTickets(
  tickets: Record<number, Ticket[]>,
  criterion: SwimlaneCriterion,
  currentUserId?: number,
): SwimlaneGroup[] {
  switch (criterion) {
    case "assignee":
      return groupByAssignee(tickets, currentUserId);
    case "priority":
      return groupByPriority(tickets);
    case "tag":
      return groupByTag(tickets);
    default:
      return [];
  }
}

export default function SwimlaneView({
  columns,
  tickets,
  criterion,
  onTicketClick,
  onCreateTicket,
  onDeleteColumn,
  currentUserId,
}: SwimlaneViewProps) {
  const groups = groupTickets(tickets, criterion, currentUserId);

  if (criterion === "none" || groups.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {columns.map((column) => (
          <ColumnView
            key={column.id}
            column={column}
            tickets={tickets[column.id] || []}
            onTicketClick={onTicketClick}
            onCreateTicket={(data) => onCreateTicket(column.id, data)}
            onDeleteColumn={() => onDeleteColumn(column.id)}
          />
        ))}
        {columns.length === 0 && (
          <p className="text-muted text-sm py-8">
            Noch keine Spalten. Erstelle deine erste Spalte!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="h-0.5 flex-1 bg-border-light" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wide whitespace-nowrap">
              {group.label}
            </span>
            <div className="h-0.5 flex-1 bg-border-light" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {columns.map((column) => (
              <ColumnView
                key={`${group.key}-${column.id}`}
                column={column}
                tickets={group.tickets[column.id] || []}
                droppableId={`swimlane-${group.key}-column-${column.id}`}
                onTicketClick={onTicketClick}
                onCreateTicket={(data) =>
                  onCreateTicket(column.id, data)
                }
                onDeleteColumn={() => onDeleteColumn(column.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
