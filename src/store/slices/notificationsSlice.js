import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";
import { normType } from "../../components/notifications/notificationUtils";

const actAdapter = createEntityAdapter({ selectId: (n) => n.id });

export const fetchNotifications = createAsyncThunk("notifications/fetch", async () => {
  const [r, n] = await Promise.all([api(EP.connectionRequests), api(EP.connectionNotifications)]);
  const pending = r.requests || [];
  const pendingIds = new Set(pending.map((x) => x.request_id));
  const activity = (n.notifications || []).filter((x) => {
    const isReq = normType(x) === "connection_request";
    return !(isReq && pendingIds.has(x.request_id));
  });
  return { requests: pending, activity };
});

export const respondToRequest = createAsyncThunk(
  "notifications/respond",
  async ({ request, accept }) => {
    await api(
      accept ? EP.connectionAccept(request.request_id) : EP.connectionReject(request.request_id),
      { method: "POST" }
    );
    return { requestId: request.request_id, accepted: accept };
  }
);

export const markNotificationRead = createAsyncThunk("notifications/markRead", async (id) => {
  await api(EP.connectionNotificationRead, { method: "POST", body: { notification_id: id } });
  return id;
});

export const markAllRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { getState }) => {
    const unread = Object.values(getState().notifications.activity.entities)
      .filter((n) => n && !n.is_read);
    await Promise.all(
      unread.map((n) =>
        api(EP.connectionNotificationRead, { method: "POST", body: { notification_id: n.id } }).catch(() => {})
      )
    );
    return unread.map((n) => n.id);
  }
);

const slice = createSlice({
  name: "notifications",
  initialState: {
    requests: [],
    activity: actAdapter.getInitialState(),
    status: "idle", error: null,
    busyIds: {},
    lastFetchedAt: 0,
  },
  reducers: {
    optimisticMarkRead(state, a) {
      const n = state.activity.entities[a.payload];
      if (n) n.is_read = true;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchNotifications.pending, (s) => { s.status = "loading"; });
    b.addCase(fetchNotifications.fulfilled, (s, a) => {
      s.requests = a.payload.requests;
      actAdapter.setAll(s.activity, a.payload.activity);
      s.status = "idle"; s.lastFetchedAt = Date.now();
    });
    b.addCase(fetchNotifications.rejected, (s, a) => { s.status = "idle"; s.error = a.error.message; });

    b.addCase(respondToRequest.pending, (s, a) => { s.busyIds[a.meta.arg.request.request_id] = true; });
    b.addCase(respondToRequest.fulfilled, (s, a) => {
      delete s.busyIds[a.payload.requestId];
      s.requests = s.requests.filter((r) => r.request_id !== a.payload.requestId);
    });
    b.addCase(respondToRequest.rejected, (s, a) => {
      delete s.busyIds[a.meta.arg.request.request_id];
    });

    b.addCase(markNotificationRead.fulfilled, (s, a) => {
      const n = s.activity.entities[a.payload];
      if (n) n.is_read = true;
    });
    b.addCase(markAllRead.fulfilled, (s, a) => {
      a.payload.forEach((id) => { const n = s.activity.entities[id]; if (n) n.is_read = true; });
    });
  },
});

export const { optimisticMarkRead: markReadOptimistic } = slice.actions;
export const notificationsActivityAdapter = actAdapter;
export default slice.reducer;