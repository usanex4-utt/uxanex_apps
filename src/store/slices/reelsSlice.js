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
  if (id === undefined || id === null) return null;
  return id;
};

const normalizeReel = (reel) => {
  if (!reel || reel.id === undefined || reel.id === null) return null;
  return reel;
};

/**
 * Hydrate per-reel UI state (liked / saved / follow) from the live API payload.
 * Supports both `is_liked` (current API) and `liked` (legacy) shapes.
 */
const hydrateReelState = (state, reels) => {
  reels.forEach((r) => {
    if (!r || r.id === undefined || r.id === null) return;

    const liked = r.is_liked ?? r.liked;
    if (typeof liked !== "undefined") {
      state.likedById[r.id] = Boolean(liked);
    }

    const saved = r.is_saved ?? r.saved;
    if (typeof saved !== "undefined") {
      state.savedById[r.id] = Boolean(saved);
    }

    const creator = r.creator;
    const uid = creator?.user_id ?? creator?.id;
    if (uid !== undefined && uid !== null) {
      const following = creator.is_following ?? creator.following;
      if (
       typeof following !== "undefined" &&
       typeof state.followStates[uid] === "undefined"
     ) {
       state.followStates[uid] = following ? "following" : "none";
      }
    }
  });
};

/* ─────────────────────────────────────
   FETCH REELS FEED
───────────────────────────────────── */

export const fetchReelsFeed = createAsyncThunk(
  "reels/fetchFeed",
  async ({ reset = false } = {}, { getState }) => {
    const feed = getState().reels.feed;

    const cursor = reset ? null : feed.cursor;
    const repostOffset = reset ? 0 : (feed.repostOffset || 0);

    const params = new URLSearchParams();
    params.append("limit", String(PAGE));

    if (!reset && cursor !== null && cursor !== undefined) {
      params.append("cursor", String(cursor));
    }

    const normalPromise =
      reset || cursor !== null && cursor !== undefined
        ? api(`${EP.reelsFeed}?${params.toString()}`)
        : Promise.resolve({ reels: [], next_cursor: null });

    const repostPromise =
      reset || feed.repostMore !== false
        ? api(
            `${EP.reelsFeedReposts}?limit=${PAGE}&offset=${repostOffset}`
          ).catch(() => ({ reposts: [] }))
        : Promise.resolve({ reposts: [] });

    const [normalData, repostData] = await Promise.all([
      normalPromise,
      repostPromise,
    ]);

    const normalList = (normalData.reels || [])
      .map(normalizeReel)
      .filter(Boolean);

    const repostList = (repostData.reposts || [])
      .map(normalizeReel)
      .filter(Boolean)
      .map((reel) => ({
        ...reel,
        is_repost: true,
      }));

    const merged = [];
    const seen = new Map();

    const addReel = (reel) => {
      const key = String(reel.id);

      if (seen.has(key)) {
        const index = seen.get(key);
        merged[index] = {
          ...merged[index],
          ...reel,
          is_repost: true,
        };
        return;
      }

      seen.set(key, merged.length);
      merged.push(reel);
    };

    for (
      let i = 0;
      i < Math.max(normalList.length, repostList.length);
      i++
    ) {
      if (normalList[i]) addReel(normalList[i]);
      if (repostList[i]) addReel(repostList[i]);
    }

    const nextCursor = normalData.next_cursor ?? null;
    const nextRepostOffset =
      repostOffset + (repostData.reposts || []).length;

    return {
      list: merged,
      cursor: nextCursor,
      normalMore: nextCursor !== null,
      repostOffset: nextRepostOffset,
      repostMore: (repostData.reposts || []).length >= PAGE,
      reset,
    };
  },
  {
    condition: ({ reset = false } = {}, { getState }) => {
      const feed = getState().reels.feed;

      if (feed.status === "loading") return false;
      if (!reset && !feed.more) return false;

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
  async ({ reel, on } = {}, { dispatch, getState, rejectWithValue }) => {
    const id = getReelId(reel?.id);
    if (id === null) return rejectWithValue("Invalid reel ID");

    const state = getState().reels;
    const entity = state.entities[id];
    const source = entity ?? reel ?? {};

    const currentlyLiked = Boolean(state.likedById[id]);
    const nextOn = typeof on === "boolean" ? on : !currentlyLiked;

    const previous = {
      liked: currentlyLiked,
      likeCount: source.like_count,
      likesCount: source.likes_count,
      rating: source.rating,
    };

    // ── Optimistic update ──
    dispatch(setLiked({ id, on: nextOn }));
    dispatch(
      patchReel({
        id,
        fields: {
          is_liked: nextOn,
          ...(typeof source.like_count === "number"
            ? {
                like_count: Math.max(
                  0,
                  source.like_count + (nextOn ? 1 : -1)
                ),
              }
            : {}),
          ...(typeof source.likes_count === "number"
            ? {
                likes_count: Math.max(
                  0,
                  source.likes_count + (nextOn ? 1 : -1)
                ),
              }
            : {}),
        },
      })
    );

    try {
      const d = nextOn
        ? await api(EP.reelLike(id), { method: "POST" })
        : await api(EP.reelLike(id), { method: "DELETE" });

      return { id, counts: d, on: nextOn };
    } catch (error) {
      // ── Rollback ──
      dispatch(setLiked({ id, on: previous.liked }));
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
      return rejectWithValue(error.message || "Could not update like");
    }
  }
);

/* ─────────────────────────────────────
   TOGGLE REEL SAVE
───────────────────────────────────── */

export const toggleReelSave = createAsyncThunk(
  "reels/toggleSave",
  async ({ reel, save } = {}, { dispatch, getState, rejectWithValue }) => {
    const id = getReelId(reel?.id);
    if (id === null) return rejectWithValue("Invalid reel ID");

    const state = getState().reels;
    const entity = state.entities[id];
    const source = entity ?? reel ?? {};

    const currentlySaved = Boolean(state.savedById[id]);
    const nextSave = typeof save === "boolean" ? save : !currentlySaved;

    const previousSaveCount = source.save_count;

    // ── Optimistic update ──
    dispatch(setSaved({ id, save: nextSave }));

    if (typeof previousSaveCount === "number") {
      dispatch(
        patchReel({
          id,
          fields: {
            save_count: Math.max(
              0,
              previousSaveCount + (nextSave ? 1 : -1)
            ),
          },
        })
      );
    }

    try {
      const d = await api(EP.reelSave(id), {
        method: nextSave ? "POST" : "DELETE",
      });

      return { id, save: nextSave, save_count: d.save_count };
    } catch (error) {
      // ── Rollback ──
      dispatch(setSaved({ id, save: !nextSave }));
      if (typeof previousSaveCount === "number") {
        dispatch(
          patchReel({
            id,
            fields: { save_count: previousSaveCount },
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
   TOGGLE FOLLOW (CREATOR)
───────────────────────────────────── */

export const toggleReelFollow = createAsyncThunk(
  "reels/toggleFollow",
  async ({ userId, on } = {}, { dispatch, getState, rejectWithValue }) => {
    if (userId === undefined || userId === null) {
      return rejectWithValue("Invalid user ID");
    }

    const state = getState().reels;
    const prev = state.followStates[userId] ?? "none";
    const currentlyFollowing = prev === "following";
    const nextOn = typeof on === "boolean" ? on : !currentlyFollowing;
    const nextState = nextOn ? "following" : "none";

    // ── Optimistic update ──
    dispatch(setFollowState({ userId, state: nextState }));
    dispatch(patchCreatorFollow({ userId, isFollowing: nextOn }));

    try {
      // TODO: swap for EP.userFollow(userId) if available
      const d = await api(`/api/users/${userId}/follow`, {
        method: nextOn ? "POST" : "DELETE",
      });
      return { userId, state: nextState, data: d };
    } catch (error) {
      // ── Rollback ──
      dispatch(setFollowState({ userId, state: prev }));
      dispatch(
        patchCreatorFollow({ userId, isFollowing: currentlyFollowing })
      );
      return rejectWithValue(
        error.message || "Could not update follow"
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

    /**
     * Sync `creator.is_following` on every reel from that creator
     * so UI driven by entity data stays in sync with `followStates`.
     */
    patchCreatorFollow(state, action) {
      const { userId, isFollowing } = action.payload;
      if (userId === undefined || userId === null) return;

      Object.values(state.entities).forEach((reel) => {
        if (reel?.creator && reel.creator.user_id === userId) {
          reel.creator.is_following = Boolean(isFollowing);
        }
      });
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

      state.feed.ids = state.feed.ids.filter((itemId) => itemId !== id);
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
      state.feed.ids = uniqueIds([reel.id, ...state.feed.ids]);
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

    builder.addCase(fetchReelsFeed.pending, (state) => {
      state.feed.status = "loading";
      state.feed.error = null;
    });

    /* ───────── FETCH FEED SUCCESS ───────── */

    builder.addCase(fetchReelsFeed.fulfilled, (state, action) => {
      const { list, cursor, reset } = action.payload;

      adapter.upsertMany(state, list);

      const incomingIds = list.map((reel) => reel.id);

      if (reset) {
        state.feed.ids = uniqueIds(incomingIds);
      } else {
        state.feed.ids = uniqueIds([
          ...state.feed.ids,
          ...incomingIds,
        ]);
      }

      // 👇 Hydrate like / save / follow maps from live API state
      hydrateReelState(state, list);

      state.feed.cursor = cursor;
      state.feed.more = list.length >= PAGE && Boolean(cursor);
      state.feed.status = "idle";
      state.feed.error = null;
      state.feed.lastFetchedAt = Date.now();
    });

    /* ───────── FETCH FEED FAILED ───────── */

    builder.addCase(fetchReelsFeed.rejected, (state, action) => {
      // A condition rejection means another request is already in
      // flight — don't clobber its loading state.
      if (action.meta.condition) return;

      state.feed.status = "idle";
      state.feed.error =
        action.error.message || "Failed to load reels";
    });

    /* ───────── FETCH SAVED SUCCESS ───────── */

    builder.addCase(fetchSavedReels.fulfilled, (state, action) => {
      const saved = {};
      action.payload.forEach((id) => {
        saved[id] = true;
      });
      state.savedById = saved;
    });

    /* ───────── LIKE SUCCESS ───────── */

    builder.addCase(toggleReelLike.fulfilled, (state, action) => {
      const { id, counts, on } = action.payload;

      if (counts && typeof counts === "object") {
        const reel = state.entities[id];
        if (reel) Object.assign(reel, counts);
      }

      state.likedById[id] = on;
    });

    /* ───────── LIKE FAILED ───────── */

    builder.addCase(toggleReelLike.rejected, (state, action) => {
      // Optimistic rollback is handled inside the thunk.
      if (action.meta.condition) return;
    });

    /* ───────── SAVE SUCCESS ───────── */

    builder.addCase(toggleReelSave.fulfilled, (state, action) => {
      const { id, save, save_count } = action.payload;

      state.savedById[id] = save;

      const reel = state.entities[id];
      if (reel && typeof save_count === "number") {
        reel.save_count = save_count;
      }
    });

    /* ───────── SAVE FAILED ───────── */

    builder.addCase(toggleReelSave.rejected, (state, action) => {
      // Optimistic rollback is handled inside the thunk.
      if (action.meta.condition) return;
    });

    /* ───────── FOLLOW SUCCESS ───────── */

    builder.addCase(toggleReelFollow.fulfilled, (state, action) => {
      const { userId, state: followState } = action.payload;
      state.followStates[userId] = followState;
    });

    /* ───────── FOLLOW FAILED ───────── */

    builder.addCase(toggleReelFollow.rejected, (state, action) => {
      // Optimistic rollback is handled inside the thunk.
      if (action.meta.condition) return;
    });
  },
});

/* ─────────────────────────────────────
   EXPORT ACTIONS
───────────────────────────────────── */

export const {
  setLiked,
  setSaved,
  setFollowState,
  patchCreatorFollow,
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

export const selectFeedIds = (state) => state.reels.feed.ids;

export const selectFeedStatus = (state) => state.reels.feed.status;

export const selectFeedHasMore = (state) => state.reels.feed.more;

export const selectFeedCursor = (state) => state.reels.feed.cursor;

export const selectFeedError = (state) => state.reels.feed.error;

export const selectLiked = (state, id) =>
  Boolean(state.reels.likedById[id]);

export const selectSaved = (state, id) =>
  Boolean(state.reels.savedById[id]);

export const selectFollowing = (state, userId) =>
  state.reels.followStates[userId] === "following";

/* ─────────────────────────────────────
   REDUCER
───────────────────────────────────── */

export default slice.reducer;
