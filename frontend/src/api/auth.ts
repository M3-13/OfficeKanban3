import apiClient from "./client";

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export async function login(email: string, password: string): Promise<Token> {
  const resp = await apiClient.post<Token>("/auth/login", { email, password });
  return resp.data;
}

export async function register(email: string, password: string): Promise<User> {
  const resp = await apiClient.post<User>("/auth/register", { email, password });
  return resp.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getMe(): Promise<User> {
  const resp = await apiClient.get<User>("/auth/me");
  return resp.data;
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete("/auth/me");
}
