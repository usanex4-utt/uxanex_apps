import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";

const adapter = createEntityAdapter({
  selectId: (c) => c.user_id,
  sortComparer: (a, b) => (a.name || a.username || "").localeCompare(b.name || b.username || ""),
});

export const fetchConnections = createAsyncThunk(
  "connections/fetch",
  async () => {
    const d = await api(EP.connections);
    return d.connections || d.users || [];
  },
  {
    condition: (_, { getState }) => {
      const { status, lastFetchedAt } = getState().connections;
      if (status === "loading") return false;
      return !lastFetchedAt || Date.now() - lastFetchedAt > 30_000;
    },
  }
);

export const setConnectionCategory = createAsyncThunk(
  "connections/setCategory",
  async ({ person, category }, { dispatch }) => {
    dispatch(optimisticCategory({ userId: person.user_id, category }));
    try {
      if (category)
        await api(EP.connectionCategory, { method: "POST", body: { connected_user_id: person.user_id, category } });
      else
        await api(EP.connectionCategoryRemove(person.user_id), { method: "DELETE" });
      return { userId: person.user_id, category };
    } catch (e) {
      dispatch(optimisticCategory({ userId: person.user_id, category: person.category ?? null }));
      throw e;
    }
  }
);

const slice = createSlice({
  name: "connections",
  initialState: adapter.getInitialState({ status: "idle", error: null, lastFetchedAt: 0 }),
  reducers: {
    optimisticCategory(state, a) {
      adapter.updateOne(state, { id: a.payload.userId, changes: { category: a.payload.category } });
    },
    invalidateConnections(state) { state.lastFetchedAt = 0; },
  },
  extraReducers: (b) => {
    b.addCase(fetchConnections.pending,   (s) => { s.status = "loading"; s.error = null; });
    b.addCase(fetchConnections.fulfilled, (s, a) => {
      adapter.setAll(s, a.payload); s.status = "idle"; s.lastFetchedAt = Date.now();
    });
    b.addCase(fetchConnections.rejected,  (s, a) => { s.status = "idle"; s.error = a.error.message; });
  },
});

export const { optimisticCategory, invalidateConnections } = slice.actions;
export const connectionsAdapter = adapter;
export default slice.reducer;