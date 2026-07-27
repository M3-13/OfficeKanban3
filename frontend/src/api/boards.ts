import apiClient from "./client";

export interface Board {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
  wip_limit: number | null;
}

export interface ColumnCreate {
  name: string;
  position?: number;
  wip_limit?: number | null;
}

export interface ColumnUpdate {
  name?: string;
  position?: number;
  wip_limit?: number | null;
}

export async function listBoards(): Promise<Board[]> {
  const resp = await apiClient.get<Board[]>("/boards/");
  return resp.data;
}

export async function createBoard(name: string): Promise<Board> {
  const resp = await apiClient.post<Board>("/boards/", { name });
  return resp.data;
}

export async function getBoard(boardId: number): Promise<Board> {
  const resp = await apiClient.get<Board>(`/boards/${boardId}`);
  return resp.data;
}

export async function updateBoard(boardId: number, name: string): Promise<Board> {
  const resp = await apiClient.put<Board>(`/boards/${boardId}`, { name });
  return resp.data;
}

export async function deleteBoard(boardId: number): Promise<void> {
  await apiClient.delete(`/boards/${boardId}`);
}

export async function listColumns(boardId: number): Promise<Column[]> {
  const resp = await apiClient.get<Column[]>(`/boards/${boardId}/columns`);
  return resp.data;
}

export async function createColumn(
  boardId: number,
  data: ColumnCreate,
): Promise<Column> {
  const resp = await apiClient.post<Column>(`/boards/${boardId}/columns`, data);
  return resp.data;
}

export async function updateColumn(
  boardId: number,
  columnId: number,
  data: ColumnUpdate,
): Promise<Column> {
  const resp = await apiClient.put<Column>(
    `/boards/${boardId}/columns/${columnId}`,
    data,
  );
  return resp.data;
}

export async function deleteColumn(
  boardId: number,
  columnId: number,
): Promise<void> {
  await apiClient.delete(`/boards/${boardId}/columns/${columnId}`);
}
