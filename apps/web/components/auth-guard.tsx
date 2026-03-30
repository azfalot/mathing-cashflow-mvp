"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession, Session } from "../lib/api";

export function useSessionState() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(getSession());
    setReady(true);
  }, []);

  return { session, ready };
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready } = useSessionState();

  useEffect(() => {
    if (ready && !session && pathname !== "/login") {
      router.replace("/login");
    }
  }, [ready, session, router, pathname]);

  if (!ready) {
    return <div className="p-10 text-center text-stone-600">Cargando sesión...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
