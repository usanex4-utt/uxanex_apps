import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, loadSession, clearSession } from "../../api/client";
import { EP } from "../../api/endpoints";

export const bootstrapAuth = createAsyncThunk("auth/bootstrap", async () => {
  await loadSession();
  try { const d = await api(EP.me, { silent401: true }); return d.user; }
  catch { return null; }
});

export const signInThunk = createAsyncThunk(
  "auth/signIn",
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      const d = await api(EP.login, { method: "POST", body: { identifier, password }, silent401: true });
      if (!d.user) throw new Error("Login failed.");
      await api(EP.me, { silent401: true });
      return d.user;
    } catch (e) { return rejectWithValue(e.message); }
  }
);

export const signOutThunk = createAsyncThunk("auth/signOut", async () => {
  try { await api(EP.logout, { method: "POST", silent401: true }); } catch {}
  await clearSession();
});

const slice = createSlice({
  name: "auth",
  initialState: { user: null, booting: true, status: "idle", error: null },
  reducers: {
    setUser(state, a) { state.user = a.payload; },
    clearUser(state) { state.user = null; },
    patchUser(state, a) { if (state.user) state.user = { ...state.user, ...a.payload }; },
  },
  extraReducers: (b) => {
    b.addCase(bootstrapAuth.fulfilled, (s, a) => { s.user = a.payload; s.booting = false; });
    b.addCase(bootstrapAuth.rejected,  (s) => { s.user = null; s.booting = false; });
    b.addCase(signInThunk.pending,     (s) => { s.status = "loading"; s.error = null; });
    b.addCase(signInThunk.fulfilled,   (s, a) => { s.status = "idle"; s.user = a.payload; });
    b.addCase(signInThunk.rejected,    (s, a) => { s.status = "idle"; s.error = a.payload; });
    b.addCase(signOutThunk.fulfilled,  (s) => { s.user = null; });
  },
});

export const { setUser, clearUser, patchUser } = slice.actions;
export default slice.reducer;