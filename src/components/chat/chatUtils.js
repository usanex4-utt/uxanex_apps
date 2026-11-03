export const parseTime = (iso) => {
  if (!iso) return null;
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");
  return isNaN(d) ? null : d;
};
export const time12 = (d) => {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ap}`;
};
export const hhmm = (iso) => {
  const d = parseTime(iso);
  return d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
};
export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const chatDateLabel = (iso) => {
  const d = parseTime(iso);
  if (!d) return "Earlier";
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};
export const seen = (iso) => {
  const d = parseTime(iso);
  return d ? `Last seen ${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time12(d)}` : "";
};
export const mmss = (ms) => {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
export const URL_RE = /(https?:\/\/[^\s]+)/gi;

export const EMOJIS = ("😀 😃 😄 😁 😆 😅 😂 🤣 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 🤗 🤔 🤐 😐 😴 😎 🥳 😢 😭 😡 🥺 😱 " +
  "👍 👎 👏 🙌 🙏 💪 👋 🤝 ✌️ 🤞 👌 🔥 ✨ 🎉 💯 ❤️ 🧡 💛 💚 💙 💜 🖤 💔 💕 💖 🌹 ☕ 🍕 🎂 🎁 ✅ ❌").split(" ");

export const callUrl = (me, peer, voiceOnly) => {
  const room = `UtaNexa-${[me.id, peer.user_id].map(String).sort().join("-")}`;
  const cfg = voiceOnly ? "#config.startWithVideoMuted=true" : "";
  return `https://meet.jit.si/${room}${cfg}`;
};