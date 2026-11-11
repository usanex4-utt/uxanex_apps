import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";

const PAGE = 20;

const adapter = createEntityAdapter({
  selectId: (c) => c.user_id,
  sortComparer: (a, b) => (a.name || a.username || "").localeCompare(b.name || b.username || ""),
});

/**
 * fetchConnections — supports pagination.
 *   dispatch(fetchConnections())                     → first page (refresh)
 *   dispatch(fetchConnections({ cursor: "..." }))    → next page
 *   dispatch(fetchConnections({ reset: true }))      → force reload page 1
 */
export const fetchConnections = createAsyncThunk(
  "connections/fetch",
  async ({ cursor, reset = false } = {}, { getState }) => {
    const state = getState().connections;

    // Skip if we already loaded very recently and there's nothing to page
    if (!reset && !cursor && state.lastFetchedAt && Date.now() - state.lastFetchedAt < 30_000) {
      return { list: [], cursor: state.cursor, reset, skipped: true };
    }

    const params = new URLSearchParams();
    params.set("limit", String(PAGE));
    if (!reset && cursor) params.set("cursor", cursor);

    const d = await api(`${EP.connections}?${params.toString()}`);
    const list = d.connections || d.users || [];
    return {
      list,
      cursor: d.next_cursor ?? null,
      hasMore: d.has_more ?? (list.length >= PAGE && !!d.next_cursor),
      reset,
      skipped: false,
    };
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
  initialState: adapter.getInitialState({
    status: "idle",
    error: null,
    lastFetchedAt: 0,
    cursor: null,
    hasMore: true,
    loadingMore: false,
  }),
  reducers: {
    optimisticCategory(state, a) {
      adapter.updateOne(state, { id: a.payload.userId, changes: { category: a.payload.category } });
    },
    invalidateConnections(state) {
      state.lastFetchedAt = 0;
      state.cursor = null;
      state.hasMore = true;
    },
    resetConnections(state) {
      adapter.removeAll(state);
      state.cursor = null;
      state.hasMore = true;
      state.lastFetchedAt = 0;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchConnections.pending, (s, a) => {
      const { cursor, reset } = a.meta.arg || {};
      if (cursor && !reset) s.loadingMore = true;
      else { s.status = "loading"; s.error = null; }
    });
    b.addCase(fetchConnections.fulfilled, (s, a) => {
      const { list, cursor, hasMore, reset, skipped } = a.payload;

      if (skipped) { s.status = "idle"; return; }

      if (reset) {
        adapter.setAll(s, list);
      } else if (list.length) {
        adapter.upsertMany(s, list);
      }

      s.cursor = cursor;
      s.hasMore = hasMore;
      s.status = "idle";
      s.loadingMore = false;
      if (reset) s.lastFetchedAt = Date.now();
    });
    b.addCase(fetchConnections.rejected, (s, a) => {
      s.status = "idle";
      s.loadingMore = false;
      s.error = a.error.message;
    });
  },
});

export const { optimisticCategory, invalidateConnections, resetConnections } = slice.actions;
export const connectionsAdapter = adapter;
export default slice.reducer;