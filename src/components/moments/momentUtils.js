import { API_BASE_URL } from "../../config";

export const MOMENT_TTL_MS = 24 * 60 * 60 * 1000;

export const mediaUri = (m) => {
  if (!m) return null;
  let url = m.signed_media_url || m.media_url;
  if (!url) return null;
  url = String(url);
  if (/^https?:\/\//i.test(url)) return url;
  return API_BASE_URL + (url.startsWith("/") ? url : "/" + url);
};

export const timeLeft = (expires_at) => {
  if (!expires_at) return null;
  const ms = new Date(expires_at).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
};

export const when = (iso) => {
  if (!iso) return "";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");
  if (isNaN(d)) return "";
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
};

export const REACTION_SET = ["❤️", "😂", "😮", "😢", "🔥", "👍", "🙏", "🎉"];

export const THEME_COLORS = [
  ["#0f172a", "#f8fafc"], ["#7c3aed", "#ffffff"], ["#db2777", "#ffffff"],
  ["#0891b2", "#ffffff"], ["#ea580c", "#ffffff"], ["#65a30d", "#ffffff"],
  ["#1e293b", "#f8fafc"], ["#000000", "#ffffff"],
];