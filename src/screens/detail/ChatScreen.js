import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, KeyboardAvoidingView, Platform, Alert, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { api, openSocket } from "../../api/client";
import { EP } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { parseTime, chatDateLabel, seen, EMOJIS } from "../../components/chat/chatUtils";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatMessage from "../../components/chat/ChatMessage";
import ChatComposer from "../../components/chat/ChatComposer";
import { CallSheet, PrivacySheet, MediaSheet, MenuList } from "../../components/chat/ChatSheets";

export default function ChatScreen({ navigation, route }) {
  const [peer, setPeer] = useState(route.params?.user || {});
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const [attachOpen, setAttachOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [muted, setMuted] = useState(false);
  const [shareTyping, setShareTyping] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recMs, setRecMs] = useState(0);

  const recRef = useRef(null);
  const listRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const shareTypingRef = useRef(true);
  shareTypingRef.current = shareTyping;

  const closeAll = () => { setAttachOpen(false); setMenuOpen(false); setMoreOpen(false); };

  const load = useCallback(async () => {
    try {
      const d = await api(EP.chatHistory(peer.user_id));
      if (d.user) setPeer((p) => ({ ...p, ...d.user }));
      setMessages((prev) => {
        const backendMsgs = d.messages || [];
        const pendingMsgs = prev.filter((m) => m.pending);
        const uniquePending = pendingMsgs.filter(
          (p) => !backendMsgs.some((b) => b.content === p.content && b.sender_id === p.sender_id)
        );
        return [...backendMsgs, ...uniquePending];
      });
      setError("");
    } catch (e) { setError(e.message || "Unable to load messages."); }
  }, [peer.user_id]);

  useFocusEffect(useCallback(() => {
  load();
  const t = setInterval(load, 5000);      // was 3500 → 5000, now paused off-screen
  return () => clearInterval(t);
}, [load]));

  useEffect(() => {
    if (searchOpen && query) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length, searchOpen, query]);

  useEffect(() => {
    let closed = false, retry, hide;
    const connect = () => {
      let ws;
      try { ws = openSocket(EP.chatWs(peer.user_id)); } catch { return; }
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.type === "presence") { setOnline(!!m.online); setLastSeen(m.last_seen || null); if (!m.online) setTyping(false); }
          else if (m.type === "typing") {
            setTyping(!!m.typing);
            clearTimeout(hide);
            if (m.typing) hide = setTimeout(() => setTyping(false), 6000);
          }
        } catch {}
      };
      ws.onerror = () => {};
      ws.onclose = (e) => { if (!closed && ![4401, 4403, 4404].includes(e.code)) retry = setTimeout(connect, 4000); };
    };
    connect();
    return () => { closed = true; clearTimeout(retry); clearTimeout(hide); try { wsRef.current?.close(); } catch {} };
  }, [peer.user_id]);

  useEffect(() => () => { recRef.current?.stopAndUnloadAsync?.().catch(() => {}); }, []);

  const sendTyping = (on) => {
    if (!shareTypingRef.current) return;
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "typing", typing: on }));
  };
  const onChange = (v) => {
    setText(v);
    const now = Date.now();
    if (v && now - lastTypingSent.current > 2500) { lastTypingSent.current = now; sendTyping(true); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { lastTypingSent.current = 0; sendTyping(false); }, 2000);
  };

  const send = async (file) => {
    const body = text.trim();
    if ((!body && !file) || sending) return;
    const tmp = { id: `tmp${Date.now()}`, sender_id: user.id, content: body, pending: true, created_at: new Date().toISOString() };
    setMessages((m) => [...m, tmp]); setText(""); sendTyping(false); setSending(true); setEmojiOpen(false);
    try {
      const fd = new FormData();
      fd.append("receiver_id", peer.user_id);
      fd.append("content", body);
      if (file) fd.append("file", file);
      const d = await api(EP.chatSend, { method: "POST", form: fd });
      setMessages((m) => m.map((x) => (x.id === tmp.id ? d.message : x)));
    } catch (e) {
      Alert.alert("Not sent", e.message);
      setMessages((m) => m.filter((x) => x.id !== tmp.id));
      if (body) setText(body);
    }
    setSending(false);
  };

const del = useCallback((m) => {
  if (m.sender_id !== user.id || m.pending) return;
  Alert.alert("Delete message", "Delete this message for everyone?", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => {
        try { await api(EP.chatDelete(m.id), { method: "POST" });
              setMessages((l) => l.filter((x) => x.id !== m.id)); }
        catch (e) { Alert.alert("Could not delete", e.message); }
      } },
  ]);
}, [user.id]);

  const pickMedia = async () => {
    setAttachOpen(false);
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) return Alert.alert("Permission needed", "Allow photo library access.");
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.85 });
    if (r.canceled) return;
    const a = r.assets[0];
    const vid = a.type === "video";
    send({ uri: a.uri, name: a.fileName || (vid ? "video.mp4" : "photo.jpg"), type: a.mimeType || (vid ? "video/mp4" : "image/jpeg") });
  };
  const pickDocument = async () => {
    setAttachOpen(false);
    const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    send({ uri: a.uri, name: a.name || "file", type: a.mimeType || "application/octet-stream" });
  };
  const pickAudio = async () => {
    setAttachOpen(false);
    const r = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    send({ uri: a.uri, name: a.name || "audio.m4a", type: a.mimeType || "audio/mpeg" });
  };
  const openCamera = async () => {
    closeAll();
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return Alert.alert("Permission needed", "Allow camera access.");
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.85 });
    if (r.canceled) return;
    const a = r.assets[0];
    const vid = a.type === "video";
    send({ uri: a.uri, name: a.fileName || (vid ? "video.mp4" : "photo.jpg"), type: a.mimeType || (vid ? "video/mp4" : "image/jpeg") });
  };

  const startRec = async () => {
    closeAll(); setEmojiOpen(false);
    try {
      const p = await Audio.requestPermissionsAsync();
      if (!p.granted) return Alert.alert("Permission needed", "Allow microphone access.");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY, (s) => setRecMs(s.durationMillis || 0), 250
      );
      recRef.current = rec; setRecMs(0); setRecording(true);
    } catch (e) { Alert.alert("Could not record", e.message); }
  };
  const stopRec = async (shouldSend) => {
    const rec = recRef.current;
    recRef.current = null; setRecording(false);
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();
      if (shouldSend && uri && recMs > 600) send({ uri, name: `voice-${Date.now()}.m4a`, type: "audio/m4a" });
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? messages.filter((m) => (m.content || "").toLowerCase().includes(q)) : messages;
  }, [messages, query]);

  const displayMessages = useMemo(() => {
    const out = []; let prev = "";
    filtered.forEach((m) => {
      const d = parseTime(m.created_at);
      const key = d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : "unknown";
      if (key !== prev) { out.push({ _dateSeparator: true, id: `date-${key}`, label: chatDateLabel(m.created_at) }); prev = key; }
      out.push(m);
    });
    return out;
  }, [filtered]);

  const name = peer.name || peer.username || "Chat";
  const status = error ? "Offline" : typing ? "typing…" : online ? "Online" : seen(lastSeen) || "Private chat";
  const live = !error && (typing || online);
  const canSend = text.trim().length > 0 && !sending;

  return (
    <SafeAreaView className="flex-1 bg-[#080c16]">
      <ChatHeader peer={peer} name={name} status={status} live={live} online={online} error={error}
        searchOpen={searchOpen} query={query} setQuery={setQuery} setSearchOpen={setSearchOpen}
        onMenu={() => { setAttachOpen(false); setMoreOpen(false); setMenuOpen((v) => !v); }}
        onCall={() => { closeAll(); setCallOpen(true); }}
        onCouple={() => navigation.navigate("CoupleChat", { user: peer })}
        onBack={() => navigation.goBack()}
        onProfile={() => navigation.navigate("UserProfile", { userId: peer.user_id })} />

      {error ? (
        <View className="flex-row items-center px-4 py-2.5 bg-danger/10 border-b border-danger/20">
          <Ionicons name="cloud-offline-outline" size={16} color="#ff6b6b" />
          <Text className="text-danger text-xs flex-1 mx-2.5" numberOfLines={2}>{error}</Text>
          <Pressable onPress={load} className="px-3 py-1 rounded-full bg-white/10 active:opacity-70">
            <Text className="text-white text-xs font-bold">Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <FlatList ref={listRef} data={displayMessages} keyExtractor={(m, i) => String(m.id ?? i)}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => { closeAll(); Keyboard.dismiss(); }}
          contentContainerClassName="px-3.5 pb-3 gap-1.5"
          ListHeaderComponent={<ChatMessage.Header peer={peer} name={name} />}
          ListEmptyComponent={query ? <Text className="text-[#8493ab] text-center mt-10 text-[13px]">No messages match "{query}"</Text> : null}
          renderItem={({ item: m }) => m._dateSeparator
            ? <ChatMessage.DateSeparator label={m.label} />
            : <ChatMessage message={m} me={user} onDelete={del} />}
        />

        {typing && !error ? <ChatMessage.TypingIndicator /> : null}
        {emojiOpen ? <ChatMessage.EmojiPicker emojis={EMOJIS} onPick={(e) => setText((t) => t + e)} /> : null}

        <ChatComposer text={text} onChange={onChange} onSend={() => send()} canSend={canSend}
          recording={recording} recMs={recMs} emojiOpen={emojiOpen} attachOpen={attachOpen}
          onToggleEmoji={() => { closeAll(); Keyboard.dismiss(); setEmojiOpen((v) => !v); }}
          onToggleAttach={() => { setMenuOpen(false); Keyboard.dismiss(); setEmojiOpen(false); setAttachOpen((v) => !v); }}
          onCamera={openCamera} onStartRec={startRec} onStopRec={stopRec}
          onPickMedia={pickMedia} onPickDocument={pickDocument} onPickAudio={pickAudio} />
      </KeyboardAvoidingView>

      {menuOpen || moreOpen ? (
        <>
          <Pressable className="absolute inset-0" onPress={closeAll} />
          <MenuList moreOpen={moreOpen} setMoreOpen={setMoreOpen} muted={muted}
            setMuted={setMuted} closeAll={closeAll} navigation={navigation} peer={peer} name={name}
            onPrivacy={() => { closeAll(); setPrivacyOpen(true); }}
            onSearch={() => { closeAll(); setSearchOpen(true); }}
            onMedia={() => { closeAll(); setMediaOpen(true); }}
            onRefresh={load} listRef={listRef} />
        </>
      ) : null}

      {muted ? (
        <View className="absolute top-[72px] self-center px-3 py-1 rounded-full bg-[#121b2d] border border-white/8 flex-row items-center">
          <Ionicons name="notifications-off" size={11} color="#9fb0c9" />
          <Text className="text-[#9fb0c9] text-[11px] ml-1.5">Muted</Text>
        </View>
      ) : null}

      <CallSheet visible={callOpen} onClose={() => setCallOpen(false)} me={user} peer={peer} />
      <PrivacySheet visible={privacyOpen} onClose={() => setPrivacyOpen(false)}
        shareTyping={shareTyping} setShareTyping={setShareTyping} online={online} lastSeen={lastSeen} name={name} />
      <MediaSheet visible={mediaOpen} onClose={() => setMediaOpen(false)} messages={messages} />
    </SafeAreaView>
  );
}