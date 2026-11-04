import { createSelector } from "@reduxjs/toolkit";
import { connectionsAdapter } from "./slices/connectionsSlice";
import { reelsAdapter } from "./slices/reelsSlice";
import { notificationsActivityAdapter } from "./slices/notificationsSlice";

const connSel = connectionsAdapter.getSelectors((s) => s.connections);
export const selectAllConnections  = connSel.selectAll;
export const selectConnectionById  = connSel.selectById;

export const selectConnectionCounts = createSelector([selectAllConnections], (list) => {
  const c = { all: list.length, friend: 0, family: 0 };
  list.forEach((p) => { if (p.category && c[p.category] !== undefined) c[p.category]++; });
  return c;
});

export const selectRequests = (s) => s.notifications.requests;
export const selectActivity = notificationsActivityAdapter.getSelectors(
  (s) => s.notifications.activity
).selectAll;
export const selectBusyIds = (s) => s.notifications.busyIds;

export const selectUnreadCount = createSelector(
  [selectRequests, selectActivity],
  (reqs, act) => reqs.length + act.filter((n) => !n.is_read).length
);

export const selectReelsState = (s) => s.reels;
export const selectFeedReels = createSelector([selectReelsState], (s) =>
  s.feed.ids.map((id) => s.entities[id]).filter(Boolean)
);
export const selectLikedById    = (s) => s.reels.likedById;
export const selectSavedById    = (s) => s.reels.savedById;
export const selectFollowStates = (s) => s.reels.followStates;

export const selectMomentGroups = (s) => s.moments.groups;