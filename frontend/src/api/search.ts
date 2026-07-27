import apiClient from "./client";
import type { Ticket } from "./tickets";

export interface SearchResult {
  tickets: Ticket[];
  total: number;
}

export async function searchTickets(
  boardId: number,
  query: string,
): Promise<SearchResult> {
  const resp = await apiClient.get<SearchResult>(
    `/boards/${boardId}/search`,
    { params: { q: query } },
  );
  return resp.data;
}
