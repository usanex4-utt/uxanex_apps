import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { api, openSocket } from "../../api/client";
import { EP } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PartnerPicker from "../../components/couple/PartnerPicker";
import CoupleHeader from "../../components/couple/CoupleHeader";
import CoupleMessage from "../../components/couple/CoupleMessage";
import CoupleComposer from "../../components/couple/CoupleComposer";
import { SuggestionsStrip, CoupleAssistantModal } from "../../components/couple/CoupleSuggestions";
import { MOODS, BY_MOOD, GENERIC, QUESTIONS, GAMES, pick3, rank } from "../../components/couple/coupleUtils";

export default function CoupleChatScreen({ navigation, route }) {
  const { user } = useAuth();
  const [partner, setPartner] = useState(route.params?.user || null);
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("calm");
  const [aiModal, setAiModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [conn, setConn] = useState("connecting");
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [typing, setTyping] = useState(false);
  const [notice, setNotice] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recMs, setRecMs] = useState(0);

  const listRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimer = useRef(null);
  const typingOn = useRef(false);
  const recRef = useRef(null);

  const m = MOODS.find((x) => x[0] === mood) || MOODS[MOODS.length - 1];
  const accent = m[2], bg = m[3];

  useEffect(() => {
    if (partner) return;
    api(EP.connections).then((d) => setConnections(d.connections || d.users || [])).catch(() => {});
  }, [partner]);

  useEffect(() => {
    if (!partner?.user_id) return;
    let closed = false, retry, ping, attempts = 0, hide;
    setMessages([]); setConn("connecting");

    const wsSend = (obj) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; }
      return false;
    };
    const ackRead = (list) => list.filter((x) => x.sender_id !== user.id && x.id).slice(-20)
      .forEach((x) => wsSend({ type: "message_read", message_id: x.id }));

    const connect = () => {
      let ws;
      try { ws = openSocket(EP.coupleWs(partner.user_id)); } catch { setConn("closed"); return; }
      wsRef.current = ws;
      ws.onopen = () => {
        attempts = 0; setConn("open"); clearInterval(ping);
        ping = setInterval(() => wsSend({ type: "ping" }), 25000);
      };
      ws.onmessage = (e) => {
        let ev; try { ev = JSON.parse(e.data); } catch { return; }
        switch (ev.type) {
          case "connected":
            setOnline(!!ev.partner_online); setLastSeen(ev.partner_last_seen || null);
            if (ev.mood && MOODS.some((x) => x[0] === ev.mood)) setMood(ev.mood);
            break;
          case "message_history": {
            const list = ev.messages || [];
            setMessages(list.map((x) => ({ ...x, content: x.content, status: "seen" })));
            ackRead(list);
            break;
          }
          case "message": {
            const mine = ev.sender_id === user.id;
            const msg = {
              id: ev.id ?? ev.message_id, client_message_id: ev.client_message_id,
              sender_id: ev.sender_id, content: ev.content, media_url: ev.media_url,
              media_type: ev.media_type, created_at: ev.timestamp || ev.created_at,
              status: mine ? "sent" : undefined,
            };
            setMessages((l) => {
              if (msg.id && l.some((x) => x.id === msg.id)) return l;
              const i = mine && msg.client_message_id ? l.findIndex((x) => x.client_message_id === msg.client_message_id) : -1;
              if (i >= 0) {
                const c = [...l];
                c[i] = { ...c[i], ...msg, pending: false, status: c[i].status && rank[c[i].status] > 1 ? c[i].status : "sent" };
                return c;
              }
              return [...l, msg];
            });
            if (!mine && msg.id) wsSend({ type: "message_read", message_id: msg.id });
            break;
          }
          case "message_receipt": {
            const next = ev.status; if (!next) break;
            setMessages((l) => l.map((x) => {
              const hit = (ev.message_id && x.id === ev.message_id) || (ev.client_message_id && x.client_message_id === ev.client_message_id);
              if (!hit || x.sender_id !== user.id) return x;
              return rank[next] > (rank[x.status] ?? 0)
                ? { ...x, id: ev.message_id ?? x.id, status: next }
                : { ...x, id: ev.message_id ?? x.id };
            }));
            break;
          }
          case "typing":
            setTyping(!!(ev.typing ?? ev.is_typing));
            clearTimeout(hide);
            if (ev.typing ?? ev.is_typing) hide = setTimeout(() => setTyping(false), 6000);
            break;
          case "presence":
            setOnline(!!(ev.online ?? ev.is_online)); setLastSeen(ev.last_seen || null);
            if (!(ev.online ?? ev.is_online)) setTyping(false);
            break;
          case "mood":
            if (ev.mood && MOODS.some((x) => x[0] === ev.mood)) setMood(ev.mood);
            break;
          case "error":
            setNotice(ev.message || "Something went wrong");
            if (ev.client_message_id) setMessages((l) => l.filter((x) => x.client_message_id !== ev.client_message_id));
            setTimeout(() => setNotice(""), 3000);
            break;
        }
      };
      ws.onerror = () => {};
      ws.onclose = (e) => {
        clearInterval(ping);
        if (closed) return;
        if (e.code === 1008) { setConn("denied"); setNotice(e.reason || "Not allowed to open this chat"); return; }
        setConn("closed");
        attempts += 1;
        retry = setTimeout(() => { setConn("connecting"); connect(); }, Math.min(1000 * 2 ** attempts, 15000));
      };
    };
    connect();
    return () => { closed = true; clearTimeout(retry); clearTimeout(hide); clearInterval(ping); try { wsRef.current?.close(); } catch {} };
  }, [partner?.user_id, user.id]);

  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80); }, [messages.length]);

  const wsSendNow = (obj) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; }
    return false;
  };

  const onChange = (v) => {
    setText(v);
    if (v && !typingOn.current) { typingOn.current = true; wsSendNow({ type: "typing_start" }); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { if (typingOn.current) { typingOn.current = false; wsSendNow({ type: "typing_stop" }); } }, 1800);
  };

  const send = (override) => {
    const body = (override ?? text).trim();
    if (!body) return;
    const cid = `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const ok = wsSendNow({ type: "message", content: body, client_message_id: cid, message_type: "text" });
    if (!ok) { setNotice("Connecting… try again in a moment"); setTimeout(() => setNotice(""), 2500); return; }
    typingOn.current = false; wsSendNow({ type: "typing_stop" });
    setMessages((l) => [...l, { id: cid, client_message_id: cid, sender_id: user.id, content: body, pending: true, status: "sending", created_at: new Date().toISOString() }]);
    setText(""); setSuggestions([]);
    setTimeout(() => {
      setMessages((list) => {
        const msg = list.find(m => m.client_message_id === cid);
        if (msg && msg.pending) {
          setNotice("Message not sent. Server is busy or down.");
          setTimeout(() => setNotice(""), 3000);
          return list.filter(m => m.client_message_id !== cid);
        }
        return list;
      });
    }, 10000);
  };

  const askAi = (action) => {
    setAiModal(false);
    if (action === "question") setSuggestions(pick3(QUESTIONS));
    else if (action === "game") setSuggestions(pick3(GAMES));
    else setSuggestions(pick3([...(BY_MOOD[mood] || []), ...GENERIC]));
  };

  const uploadAndSend = async (file) => {
    if (uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("receiver_id", partner.user_id);
      fd.append("content", "");
      fd.append("file", file);
      const d = await api(EP.chatSend, { method: "POST", form: fd });
      if (d.success && d.message?.media_url) {
        const cid = `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
        wsSendNow({ type: "message", client_message_id: cid, content: "", media_url: d.message.media_url, media_type: d.message.media_type, message_type: "text" });
      } else Alert.alert("Upload Failed", "Could not upload file.");
    } catch (e) { Alert.alert("Error", e.message || "Failed to send media"); }
    setUploading(false);
  };

  const pickMedia = async () => {
    setAttachOpen(false);
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) return Alert.alert("Permission needed", "Allow photo library access.");
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.85 });
    if (r.canceled) return;
    const a = r.assets[0];
    const vid = a.type === "video";
    uploadAndSend({ uri: a.uri, name: a.fileName || (vid ? "video.mp4" : "photo.jpg"), type: a.mimeType || (vid ? "video/mp4" : "image/jpeg") });
  };
  const openCamera = async () => {
    setAttachOpen(false);
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return Alert.alert("Permission needed", "Allow camera access.");
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.85 });
    if (r.canceled) return;
    const a = r.assets[0];
    const vid = a.type === "video";
    uploadAndSend({ uri: a.uri, name: a.fileName || (vid ? "video.mp4" : "photo.jpg"), type: a.mimeType || (vid ? "video/mp4" : "image/jpeg") });
  };
  const pickDocument = async () => {
    setAttachOpen(false);
    const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    uploadAndSend({ uri: a.uri, name: a.name || "file", type: a.mimeType || "application/octet-stream" });
  };
  const pickAudio = async () => {
    setAttachOpen(false);
    const r = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    uploadAndSend({ uri: a.uri, name: a.name || "audio.m4a", type: a.mimeType || "audio/mpeg" });
  };

  const startRec = async () => {
    setAttachOpen(false); setEmojiOpen(false); Keyboard.dismiss();
    try {
      const p = await Audio.requestPermissionsAsync();
      if (!p.granted) return Alert.alert("Permission needed", "Allow microphone access.");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY, (s) => setRecMs(s.durationMillis || 0), 250);
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
      if (shouldSend && uri && recMs > 600) uploadAndSend({ uri, name: `voice-${Date.now()}.m4a`, type: "audio/m4a" });
    } catch {}
  };

  if (!partner) return <PartnerPicker connections={connections} navigation={navigation} onPick={setPartner} />;

  const canSend = (text.trim().length > 0 || uploading) && conn === "open";

  return (
    <SafeAreaView style={{ backgroundColor: bg }} className="flex-1">
      <CoupleHeader partner={partner} onBack={() => navigation.goBack()} conn={conn} typing={typing}
        online={online} lastSeen={lastSeen} mood={m} accent={accent} />
      {notice ? (
        <View className="flex-row items-center px-4 py-2.5 bg-[#ffe3e3]">
          <Ionicons name="alert-circle-outline" size={16} color="#c92a2a" />
          <Text className="text-[#c92a2a] text-xs ml-2 flex-1">{notice}</Text>
        </View>
      ) : null}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {conn === "connecting" && messages.length === 0 ? <ActivityIndicator color={accent} className="mt-6" /> : null}
        <FlatList ref={listRef} data={messages} keyExtractor={(x, i) => String(x.client_message_id || x.id || i)}
          contentContainerClassName="px-3.5 pt-4 pb-3 gap-2" showsVerticalScrollIndicator={false}
          ListHeaderComponent={messages.length > 0 ? (
            <View className="items-center pb-3">
              <View className="flex-row items-center px-3.5 py-1.5 rounded-full bg-white/80 border border-black/5">
                <Ionicons name="heart" size={12} color={accent} />
                <Text className="text-[#968b98] text-[11px] ml-1.5">Your private space, just for two</Text>
              </View>
            </View>
          ) : null}
          ListEmptyComponent={conn === "connecting" ? null : (
            <View className="items-center pt-10 px-8">
              <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-3" style={{ borderWidth: 1, borderColor: `${accent}33` }}>
                <Ionicons name="heart" size={28} color={accent} />
              </View>
              <Text className="text-[#382b3b] text-[16px] font-bold">Say something sweet</Text>
              <Text className="text-[#968b98] text-[12px] text-center mt-1">Send the first message, or tap a quick action above.</Text>
            </View>
          )}
          renderItem={({ item }) => <CoupleMessage item={item} user={user} accent={accent} />} />
        {typing && conn === "open" ? (
          <View className="px-4 pb-2">
            <View className="self-start flex-row items-center px-3 py-1.5 rounded-full bg-white border border-black/5">
              <View className="flex-row gap-1">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${accent}AA` }} />
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${accent}55` }} />
              </View>
              <Text className="text-[#968b98] text-[11px] ml-2">typing</Text>
            </View>
          </View>
        ) : null}
        <SuggestionsStrip suggestions={suggestions} accent={accent} onPick={send} onClose={() => setSuggestions([])} />
        <CoupleComposer text={text} onChange={onChange} onSend={() => send()} accent={accent} canSend={canSend}
          uploading={uploading} recording={recording} recMs={recMs} emojiOpen={emojiOpen} attachOpen={attachOpen}
          onToggleEmoji={() => { setAttachOpen(false); Keyboard.dismiss(); setEmojiOpen((v) => !v); }}
          onToggleAttach={() => { Keyboard.dismiss(); setEmojiOpen(false); setAttachOpen((v) => !v); }}
          onCamera={openCamera} onStartRec={startRec} onStopRec={stopRec}
          onPickMedia={pickMedia} onPickDocument={pickDocument} onPickAudio={pickAudio} conn={conn} />
      </KeyboardAvoidingView>
      <CoupleAssistantModal visible={aiModal} onClose={() => setAiModal(false)} accent={accent} onAction={askAi} />
    </SafeAreaView>
  );
}