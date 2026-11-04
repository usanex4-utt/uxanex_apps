import { configureStore } from "@reduxjs/toolkit";
import auth from "./slices/authSlice";
import connections from "./slices/connectionsSlice";
import notifications from "./slices/notificationsSlice";
import reels from "./slices/reelsSlice";
import moments from "./slices/momentsSlice";

export const store = configureStore({
  reducer: { auth, connections, notifications, reels, moments },
});