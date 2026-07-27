import type { Ticket } from "../api/tickets";

const PRIORITY_LABELS: Record<number, string> = {
  1: "Niedrig",
  2: "Mittel",
  3: "Hoch",
  4: "Sehr hoch",
  5: "Kritisch",
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-[#9CA3AF]",
  2: "bg-[#60A5FA]",
  3: "bg-accent",
  4: "bg-warning",
  5: "bg-danger",
};

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
  isDragging?: boolean;
}

export default function TicketCard({
  ticket,
  onClick,
  isDragging,
}: TicketCardProps) {
  const dueDateFormatted = ticket.due_date
    ? new Date(ticket.due_date).toLocaleDateString("de-DE")
    : null;

  const isOverdue = ticket.due_date
    ? new Date(ticket.due_date) < new Date()
    : false;

  return (
    <div
      onClick={onClick}
      className={`
        bg-card_bg border border-border-light rounded-md p-3
        shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer
        hover:shadow-ticket-hover hover:border-border
        transition-shadow duration-150 transition-transform duration-150 transition-border duration-150
        ${isDragging ? "shadow-[0_8px_24px_rgba(0,0,0,0.16)] rotate-2 scale-[1.02]" : ""}
      `}
    >
      <h4 className="font-medium text-sm leading-[1.4] mb-2">{ticket.title}</h4>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span
          className={`inline-flex items-center gap-1 h-5 px-2 rounded-pill text-[11px] font-medium text-white ${PRIORITY_COLORS[ticket.priority] || "bg-muted"}`}
        >
          {PRIORITY_LABELS[ticket.priority] || `P${ticket.priority}`}
        </span>

        {ticket.tags?.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-5 px-2 rounded-pill text-[11px] font-medium bg-accent-light text-accent"
          >
            {tag}
          </span>
        ))}

        {dueDateFormatted && (
          <span
            className={`inline-flex h-5 px-2 rounded-pill text-[11px] font-medium ${
              isOverdue
                ? "bg-danger-light text-danger"
                : "bg-border-light text-muted"
            }`}
          >
            {dueDateFormatted}
          </span>
        )}
      </div>
    </div>
  );
}
