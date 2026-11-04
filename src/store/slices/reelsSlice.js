import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";

const PAGE = 10;
const adapter = createEntityAdapter({ selectId: (r) => r.id });

export const fetchReelsFeed = createAsyncThunk(
  "reels/fetchFeed",
  async ({ reset }, { getState }) => {
    const { cursor } = getState().reels.feed;
    const q = `?limit=${PAGE}${!reset && cursor ? `&cursor=${cursor}` : ""}`;
    const d = await api(EP.reelsFeed + q);
    return { list: d.reels || [], cursor: d.next_cursor || null, reset };
  }
);

export const fetchSavedReels = createAsyncThunk("reels/fetchSaved", async () => {
  const d = await api(EP.reelsSaved);
  return (d.reels || []).map((r) => r.id);
});

export const toggleReelLike = createAsyncThunk(
  "reels/toggleLike",
  async ({ reel, on }, { dispatch }) => {
    dispatch(setLiked({ id: reel.id, on }));
    try {
      const d = on
        ? await api(EP.reelRating(reel.id), { method: "POST", body: { rating: 3 } })
        : await api(EP.reelRating(reel.id), { method: "DELETE" });
      return { id: reel.id, counts: d };
    } catch (e) {
      dispatch(setLiked({ id: reel.id, on: !on }));
      throw e;
    }
  }
);

export const toggleReelSave = createAsyncThunk(
  "reels/toggleSave",
  async ({ reel, save }, { dispatch }) => {
    dispatch(setSaved({ id: reel.id, save }));
    try {
      const d = await api(EP.reelSave(reel.id), { method: save ? "POST" : "DELETE" });
      return { id: reel.id, save_count: d.save_count };
    } catch (e) {
      dispatch(setSaved({ id: reel.id, save: !save }));
      throw e;
    }
  }
);

const slice = createSlice({
  name: "reels",
  initialState: {
    ...adapter.getInitialState(),
    feed: { ids: [], cursor: null, more: true, status: "idle", lastFetchedAt: 0 },
    likedById: {},
    savedById: {},
    followStates: {},
  },
  reducers: {
    setLiked(state, a)   { state.likedById[a.payload.id] = a.payload.on; },
    setSaved(state, a)   { state.savedById[a.payload.id] = a.payload.save; },
    setFollowState(state, a) { state.followStates[a.payload.userId] = a.payload.state; },
    patchReel(state, a) {
      const r = state.entities[a.payload.id];
      if (r) Object.assign(r, a.payload.fields);
    },
    removeFeedItem(state, a) {
      state.feed.ids = state.feed.ids.filter((id) => id !== a.payload);
      delete state.entities[a.payload];
    },
    invalidateFeed(state) { state.feed.lastFetchedAt = 0; },
  },
  extraReducers: (b) => {
    b.addCase(fetchReelsFeed.pending, (s) => { s.feed.status = "loading"; });
    b.addCase(fetchReelsFeed.fulfilled, (s, a) => {
      const { list, cursor, reset } = a.payload;
      adapter.upsertMany(s, list);
      if (reset) s.feed.ids = list.map((r) => r.id);
      else s.feed.ids = [...s.feed.ids, ...list.map((r) => r.id).filter((id) => !s.feed.ids.includes(id))];
      s.feed.cursor = cursor;
      s.feed.more = list.length >= PAGE && !!cursor;
      s.feed.status = "idle"; s.feed.lastFetchedAt = Date.now();
    });
    b.addCase(fetchReelsFeed.rejected, (s) => { s.feed.status = "idle"; });
    b.addCase(fetchSavedReels.fulfilled, (s, a) => {
      const m = {}; a.payload.forEach((id) => { m[id] = true; }); s.savedById = m;
    });
    b.addCase(toggleReelLike.fulfilled, (s, a) => {
      const r = s.entities[a.payload.id];
      if (r) Object.assign(r, a.payload.counts);
    });
    b.addCase(toggleReelSave.fulfilled, (s, a) => {
      const r = s.entities[a.payload.id];
      if (r && typeof a.payload.save_count === "number") r.save_count = a.payload.save_count;
    });
  },
});

export const {
  setLiked, setSaved, setFollowState, patchReel, removeFeedItem, invalidateFeed,
} = slice.actions;
export const reelsAdapter = adapter;
export default slice.reducer;