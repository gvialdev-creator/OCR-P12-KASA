import { ApiError } from "@/api/errors";

import type { OwnerRequestAdmin, OwnerRequestSelf } from "../types";

function apiUrl(path: string): URL {
  if (!process.env.API_BASE_URL) throw new ApiError("Le service des demandes est indisponible.");
  return new URL(path, process.env.API_BASE_URL);
}

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de joindre le service des demandes.");
  }
  if (!response.ok) {
    const message = response.status === 409 ? "Une demande est déjà en attente ou vient d’être traitée." : "La demande n’a pas pu être traitée.";
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export function getMyOwnerRequest(token: string): Promise<OwnerRequestSelf | null> {
  return request("/api/owner-requests/me", token);
}

export function submitOwnerRequest(token: string): Promise<OwnerRequestSelf> {
  return request("/api/owner-requests", token, { method: "POST" });
}

export function listPendingOwnerRequests(token: string): Promise<OwnerRequestAdmin[]> {
  return request("/api/admin/owner-requests", token);
}

export function decideOwnerRequest(id: number, decision: "approve" | "reject", token: string): Promise<OwnerRequestAdmin> {
  return request(`/api/admin/owner-requests/${id}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision }),
  });
}