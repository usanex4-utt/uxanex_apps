import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, loadSession, clearSession, setUnauthorizedHandler } from "../api/client";
import { EP } from "../api/endpoints";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const signOut = useCallback(async () => {
    try { await api(EP.logout, { method: "POST", silent401: true }); } catch {}
    await clearSession();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { clearSession(); setUser(null); });
    (async () => {
      await loadSession();
      try {
        const d = await api(EP.me, { silent401: true });
        setUser(d.user);
      } catch {}
      setBooting(false);
    })();
  }, []);

  const signIn = async (identifier, password) => {
    const d = await api(EP.login, { method: "POST", body: { identifier, password }, silent401: true });
    if (!d.user) throw new Error("Login failed.");
    try {
      await api(EP.me, { silent401: true });
    } catch (e) {
      throw new Error("Login succeeded, but session verification failed: " + (e?.message || "Unknown error"));
    }
    setUser(d.user);
  };

  const patchUser = useCallback((patch) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  return <Ctx.Provider value={{ user, booting, signIn, signOut, patchUser }}>{children}</Ctx.Provider>;
}