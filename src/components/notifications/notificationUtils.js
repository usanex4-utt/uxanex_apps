export const parse = (iso) => {
  if (!iso) return null;
  const d = new Date(iso.endsWith("Z") || /[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");
  return isNaN(d) ? null : d;
};

export const when = (iso) => {
  const d = parse(iso);
  if (!d) return "";
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d ago`;
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

export const typeIcon = (type = "") => {
  const t = String(type).toLowerCase();
  if (t.includes("accept")) return ["checkmark", "#3bb273"];
  if (t.includes("request")) return ["person-add", "#247cff"];
  if (t.includes("like") || t.includes("rating")) return ["star", "#ffc83d"];
  if (t.includes("comment") || t.includes("message")) return ["chatbubble", "#9775fa"];
  if (t.includes("follow")) return ["person", "#247cff"];
  return ["notifications", "#247cff"];
};

export const normType = (n) => String(n?.type ?? n?.notification_type ?? "").toLowerCase();
export const normPhoto = (n) => n?.sender_profile_picture || n?.sender_profile_photo || null;
export const normSenderId = (n) => n?.sender_user_id || n?.sender_id || n?.from_user_id || n?.user_id || null;