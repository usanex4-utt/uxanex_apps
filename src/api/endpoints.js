
// =========================================================

export const EP = {
  // ── auth (backend/routes/auth.py) ─────────────────────────
  login:                     "/api/auth/login",                    // POST { identifier, password }
  logout:                    "/api/auth/logout",                   // POST
  me:                        "/api/auth/me",                       // GET
  registerSendOtp:           "/api/auth/register/send-otp",        // POST { name, mobile, password }
  registerVerify:            "/api/auth/register/verify",          // POST { name, mobile, password, otp }
  forgotSendOtp:             "/api/auth/forgot-password/send-otp", // POST { identifier }
  forgotReset:               "/api/auth/forgot-password/reset",    // POST { identifier, otp, new_password, confirm_password }

  // ── search (backend/routes/search.py) ─────────────────────
  searchPeople:              "/api/search/people",                 // GET ?q=&...

  // ── connections (backend/routes/connections.py) ───────────
  connections:               "/api/connections",                   // GET  → list of connected users
  connectionRequest:         "/api/connections/request",           // POST { user_id }        ← Connect button
  connectionRequests:        "/api/connections/requests",          // GET  → pending incoming
  connectionCancel:          "/api/connections/request/cancel",    // POST { user_id }
  connectionAccept:   (rid)  => `/api/connections/request/${rid}/accept`,  // POST
  connectionReject:   (rid)  => `/api/connections/request/${rid}/reject`,  // POST
  connectionNotifications:   "/api/connections/notifications",     // GET
  connectionNotificationRead:"/api/connections/notifications/read",// POST { notification_id }
  connectionCategory:        "/api/connections/category",          // POST { connected_user_id, category }
  connectionCategoryRemove: (id) => `/api/connections/category/${id}`, // DELETE
  follow:                    "/api/connections/follow",            // POST { user_id }
  unfollow:                  "/api/connections/unfollow",          // POST { user_id }
  followStatus:       (id)   => `/api/connections/follow-status/${id}`, // GET

  // ── profile (backend/routes/profile.py) ───────────────────
  myProfile:                 "/api/profile/me",                    // GET | PUT (update body)
  reelPreferences:           "/api/profile/me/reel-preferences", // GET | PATCH
  myPhoto:                   "/api/profile/me/photo",              // POST (multipart "photo")
  profilePrivacy:            "/api/profile/me/privacy",            // PUT { is_private }  ⚠ backend must expose PUT
  profile:            (id)   => `/api/profile/${id}`,              // GET public profile by user_id

  // ── users (backend/routes/users.py) ───────────────────────
  userFollowers:      (id)   => `/api/users/${id}/followers`,      // GET
  userFollowing:      (id)   => `/api/users/${id}/following`,      // GET

  // ── reels (backend/routes/reels.py) ───────────────────────
  reelsFeed:                 "/api/reels/feed", // GET ?limit=&cursor=
  reelsFeedReposts:          "/api/reels/feed/reposts",
  reelsMine:                 "/api/reels/me/list",                 // GET
  reelsSaved:                "/api/reels/me/saved",                // GET
  reelsOfUser:        (id)   => `/api/reels/user/${id}/list`,      // GET
  reelsReposts:       (id)   => `/api/reels/user/${id}/reposts`,
  reelUpload:                "/api/reels/upload",                  // POST multipart "video"
  reelWatch:          (id)   => `/api/reels/${id}/watch`,          // POST { watch_time, watch_percentage, completed, ... }

  // reel like — same URL, different HTTP methods
  reelLike:           (id)   => `/api/reels/${id}/like`,           // POST   → like
  reelUnlike:         (id)   => `/api/reels/${id}/like`,           // DELETE → unlike
  reelLiked:          (id)   => `/api/reels/${id}/liked`,          // GET    → { liked, likes_count }

  // reel save — same URL, different HTTP methods
  reelSave:           (id)   => `/api/reels/${id}/save`,           // POST   → save
  reelUnsave:         (id)   => `/api/reels/${id}/save`,           // DELETE → unsave
  reelSavedStatus:    (id)   => `/api/reels/${id}/saved`,          // GET    → { saved }

  reelShare:          (id)   => `/api/reels/${id}/share`,  // POST { share_type? }
  reelRepost:         (id)   => `/api/reels/${id}/repost`,
  reelDownload:       (id)   => `/api/reels/${id}/download`,       // POST → { download_url (watermarked), filename, download_count }
  reelDownloadPreference: (id) => `/api/reels/${id}/download-preference`,

  // interested / not-interested (toggle — same URLs, POST only)
  reelInterested:     (id)   => `/api/reels/${id}/interested`,     // POST
  reelNotInterested:  (id)   => `/api/reels/${id}/not-interested`, // POST

  // comments
  reelComments:       (id)   => `/api/reels/${id}/comments`,       // GET | POST { content, parent_comment_id? }
  reelCommentDelete:  (rid, cid) => `/api/reels/${rid}/comments/${cid}`, // DELETE
  commentLike:        (cid)  => `/api/reels/comments/${cid}/like`, // POST  → toggle comment like

  reelReport:         (id)   => `/api/reels/${id}/report`,         // POST { reason, description? }
  reelStatus:         (id)   => `/api/reels/${id}/status`,         // GET { liked, saved, interested, ... }
  reelAIStatus:       (id)   => `/api/reels/${id}/ai-status`,      // GET
  reelDelete:         (id)   => `/api/reels/${id}`,                // DELETE (owner only)
  reelUpdate:         (id)   => `/api/reels/${id}`,

  // ⚠️ NOT implemented in backend yet — do not call until added
  // reelRating:      (id)   => `/api/reels/${id}/rating`,         // POST  (no backend handler)

  // ── private chat (backend/routes/chat.py) ─────────────────
  chatHistory:        (id)   => `/api/chat/${id}`,                 // GET  ?limit=&offset=
  chatSend:                  "/api/chat/send",                     // POST multipart { receiver_id, content?, file?, client_message_id? }
  chatRead:           (id)   => `/api/chat/${id}/read`,            // POST
  chatDelete:         (mid)  => `/api/chat/message/${mid}/delete`, // POST
  chatWs:             (id)   => `/api/chat/ws/${id}`,              // WS   (partner public user_id)

  // ── couple chat (backend/routes/couple_realtime.py) ───────
  coupleWs:           (id)   => `/ws/couple/${id}`,                // WS   (partner public user_id)  ⚠ note: no /api prefix

  // ⚠️ ENDPOINT NOT YET IMPLEMENTED IN BACKEND — must add `POST /api/couple/upload-media`
  //    before using. Currently uploadAndSend in CoupleChatScreen should NOT call this.
  //    See backend fix: add to couple_chat.py using chat.save_upload.
  // coupleUploadMedia: "/api/couple/upload-media",

  // ── NEXA AI (backend/routes/ai_assistant.py) ──────────────
  nexaChat:                  "/api/ai-assistant/chat",             // POST { message }
  nexaStatus:                "/api/ai-assistant/status",           // GET
};

export default EP;
