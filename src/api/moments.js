import { api } from "./client";

const base = "/api/moments";

export const MomentsAPI = {
  feed:          (limit = 50)   => api(`${base}/feed?limit=${limit}`),
  storyRow:      ()             => api(`${base}/story-row`),
  mine:          ()             => api(`${base}/mine`),
  archive:       ()             => api(`${base}/archive`),
  one:           (id)           => api(`${base}/${id}`),
  create:        (body)         => api(`${base}/create`, { method: "POST", body }),
  update:        (id, body)     => api(`${base}/${id}`, { method: "PUT", body }),
  remove:        (id)           => api(`${base}/${id}`, { method: "DELETE" }),
  archiveOne:    (id)           => api(`${base}/${id}/archive`, { method: "POST" }),
  restoreOne:    (id)           => api(`${base}/${id}/restore`, { method: "POST" }),
  upload:        (form)         => api(`${base}/upload`, { method: "POST", form }),
  view:          (id)           => api(`${base}/${id}/view`, { method: "POST" }),
  viewers:       (id)           => api(`${base}/${id}/viewers`),
  viewsCount:    (id)           => api(`${base}/${id}/views-count`),
  react:         (id, reaction) => api(`${base}/${id}/reactions`, { method: "POST", body: { reaction } }),
  unreact:       (id)           => api(`${base}/${id}/reactions`, { method: "DELETE" }),
  reactions:     (id)           => api(`${base}/${id}/reactions`),
  comments:      (id)           => api(`${base}/${id}/comments`),
  comment:       (id, content)  => api(`${base}/${id}/comments`, { method: "POST", body: { content } }),
  deleteComment: (id, cid)      => api(`${base}/${id}/comments/${cid}`, { method: "DELETE" }),
  report:        (id, reason, description) =>
    api(`${base}/${id}/report`, { method: "POST", body: { reason, description } }),
  audienceUsers: (type)         => api(`${base}/audience-users?type=${type}`),
  getSettings:   ()             => api(`${base}/settings`),
  saveSettings:  (body)         => api(`${base}/settings`, { method: "PUT", body }),
  notifications: ()             => api(`${base}/notifications/list`),
  readNotif:     (id)           => api(`${base}/notifications/read`, { method: "POST", body: { notification_id: id } }),
};