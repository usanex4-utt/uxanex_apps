import React, { createContext, useContext, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUnauthorizedHandler, clearSession } from "../api/client";
import {
  bootstrapAuth, signInThunk, signOutThunk,
  patchUser as patchUserAction, clearUser,
} from "../store/slices/authSlice";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, booting } = useSelector((s) => s.auth);

  const signOut = useCallback(async () => { await dispatch(signOutThunk()); }, [dispatch]);

  const signIn = useCallback(async (identifier, password) => {
    const res = await dispatch(signInThunk({ identifier, password }));
    if (res.meta.requestStatus === "rejected") throw new Error(res.payload || "Login failed.");
  }, [dispatch]);

  const patchUser = useCallback((patch) => dispatch(patchUserAction(patch)), [dispatch]);

  useEffect(() => {
    setUnauthorizedHandler(() => { clearSession(); dispatch(clearUser()); });
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return <Ctx.Provider value={{ user, booting, signIn, signOut, patchUser }}>{children}</Ctx.Provider>;
}