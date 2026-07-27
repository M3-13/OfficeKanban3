import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DragDropContext } from "@hello-pangea/dnd";
import SwimlaneView, { type SwimlaneCriterion } from "./SwimlaneView";
import type { Column } from "../api/boards";
import type { Ticket } from "../api/tickets";

const columns: Column[] = [
  { id: 1, board_id: 1, name: "To Do", position: 0, wip_limit: null },
  { id: 2, board_id: 1, name: "Done", position: 1, wip_limit: null },
];

function makeTicket(
  id: number,
  column_id: number,
  overrides: Partial<Ticket> = {},
): Ticket {
  return {
    id,
    column_id,
    title: `Ticket ${id}`,
    description: null,
    priority: 3,
    due_date: null,
    assignee_id: null,
    tags: null,
    ...overrides,
  };
}

const noop = vi.fn();

function renderWithDnd(
  criterion: SwimlaneCriterion,
  tickets: Record<number, Ticket[]>,
  currentUserId?: number,
) {
  return render(
    <DragDropContext onDragEnd={noop}>
      <SwimlaneView
        columns={columns}
        tickets={tickets}
        criterion={criterion}
        onTicketClick={noop}
        onCreateTicket={noop}
        onDeleteColumn={noop}
        currentUserId={currentUserId}
      />
    </DragDropContext>,
  );
}

describe("SwimlaneView", () => {
  describe('criterion "none"', () => {
    it("renders columns normally without swimlane labels", () => {
      renderWithDnd("none", {
        1: [makeTicket(1, 1)],
        2: [],
      });
      expect(screen.getAllByText("To Do")).toHaveLength(1);
      expect(screen.getAllByText("Done")).toHaveLength(1);
      expect(screen.getByText("Ticket 1")).toBeInTheDocument();
    });

    it("shows empty columns message when no columns", () => {
      render(
        <DragDropContext onDragEnd={noop}>
          <SwimlaneView
            columns={[]}
            tickets={{}}
            criterion="none"
            onTicketClick={noop}
            onCreateTicket={noop}
            onDeleteColumn={noop}
          />
        </DragDropContext>,
      );
      expect(
        screen.getByText(/Noch keine Spalten/),
      ).toBeInTheDocument();
    });
  });

  describe('criterion "assignee"', () => {
    it("groups unassigned tickets in 'Nicht zugewiesen' swimlane", () => {
      renderWithDnd("assignee", {
        1: [makeTicket(1, 1, { assignee_id: null })],
        2: [],
      });
      expect(screen.getAllByText("Nicht zugewiesen")).toHaveLength(1);
    });

    it("groups assigned tickets by user ID", () => {
      renderWithDnd("assignee", {
        1: [makeTicket(1, 1, { assignee_id: 5 })],
        2: [],
      });
      expect(screen.getAllByText("Benutzer #5")).toHaveLength(1);
    });

    it('shows "Mir zugewiesen" for current user', () => {
      renderWithDnd(
        "assignee",
        { 1: [makeTicket(1, 1, { assignee_id: 7 })] },
        7,
      );
      expect(screen.getAllByText("Mir zugewiesen")).toHaveLength(1);
      expect(screen.queryByText("Benutzer #7")).not.toBeInTheDocument();
    });

    it("creates separate swimlanes for different assignees", () => {
      renderWithDnd("assignee", {
        1: [
          makeTicket(1, 1, { assignee_id: null }),
          makeTicket(2, 1, { assignee_id: 5 }),
          makeTicket(3, 1, { assignee_id: 10 }),
        ],
        2: [],
      });
      expect(screen.getAllByText("Nicht zugewiesen")).toHaveLength(1);
      expect(screen.getAllByText("Benutzer #5")).toHaveLength(1);
      expect(screen.getAllByText("Benutzer #10")).toHaveLength(1);
    });
  });

  describe('criterion "priority"', () => {
    it("groups tickets by priority in descending order", () => {
      renderWithDnd("priority", {
        1: [
          makeTicket(1, 1, { priority: 5 }),
          makeTicket(2, 1, { priority: 1 }),
        ],
        2: [],
      });
      expect(screen.getAllByText("Kritisch")).toHaveLength(2);
      expect(screen.getAllByText("Niedrig")).toHaveLength(2);
    });

    it("only shows swimlanes that have tickets", () => {
      renderWithDnd("priority", {
        1: [makeTicket(1, 1, { priority: 3 })],
        2: [],
      });
      expect(screen.getAllByText("Hoch")).toHaveLength(2);
      expect(screen.queryByText("Kritisch")).not.toBeInTheDocument();
      expect(screen.queryByText("Niedrig")).not.toBeInTheDocument();
    });
  });

  describe('criterion "tag"', () => {
    it("groups untagged tickets in 'Ohne Tag' swimlane", () => {
      renderWithDnd("tag", {
        1: [makeTicket(1, 1, { tags: null })],
        2: [],
      });
      expect(screen.getAllByText("Ohne Tag")).toHaveLength(1);
    });

    it("groups tickets by tag", () => {
      renderWithDnd("tag", {
        1: [makeTicket(1, 1, { tags: ["bug"] })],
        2: [],
      });
      expect(screen.getAllByText("bug")).toHaveLength(2);
    });

    it("creates separate swimlanes for different tags", () => {
      renderWithDnd("tag", {
        1: [
          makeTicket(1, 1, { tags: ["bug"] }),
          makeTicket(2, 1, { tags: ["frontend"] }),
          makeTicket(3, 1, { tags: null }),
        ],
        2: [],
      });
      expect(screen.getAllByText("Ohne Tag")).toHaveLength(1);
      expect(screen.getAllByText("bug")).toHaveLength(2);
      expect(screen.getAllByText("frontend")).toHaveLength(2);
    });

    it("shows ticket in both tag swimlanes when multiple tags", () => {
      renderWithDnd("tag", {
        1: [makeTicket(1, 1, { tags: ["bug", "frontend"] })],
        2: [],
      });
      expect(screen.getAllByText("bug")).toHaveLength(3);
      expect(screen.getAllByText("frontend")).toHaveLength(3);
    });
  });

  describe("droppableIds in swimlane mode", () => {
    it("includes swimlane key in droppable area IDs", () => {
      const { container } = renderWithDnd("priority", {
        1: [makeTicket(1, 1, { priority: 3 })],
        2: [],
      });
      const droppableEl = container.querySelector(
        '[data-rfd-droppable-id^="swimlane-"]',
      );
      expect(droppableEl).not.toBeNull();
      const id = droppableEl!.getAttribute("data-rfd-droppable-id");
      expect(id).toMatch(/^swimlane-priority-3-column-\d+$/);
    });
  });

  describe("empty swimlanes", () => {
    it("falls back to normal column view when no groups found", () => {
      renderWithDnd("assignee", {});
      expect(screen.getAllByText("To Do")).toHaveLength(1);
      expect(screen.getAllByText("Done")).toHaveLength(1);
    });
  });
});
