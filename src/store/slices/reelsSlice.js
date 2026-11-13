
import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";

import { api } from "../../api/client";
import { EP } from "../../api/endpoints";

/* ─────────────────────────────────────
   CONFIG
───────────────────────────────────── */

const PAGE = 10;

const adapter = createEntityAdapter({
  selectId: (reel) => reel.id,
});

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */

const uniqueIds = (ids) => [...new Set(ids)];

const getReelId = (id) => {
  if (id === undefined || id === null) {
    return null;
  }

  return id;
};

const normalizeReel = (reel) => {
  if (!reel || reel.id === undefined || reel.id === null) {
    return null;
  }

  return reel;
};

/* ─────────────────────────────────────
   FETCH REELS FEED
───────────────────────────────────── */

export const fetchReelsFeed = createAsyncThunk(
  "reels/fetchFeed",

  async ({ reset = false } = {}, { getState }) => {
    const cursor = getState().reels.feed.cursor;

    const params = new URLSearchParams();

    params.append("limit", String(PAGE));

    if (!reset && cursor) {
      params.append("cursor", cursor);
    }

    const d = await api(
      `${EP.reelsFeed}?${params.toString()}`
    );

    const list = (d.reels || [])
      .map(normalizeReel)
      .filter(Boolean);

    return {
      list,
      cursor: d.next_cursor || null,
      reset,
    };
  },

  {
    condition: (_, { getState }) => {
      const feed = getState().reels.feed;

      // Prevent duplicate simultaneous requests.
      if (feed.status === "loading") {
        return false;
      }

      // Do not request another page when pagination is finished.
      // Initial/reset requests are still allowed.
      return true;
    },
  }
);

/* ─────────────────────────────────────
   FETCH SAVED REELS
───────────────────────────────────── */

export const fetchSavedReels = createAsyncThunk(
  "reels/fetchSaved",

  async () => {
    const d = await api(EP.reelsSaved);

    return (d.reels || [])
      .map((reel) => reel.id)
      .filter((id) => id !== undefined && id !== null);
  }
);

/* ─────────────────────────────────────
   TOGGLE REEL LIKE
───────────────────────────────────── */

export const toggleReelLike = createAsyncThunk(
  "reels/toggleLike",

  async ({ reel, on }, { dispatch, rejectWithValue }) => {
    const id = getReelId(reel?.id);

    if (id === null) {
      return rejectWithValue("Invalid reel ID");
    }

    const previous = {
      liked: !on,
      likeCount: reel.like_count,
      likesCount: reel.likes_count,
      rating: reel.rating,
    };

    // Optimistic update.
    dispatch(
      setLiked({
        id,
        on,
      })
    );

    dispatch(
      patchReel({
        id,
        fields: {
          is_liked: on,
          ...(typeof reel.like_count === "number"
            ? {
                like_count: Math.max(
                  0,
                  reel.like_count + (on ? 1 : -1)
                ),
              }
            : {}),
          ...(typeof reel.likes_count === "number"
            ? {
                likes_count: Math.max(
                  0,
                  reel.likes_count + (on ? 1 : -1)
                ),
              }
            : {}),
        },
      })
    );

    try {
      const d = on
        ? await api(EP.reelRating(id), {
            method: "POST",
            body: {
              rating: 3,
            },
          })
        : await api(EP.reelRating(id), {
            method: "DELETE",
          });

      return {
        id,
        counts: d,
        on,
      };
    } catch (error) {
      // Rollback on failure.
      dispatch(
        setLiked({
          id,
          on: previous.liked,
        })
      );

      dispatch(
        patchReel({
          id,
          fields: {
            is_liked: previous.liked,
            ...(previous.likeCount !== undefined
              ? { like_count: previous.likeCount }
              : {}),
            ...(previous.likesCount !== undefined
              ? { likes_count: previous.likesCount }
              : {}),
            ...(previous.rating !== undefined
              ? { rating: previous.rating }
              : {}),
          },
        })
      );

      return rejectWithValue(
        error.message || "Could not update like"
      );
    }
  }
);

/* ─────────────────────────────────────
   TOGGLE REEL SAVE
───────────────────────────────────── */

export const toggleReelSave = createAsyncThunk(
  "reels/toggleSave",

  async ({ reel, save }, { dispatch, rejectWithValue }) => {
    const id = getReelId(reel?.id);

    if (id === null) {
      return rejectWithValue("Invalid reel ID");
    }

    const previousSaveCount = reel.save_count;

    // Optimistic update.
    dispatch(
      setSaved({
        id,
        save,
      })
    );

    if (typeof previousSaveCount === "number") {
      dispatch(
        patchReel({
          id,
          fields: {
            save_count: Math.max(
              0,
              previousSaveCount + (save ? 1 : -1)
            ),
          },
        })
      );
    }

    try {
      const d = await api(EP.reelSave(id), {
        method: save ? "POST" : "DELETE",
      });

      return {
        id,
        save,
        save_count: d.save_count,
      };
    } catch (error) {
      // Rollback.
      dispatch(
        setSaved({
          id,
          save: !save,
        })
      );

      if (typeof previousSaveCount === "number") {
        dispatch(
          patchReel({
            id,
            fields: {
              save_count: previousSaveCount,
            },
          })
        );
      }

      return rejectWithValue(
        error.message || "Could not update saved reel"
      );
    }
  }
);

/* ─────────────────────────────────────
   INITIAL STATE
───────────────────────────────────── */

const initialState = {
  ...adapter.getInitialState(),

  feed: {
    ids: [],
    cursor: null,
    more: true,
    status: "idle",
    error: null,
    lastFetchedAt: 0,
  },

  likedById: {},

  savedById: {},

  followStates: {},
};

/* ─────────────────────────────────────
   SLICE
───────────────────────────────────── */

const slice = createSlice({
  name: "reels",

  initialState,

  reducers: {
    /* ───────── LIKE STATE ───────── */

    setLiked(state, action) {
      const { id, on } = action.payload;

      if (id === undefined || id === null) return;

      state.likedById[id] = Boolean(on);
    },

    /* ───────── SAVE STATE ───────── */

    setSaved(state, action) {
      const { id, save } = action.payload;

      if (id === undefined || id === null) return;

      state.savedById[id] = Boolean(save);
    },

    /* ───────── FOLLOW STATE ───────── */

    setFollowState(state, action) {
      const { userId, state: followState } = action.payload;

      if (userId === undefined || userId === null) return;

      state.followStates[userId] = followState;
    },

    /* ───────── PATCH REEL ───────── */

    patchReel(state, action) {
      const { id, fields } = action.payload;

      if (id === undefined || id === null) return;

      const reel = state.entities[id];

      if (reel && fields) {
        Object.assign(reel, fields);
      }
    },

    /* ───────── REMOVE REEL ───────── */

    removeFeedItem(state, action) {
      const id = action.payload;

      state.feed.ids = state.feed.ids.filter(
        (itemId) => itemId !== id
      );

      adapter.removeOne(state, id);

      delete state.likedById[id];
      delete state.savedById[id];
    },

    /* ───────── INVALIDATE FEED ───────── */

    invalidateFeed(state) {
      state.feed.lastFetchedAt = 0;
    },

    /* ───────── RESET FEED ───────── */

    resetReelsFeed(state) {
      state.feed.ids = [];
      state.feed.cursor = null;
      state.feed.more = true;
      state.feed.status = "idle";
      state.feed.error = null;
      state.feed.lastFetchedAt = 0;
    },

    /* ───────── INSERT NEW REEL ───────── */

    prependReelToFeed(state, action) {
      const reel = normalizeReel(action.payload);

      if (!reel) return;

      adapter.upsertOne(state, reel);

      state.feed.ids = uniqueIds([
        reel.id,
        ...state.feed.ids,
      ]);
    },

    /* ───────── APPEND REEL ───────── */

    appendReelToFeed(state, action) {
      const reel = normalizeReel(action.payload);

      if (!reel) return;

      adapter.upsertOne(state, reel);

      if (!state.feed.ids.includes(reel.id)) {
        state.feed.ids.push(reel.id);
      }
    },

    /* ───────── CLEAR REELS ───────── */

    clearReels(state) {
      adapter.removeAll(state);

      state.feed = {
        ids: [],
        cursor: null,
        more: true,
        status: "idle",
        error: null,
        lastFetchedAt: 0,
      };

      state.likedById = {};
      state.savedById = {};
      state.followStates = {};
    },
  },

  /* ─────────────────────────────────
     ASYNC REDUCERS
  ───────────────────────────────── */

  extraReducers: (builder) => {
    /* ───────── FETCH FEED PENDING ───────── */

    builder.addCase(
      fetchReelsFeed.pending,
      (state) => {
        state.feed.status = "loading";
        state.feed.error = null;
      }
    );

    /* ───────── FETCH FEED SUCCESS ───────── */

    builder.addCase(
      fetchReelsFeed.fulfilled,
      (state, action) => {
        const {
          list,
          cursor,
          reset,
        } = action.payload;

        // Insert/update entities.
        adapter.upsertMany(state, list);

        const incomingIds = list.map(
          (reel) => reel.id
        );

        if (reset) {
          state.feed.ids = uniqueIds(incomingIds);
        } else {
          state.feed.ids = uniqueIds([
            ...state.feed.ids,
            ...incomingIds,
          ]);
        }

        state.feed.cursor = cursor;

        state.feed.more =
          list.length >= PAGE && Boolean(cursor);

        state.feed.status = "idle";

        state.feed.error = null;

        state.feed.lastFetchedAt = Date.now();
      }
    );

    /* ───────── FETCH FEED FAILED ───────── */

    builder.addCase(
      fetchReelsFeed.rejected,
      (state, action) => {
        state.feed.status = "idle";

        if (action.meta.condition) return;

        state.feed.error =
          action.error.message || "Failed to load reels";
      }
    );

    /* ───────── FETCH SAVED SUCCESS ───────── */

    builder.addCase(
      fetchSavedReels.fulfilled,
      (state, action) => {
        const saved = {};

        action.payload.forEach((id) => {
          saved[id] = true;
        });

        state.savedById = saved;
      }
    );

    /* ───────── LIKE SUCCESS ───────── */

    builder.addCase(
      toggleReelLike.fulfilled,
      (state, action) => {
        const {
          id,
          counts,
          on,
        } = action.payload;

        if (counts && typeof counts === "object") {
          const reel = state.entities[id];

          if (reel) {
            Object.assign(reel, counts);
          }
        }

        state.likedById[id] = on;
      }
    );

    /* ───────── LIKE FAILED ───────── */

    builder.addCase(
      toggleReelLike.rejected,
      (state, action) => {
        // Optimistic rollback is handled inside the thunk.
        if (action.meta.condition) return;
      }
    );

    /* ───────── SAVE SUCCESS ───────── */

    builder.addCase(
      toggleReelSave.fulfilled,
      (state, action) => {
        const {
          id,
          save,
          save_count,
        } = action.payload;

        state.savedById[id] = save;

        const reel = state.entities[id];

        if (
          reel &&
          typeof save_count === "number"
        ) {
          reel.save_count = save_count;
        }
      }
    );

    /* ───────── SAVE FAILED ───────── */

    builder.addCase(
      toggleReelSave.rejected,
      (state, action) => {
        // Optimistic rollback is handled inside the thunk.
        if (action.meta.condition) return;
      }
    );
  },
});

/* ─────────────────────────────────────
   EXPORT ACTIONS
───────────────────────────────────── */

export const {
  setLiked,
  setSaved,
  setFollowState,
  patchReel,
  removeFeedItem,
  invalidateFeed,
  resetReelsFeed,
  prependReelToFeed,
  appendReelToFeed,
  clearReels,
} = slice.actions;

/* ─────────────────────────────────────
   SELECTORS
───────────────────────────────────── */

export const reelsAdapter = adapter;

export const reelsSelectors = adapter.getSelectors(
  (state) => state.reels
);

export const selectReelById = (state, id) =>
  state.reels.entities[id];

export const selectFeedReels = (state) =>
  state.reels.feed.ids
    .map((id) => state.reels.entities[id])
    .filter(Boolean);

export const selectFeedIds = (state) =>
  state.reels.feed.ids;

export const selectFeedStatus = (state) =>
  state.reels.feed.status;

export const selectFeedHasMore = (state) =>
  state.reels.feed.more;

export const selectFeedCursor = (state) =>
  state.reels.feed.cursor;

export const selectLiked = (state, id) =>
  Boolean(state.reels.likedById[id]);

export const selectSaved = (state, id) =>
  Boolean(state.reels.savedById[id]);

/* ─────────────────────────────────────
   REDUCER
───────────────────────────────────── */

export default slice.reducer;
