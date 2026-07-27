import apiClient from "./client";

export interface Ticket {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  priority: number;
  due_date: string | null;
  assignee_id: number | null;
  tags: string[] | null;
}

export interface TicketCreate {
  title: string;
  description?: string | null;
  priority?: number;
  due_date?: string | null;
  assignee_id?: number | null;
  tags?: string[] | null;
}

export interface TicketUpdate {
  title?: string;
  description?: string | null;
  priority?: number;
  due_date?: string | null;
  assignee_id?: number | null;
  tags?: string[] | null;
  column_id?: number;
}

export interface Comment {
  id: number;
  ticket_id: number;
  author_id: number;
  content: string;
  created_at: string;
}

export async function listTickets(columnId: number): Promise<Ticket[]> {
  const resp = await apiClient.get<Ticket[]>(
    `/tickets/columns/${columnId}/tickets`,
  );
  return resp.data;
}

export async function createTicket(
  columnId: number,
  data: TicketCreate,
): Promise<Ticket> {
  const resp = await apiClient.post<Ticket>(
    `/tickets/columns/${columnId}/tickets`,
    data,
  );
  return resp.data;
}

export async function getTicket(ticketId: number): Promise<Ticket> {
  const resp = await apiClient.get<Ticket>(`/tickets/${ticketId}`);
  return resp.data;
}

export async function updateTicket(
  ticketId: number,
  data: TicketUpdate,
): Promise<Ticket> {
  const resp = await apiClient.put<Ticket>(`/tickets/${ticketId}`, data);
  return resp.data;
}

export async function deleteTicket(ticketId: number): Promise<void> {
  await apiClient.delete(`/tickets/${ticketId}`);
}

export async function listComments(ticketId: number): Promise<Comment[]> {
  const resp = await apiClient.get<Comment[]>(`/tickets/${ticketId}/comments`);
  return resp.data;
}

export async function createComment(
  ticketId: number,
  content: string,
): Promise<Comment> {
  const resp = await apiClient.post<Comment>(`/tickets/${ticketId}/comments`, {
    content,
  });
  return resp.data;
}

export async function deleteComment(
  ticketId: number,
  commentId: number,
): Promise<void> {
  await apiClient.delete(`/tickets/${ticketId}/comments/${commentId}`);
}
