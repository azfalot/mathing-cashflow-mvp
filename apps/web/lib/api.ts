"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  role: "ADMIN" | "ANALYST";
};

export type Session = {
  accessToken: string;
  user: SessionUser;
};

export function getSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("mathing-session");
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function setSession(session: Session) {
  window.localStorage.setItem("mathing-session", JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem("mathing-session");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error de API");
  }

  return response.json() as Promise<T>;
}

export async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const session = getSession();
  const headers = new Headers();
  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error subiendo archivo");
  }

  return response.json() as Promise<T>;
}
