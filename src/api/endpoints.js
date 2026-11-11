// Every path below was taken from the real FastAPI backend (backend/routes/*.py).
// Nothing here is a guess. Path helpers take the PUBLIC user_id (e.g. "UN123456")
// unless noted.
export const EP = {
  // ── auth (routes/auth.py) ──────────────────────────────────
  login:              "/api/auth/login",
  logout:             "/api/auth/logout",
  me:                 "/api/auth/me",
  registerSendOtp:    "/api/auth/register/send-otp",
  registerVerify:     "/api/auth/register/verify",
  forgotSendOtp:      "/api/auth/forgot-password/send-otp",
  forgotReset:        "/api/auth/forgot-password/reset",

  // ── search (routes/search.py) ──────────────────────────────
  searchPeople:       "/api/search/people",

  // ── connections (routes/connections.py) ────────────────────
  connections:              "/api/connections",
  connectionRequest:        "/api/connections/request",
  connectionRequests:       "/api/connections/requests",
  connectionCancel:         "/api/connections/request/cancel",  
  connectionAccept:         (requestId) => `/api/connections/request/${requestId}/accept`,
  connectionReject:         (requestId) => `/api/connections/request/${requestId}/reject`,
  connectionNotifications:  "/api/connections/notifications",
  connectionNotificationRead: "/api/connections/notifications/read",
  connectionCategory:       "/api/connections/category",
  connectionCategoryRemove: (id) => `/api/connections/category/${id}`,
  follow:                   "/api/connections/follow",
  unfollow:                 "/api/connections/unfollow",
  followStatus:             (id) => `/api/connections/follow-status/${id}`,

  // ── profile (routes/profile.py) ────────────────────────────
  myProfile:          "/api/profile/me",
  myPhoto:            "/api/profile/me/photo",
  profile:            (id) => `/api/profile/${id}`,

  // ── reels (routes/reels.py) ────────────────────────────────
  reelsFeed:          "/api/reels/feed",
  reelsMine:          "/api/reels/me/list",
  reelsSaved:         "/api/reels/me/saved",
  reelsOfUser:        (id) => `/api/reels/user/${id}/list`,
  reelUpload:         "/api/reels/upload",
  reelWatch:          (id) => `/api/reels/${id}/watch`,
  reelRating:         (id) => `/api/reels/${id}/rating`,
  reelStatus:         (id) => `/api/reels/${id}/status`,
  reelSave:           (id) => `/api/reels/${id}/save`,
  reelShare:          (id) => `/api/reels/${id}/share`,
  reelComments:       (id) => `/api/reels/${id}/comments`,
  reelComment:        (id, cid) => `/api/reels/${id}/comments/${cid}`,
  reelReport:         (id) => `/api/reels/${id}/report`,
  reelNotInterested:  (id) => `/api/reels/${id}/not-interested`,
  reelDelete:         (id) => `/api/reels/${id}`,

  // ── private chat (routes/chat.py) ──────────────────────────
  chatHistory:        (id) => `/api/chat/${id}`,
  chatSend:           "/api/chat/send",
  chatRead:           (id) => `/api/chat/${id}/read`,
  chatDelete:         (messageId) => `/api/chat/message/${messageId}/delete`,
  chatWs:             (id) => `/api/chat/ws/${id}`,

  // ── couple chat (routes/couple_realtime.py) ────────────────
  coupleWs:           (id) => `/ws/couple/${id}`,

  // ── NEXA AI (routes/ai_assistant.py) ───────────────────────
  nexaChat:           "/api/ai-assistant/chat",
  nexaStatus:         "/api/ai-assistant/status",

  userFollowers:      (id) => `/api/users/${id}/followers`,
  userFollowing:      (id) => `/api/users/${id}/following`,
};