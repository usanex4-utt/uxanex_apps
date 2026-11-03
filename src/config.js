// config.js
const FALLBACK_URL = "https://usanex-backendapps.onrender.com";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || FALLBACK_URL;
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");