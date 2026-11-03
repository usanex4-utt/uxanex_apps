export const EMOJIS = ("😀 😃 😄 😁 😆 😅 😂 🤣 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 🤗 🤔 🤐 😐 😴 😎 🥳 😢 😭 😡 🥺 😱 " +
  "👍 👎 👏 🙌 🙏 💪 👋 🤝 ✌️ 🤞 👌 🔥 ✨ 🎉 💯 ❤️ 🧡 💛 💚 💙 💜 🖤 💔 💕 💖 🌹 ☕ 🍕 🎂 🎁 ✅ ❌").split(" ");

export const MOODS = [
  ["romantic", "Romantic", "#e56b9a", "#fff0f6"], ["deep_love", "Deep Love", "#d6336c", "#ffe8ef"],
  ["happy", "Happy", "#f5a623", "#fff8e6"], ["funny", "Funny", "#f08c00", "#fff4e0"],
  ["sad", "Sad", "#5c7cfa", "#eef2ff"], ["emotional", "Emotional", "#9775fa", "#f3eeff"],
  ["angry", "Angry", "#e03131", "#ffecec"], ["frustrated", "Frustrated", "#d9480f", "#fff0e8"],
  ["caring", "Caring", "#3bb273", "#e9f9f0"], ["comfort", "Comfort", "#70b8ad", "#f0faf7"],
  ["flirty", "Flirty", "#f06595", "#fff0f6"], ["passionate", "Passionate", "#c2255c", "#ffe3ec"],
  ["good_night", "Good Night", "#4c6ef5", "#e8ecff"], ["good_morning", "Good Morning", "#fab005", "#fff9db"],
  ["memory", "Memory", "#845ef7", "#f3eeff"], ["celebration", "Celebration", "#e8590c", "#fff3e6"],
  ["birthday", "Birthday", "#f06595", "#fff0f6"], ["future_marriage", "Future", "#ae3ec9", "#f8eaff"],
  ["missing_you", "Missing You", "#4dabf7", "#e7f5ff"], ["apology", "Apology", "#868e96", "#f1f3f5"],
  ["appreciation", "Appreciation", "#20c997", "#e6fcf5"], ["game", "Game", "#7950f2", "#f1ebff"],
  ["photo_memory", "Photo Memory", "#845ef7", "#f3eeff"], ["serious_talk", "Serious Talk", "#495057", "#f1f3f5"],
  ["deep_conversation", "Deep Talk", "#5f3dc4", "#efeaff"], ["calm", "Calm", "#70b8ad", "#f0faf7"],
];

export const QUICK = {
  love: { icon: "heart-outline", label: "Love", text: "I love you more than words can say ❤️" },
  memory: { icon: "images-outline", label: "Memory", text: "Remember our first time together? I still smile thinking about it 🥰" },
  question: { icon: "help-circle-outline", label: "Question", text: "If we could go anywhere tomorrow, where would you take me?" },
  game: { icon: "game-controller-outline", label: "Game", text: "Let's play: tell me 3 things you love about us 💞" },
};

export const AI_ACTIONS = [
  ["suggest", "Suggest a message", "Reply ideas that fit your mood", "chatbubble-ellipses-outline"],
  ["question", "Give us a question", "Something sweet to talk about", "help-circle-outline"],
  ["game", "Couple game", "A playful way to connect", "game-controller-outline"],
];

export const BY_MOOD = {
  romantic: ["You're my favourite person in the whole world 💕", "Every moment with you feels like a love story ❤️"],
  missing_you: ["Missing you so much right now 🥺", "Wish you were here with me 💭"],
  good_night: ["Good night, sleep tight. Sweet dreams of us 🌙", "Sending you a big goodnight hug 🤍"],
  good_morning: ["Good morning, sunshine ☀️ Hope your day is beautiful", "Waking up and thinking of you 🌸"],
  apology: ["I'm really sorry. I care about you and want to make it right 🙏", "You matter to me more than being right"],
  appreciation: ["Thank you for always being there for me 🌷", "I appreciate everything you do, more than you know"],
  sad: ["I'm here for you, always. Want to talk about it? 🤍", "You're not alone. I'm right here"],
  happy: ["You make me so happy 😊", "Best part of my day is talking to you"],
};
export const GENERIC = ["Thinking of you right now 💭", "Can't wait to see you ❤️", "You make my day better 🌸"];
export const QUESTIONS = [
  "What's your favourite memory of us?", "Where would you want to travel together next?", "What's one thing I do that makes you smile?",
  "What are you most excited about for our future?", "What song reminds you of us?",
];
export const GAMES = [
  "Two truths and a lie — you go first 😄", "Tell me 3 things you love about us 💞", "Describe our relationship in 3 emojis",
  "Rate our last date out of 10 and tell me why", "Guess what I'm thinking about right now 😉",
];
export const pick3 = (arr) => [...arr].sort(() => Math.random() - 0.5).slice(0, 3);
export const rank = { sending: 0, sent: 1, delivered: 2, seen: 3 };
export const mmss = (ms) => {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};