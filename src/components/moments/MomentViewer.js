import React, { useEffect, useRef, useState } from "react";
import {
  Modal, View, Text, Pressable, Image, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Share,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import * as Clipboard from "expo-clipboard";
import { Avatar } from "../ui";
import { MomentsAPI } from "../../api/moments";
import { mediaUri, when, REACTION_SET, timeLeft } from "./momentUtils";
import ConfirmDialog from "./ConfirmDialog";

const IMAGE_DURATION = 5000;

const notify = (title, msg) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${msg || ""}`.trim());
  } else {
    Alert.alert(title, msg);
  }
};

const WebImg = ({ src, onErr, onLoad }) => {
  if (Platform.OS !== "web") return null;
  return (
    <img src={src} alt="" onError={(e) => onErr && onErr(e, src)} onLoad={() => onLoad && onLoad()}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />
  );
};

export default function MomentViewer({
  visible, moments: initial, startIndex = 0, owner, viewerId, onClose, onMutated,
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [moments, setMoments] = useState(initial || []);
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  
  // ── Share Success Toast State ──
  const [shareToast, setShareToast] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [failedUrl, setFailedUrl] = useState(null);

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const finishedRef = useRef(false);

  const holdTimeout = useRef(null);
  const didHold = useRef(false);
  const wasPausedBeforeHold = useRef(false);

  const current = moments[index];
  const isMine = Boolean(current?.is_mine || (current?.user_id != null && viewerId != null && String(current.user_id) === String(viewerId)));

  useEffect(() => {
    if (!visible) return;
    setMoments(initial || []);
    setIndex(startIndex);
  }, [visible, initial, startIndex]);

  useEffect(() => {
    if (!visible || !current) return;
    setProgress(0); finishedRef.current = false;
    setImgError(false); setImgLoading(false); setFailedUrl(null);
    if (current.id) MomentsAPI.view(current.id).catch(() => {});
    clearInterval(timerRef.current);
    if (current.moment_type !== "video") {
      const started = Date.now();
      timerRef.current = setInterval(() => {
        if (paused) return;
        const p = Math.min(1, (Date.now() - started) / IMAGE_DURATION);
        setProgress(p);
        if (p >= 1) { clearInterval(timerRef.current); next(); }
      }, 50);
    }
    return () => clearInterval(timerRef.current);
  }, [visible, index, moments, paused]);

  const next = () => { if (index < moments.length - 1) setIndex(index + 1); else onClose && onClose(); };
  const prev = () => { if (index > 0) setIndex(index - 1); };

  const handlePressIn = () => {
    didHold.current = false;
    wasPausedBeforeHold.current = paused;
    holdTimeout.current = setTimeout(() => {
      didHold.current = true;
      setPaused(true);
    }, 200);
  };

  const handlePressOut = () => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (didHold.current) setPaused(wasPausedBeforeHold.current);
  };

  const handleTap = (e) => {
    if (didHold.current) return;
    const x = e?.nativeEvent?.locationX ?? 0;
    if (x < width * 0.25) return prev();
    if (x > width * 0.75) return next();
    setPaused((p) => !p);
  };

  const react = async (emoji) => {
    if (!current) return;
    try {
      await MomentsAPI.react(current.id, emoji);
      setReactionsOpen(false);
      const d = await MomentsAPI.one(current.id);
      if (d.moment) setMoments((l) => l.map((m) => m.id === d.moment.id ? d.moment : m));
      onMutated && onMutated();
    } catch (e) { notify("Could not react", e.message); }
  };

  const askDelete = () => { setMoreOpen(false); setDeleteOpen(true); };

  const executeDelete = async () => {
    if (!current || deleting) return;
    setDeleting(true);
    try {
      await MomentsAPI.remove(current.id);
      setDeleteOpen(false);
      onMutated && onMutated();
      onClose && onClose();
    } catch (e) {
      setDeleteOpen(false);
      notify("Delete failed", e.message || "Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const archive = async () => {
    try {
      await MomentsAPI.archiveOne(current.id);
      setMoreOpen(false);
      onMutated && onMutated();
      onClose && onClose();
    } catch (e) { notify("Archive failed", e.message); }
  };

  const report = async () => {
    setMoreOpen(false);
    try {
      await MomentsAPI.report(current.id, "inappropriate", "");
      notify("Thanks", "Report submitted.");
    } catch (e) { notify("Failed", e.message); }
  };

  // ── UPDATED SHARE FUNCTION ──
  const share = async () => {
    const text = `Check out ${owner?.username || "this"} on UtaNexa`;
    try {
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({ title: "UtaNexa", text });
        } else {
          await Clipboard.setStringAsync(text);
        }
      } else {
        await Share.share({ message: text });
      }
      // Show custom checkmark toast instead of alert
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000); // Hide after 2 sec
    } catch (error) {
      // User cancelled share
    }
  };

  if (!current) return null;
  const uri = mediaUri(current);

  const renderBody = () => {
    if (current.moment_type === "video") {
      return (
        <Video key={current.id} ref={videoRef} source={{ uri }} style={{ width: "100%", height: "100%" }}
          resizeMode={ResizeMode.CONTAIN} isMuted={muted} shouldPlay={!paused} isLooping={false} useNativeControls={false}
          onPlaybackStatusUpdate={(s) => {
            if (!s.isLoaded) return;
            const d = s.durationMillis || 0;
            if (d > 0) setProgress(Math.min(1, (s.positionMillis || 0) / d));
            if (s.didJustFinish && !finishedRef.current) { finishedRef.current = true; next(); }
          }} />
      );
    }

    if (current.moment_type === "countdown") return <CountdownBody current={current} />;
    if (current.moment_type === "emoji_slider") return <EmojiSliderBody current={current} />;

    if (current.moment_type === "text") {
      return (
        <View style={{ flex: 1, width: "100%", backgroundColor: current.metadata?.background || "#0f172a", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: current.metadata?.color || "#f8fafc", fontSize: 28, fontWeight: "700", textAlign: "center" }}>{current.caption}</Text>
        </View>
      );
    }

    if (!uri) {
      return (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="image-outline" size={40} color="#fff" />
          <Text className="text-white/60 mt-2">No media</Text>
        </View>
      );
    }

    if (imgError) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={44} color="#ff6b6b" />
          <Text className="text-white text-[15px] font-semibold mt-3 text-center">Failed to load image</Text>
          <Text className="text-white/60 text-[11px] mt-2 text-center" numberOfLines={4}>{failedUrl || uri}</Text>
          <Pressable onPress={() => { setImgError(false); setImgLoading(true); setFailedUrl(null); }} className="mt-4 px-5 h-10 rounded-full bg-[#247cff] items-center justify-center">
            <Text className="text-white font-bold text-[13px]">Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (Platform.OS === "web") {
      return (
        <View style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}>
          <WebImg src={uri} onLoad={() => setImgLoading(false)} onErr={(_, src) => { setFailedUrl(src); setImgError(true); setImgLoading(false); }} />
          {imgLoading && <View className="absolute inset-0 items-center justify-center bg-black/60" style={{ pointerEvents: "none" }}><ActivityIndicator color="#fff" size="large" /></View>}
        </View>
      );
    }

    return (
      <View style={{ flex: 1, width: "100%", height: "100%" }}>
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain"
          onLoadStart={() => setImgLoading(true)} onLoadEnd={() => setImgLoading(false)}
          onError={() => { setFailedUrl(uri); setImgError(true); setImgLoading(false); }} />
        {imgLoading && <View className="absolute inset-0 items-center justify-center bg-black/50"><ActivityIndicator color="#fff" size="large" /></View>}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        
        {/* Progress Bars */}
        <View className="absolute left-0 right-0 z-20 flex-row px-2 gap-1" style={{ top: insets.top + 8 }}>
          {moments.map((m, i) => (
            <View key={m.id || i} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
              {i < index ? <View className="flex-1 bg-white" /> : i === index ? <View className="h-full bg-white" style={{ width: `${Math.round(progress * 100)}%` }} /> : null}
            </View>
          ))}
        </View>

        {/* Header */}
        <View className="absolute left-4 right-4 z-20 flex-row items-center" style={{ top: insets.top + 22 }}>
          <Avatar uri={owner?.profile_photo} name={owner?.name || owner?.username} size={36} />
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold text-[14px]" numberOfLines={1}>{owner?.name || owner?.username || "Moment"}</Text>
            <Text className="text-white/70 text-[11px]">{when(current.created_at)}{current.expires_at ? `  ·  ${timeLeft(current.expires_at)}` : ""}</Text>
          </View>
          {isMine && (
            <Pressable onPress={askDelete} hitSlop={10} className="w-9 h-9 rounded-full bg-red-500/30 border border-red-400/50 items-center justify-center mr-2 active:opacity-80">
              <Ionicons name="trash-outline" size={18} color="#ff8a8a" />
            </Pressable>
          )}
          <Pressable onPress={() => setMoreOpen(true)} hitSlop={10} className="w-9 h-9 rounded-full bg-black/40 items-center justify-center">
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={10} className="ml-2 w-9 h-9 rounded-full bg-black/40 items-center justify-center">
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Body */}
        <Pressable className="flex-1 justify-center" onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleTap}>
          {renderBody()}
          {current.caption && current.moment_type !== "text" && (
            <View className="absolute left-4 right-4 bottom-24 px-4 py-3 rounded-2xl bg-black/55">
              <Text className="text-white text-[14px] leading-5">{current.caption}</Text>
            </View>
          )}
        </Pressable>

        {/* Footer */}
        <View className="absolute left-0 right-0 z-20 px-4" style={{ bottom: insets.bottom + 16 }}>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => setCommentsOpen(true)} className="flex-1 h-11 rounded-full bg-white/15 border border-white/25 flex-row items-center px-4 active:opacity-80">
              <Ionicons name="chatbubble-outline" size={16} color="#fff" />
              <Text className="text-white text-[12px] font-semibold ml-2 flex-1">{current.comments_count ? `${current.comments_count} comments` : "Add a comment"}</Text>
            </Pressable>
            <Pressable onPress={() => setReactionsOpen(true)} className="w-11 h-11 rounded-full bg-white/15 border border-white/25 items-center justify-center active:opacity-80">
              <Text style={{ fontSize: 22 }}>{current.my_reaction || "❤️"}</Text>
            </Pressable>
            {isMine && (
              <Pressable onPress={() => setViewsOpen(true)} className="h-11 px-3 rounded-full bg-white/15 border border-white/25 flex-row items-center active:opacity-80">
                <Ionicons name="eye-outline" size={15} color="#fff" />
                <Text className="text-white text-[12px] font-bold ml-1">{current.views_count || 0}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Sheets & Modals */}
        <CommentSheet visible={commentsOpen} moment={current} viewerId={viewerId} onClose={() => setCommentsOpen(false)} onMutated={onMutated} />
        <ReactionSheet visible={reactionsOpen} moment={current} onClose={() => setReactionsOpen(false)} onPick={react} />
        <ViewsSheet visible={viewsOpen} moment={current} onClose={() => setViewsOpen(false)} />
        <MoreSheet visible={moreOpen} isMine={isMine} moment={current} muted={muted} onToggleMute={() => setMuted((m) => !m)}
          onClose={() => setMoreOpen(false)} onShare={share} onArchive={archive} onDelete={askDelete} onReport={report} />

        <ConfirmDialog visible={deleteOpen} title={deleting ? "Deleting…" : "Delete moment?"} message="This moment will be permanently removed. This cannot be undone."
          confirmText={deleting ? "…" : "Delete"} cancelText="Cancel" danger onCancel={() => { if (!deleting) setDeleteOpen(false); }} onConfirm={executeDelete} />

        {/* ── SHARE SUCCESS TOAST (SIGN SHOWING HERE) ── */}
        {shareToast && (
          <View className="absolute inset-0 z-50 items-center justify-center" style={{ pointerEvents: "none" }}>
            <View className="bg-black/85 px-7 py-5 rounded-3xl items-center justify-center border border-white/20 shadow-2xl">
              <Ionicons name="checkmark-circle" size={50} color="#43d9a3" />
              <Text className="text-white font-bold mt-3 text-[15px]">Shared successfully!</Text>
            </View>
          </View>
        )}
        
      </View>
    </Modal>
  );
}

/* ── Helpers ───────────────────────────────────── */

const CountdownBody = ({ current }) => {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const target = new Date(current.metadata?.target_date || Date.now()).getTime();
    const tick = () => {
      const ms = Math.max(0, target - Date.now());
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setLeft(`${d}d ${h}h ${m}m`);
    };
    tick(); const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [current.metadata?.target_date]);
  return (
    <View className="items-center justify-center px-6 flex-1">
      <Text className="text-white/80 text-[14px] font-semibold mb-3">{current.metadata?.title || "Countdown"}</Text>
      <Text className="text-white text-[38px] font-extrabold text-center" style={{ letterSpacing: 1 }}>{left}</Text>
    </View>
  );
};

const EmojiSliderBody = ({ current }) => {
  const emoji = current.metadata?.emoji || "❤️";
  const value = current.metadata?.slider_value || 50;
  return (
    <View className="items-center justify-center px-6 flex-1">
      <Text style={{ fontSize: 96 }}>{emoji}</Text>
      <View className="w-3/4 h-3 rounded-full bg-white/15 mt-6">
        <View className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
      </View>
      <Text className="text-white/60 text-[11px] mt-2">{value}%</Text>
    </View>
  );
};

const Sheet = ({ visible, onClose, title, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
      <Pressable className="bg-[#0b1220] rounded-t-[28px] border-t border-white/10 pt-2 pb-8" style={{ maxHeight: "85%" }} onPress={() => {}}>
        <View className="self-center w-9 h-1 rounded-full bg-white/20 my-2" />
        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-white text-[17px] font-bold">{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color="#fff" /></Pressable>
        </View>
        {children}
      </Pressable>
    </Pressable>
  </Modal>
);

const CommentSheet = ({ visible, moment, viewerId, onClose, onMutated }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    MomentsAPI.comments(moment.id).then((d) => setList(d.comments || [])).catch(() => setList([])).finally(() => setLoading(false));
  }, [visible, moment.id]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const d = await MomentsAPI.comment(moment.id, text);
      setList((l) => [d.comment, ...l]);
      setDraft(""); onMutated && onMutated();
    } catch (e) { notify("Failed", e.message); }
    setSending(false);
  };

  const del = async (c) => {
    try {
      await MomentsAPI.deleteComment(moment.id, c.id);
      setList((l) => l.filter((x) => x.id !== c.id)); onMutated && onMutated();
    } catch (e) { notify("Failed", e.message); }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={`Comments (${list.length})`}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={{ maxHeight: 400 }} contentContainerClassName="px-5 gap-3">
          {loading && <ActivityIndicator color="#247cff" />}
          {!loading && !list.length && <Text className="text-[#71809a] text-center py-8 text-[13px]">No comments yet.</Text>}
          {list.map((c) => (
            <View key={c.id} className="flex-row items-start">
              <Avatar uri={c.profile_photo} name={c.name || c.username} size={32} />
              <View className="flex-1 ml-2.5">
                <Text className="text-[#8fb4ff] text-[12px] font-bold">@{c.username}</Text>
                <Text className="text-white text-[13px] mt-0.5">{c.content}</Text>
              </View>
              {(c.is_owner || moment.user_id === viewerId) && (
                <Pressable onPress={() => del(c)} hitSlop={8} className="mt-2"><Ionicons name="trash-outline" size={15} color="#7f8b9b" /></Pressable>
              )}
            </View>
          ))}
        </ScrollView>
        <View className="flex-row items-center gap-2 px-4 pt-3 border-t border-white/10 mt-3">
          <TextInput value={draft} onChangeText={setDraft} maxLength={2000} placeholder="Add a comment…" placeholderTextColor="#5d6a80"
            className="flex-1 h-11 px-4 rounded-full bg-white/8 border border-white/10 text-white text-[14px]" />
          <Pressable onPress={send} disabled={!draft.trim() || sending}
            className={`w-11 h-11 rounded-full items-center justify-center ${draft.trim() && !sending ? "bg-[#247cff]" : "bg-white/10"}`}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={18} color={draft.trim() ? "#fff" : "#5d6a80"} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
};

const ReactionSheet = ({ visible, moment, onClose, onPick }) => (
  <Sheet visible={visible} onClose={onClose} title="React">
    <View className="flex-row flex-wrap px-5 gap-3">
      {REACTION_SET.map((e) => (
        <Pressable key={e} onPress={() => onPick(e)}
          className={`w-14 h-14 rounded-full items-center justify-center ${moment?.my_reaction === e ? "bg-[#247cff]/30 border border-[#247cff]" : "bg-white/8 border border-white/12"}`}>
          <Text style={{ fontSize: 26 }}>{e}</Text>
        </Pressable>
      ))}
    </View>
  </Sheet>
);

const ViewsSheet = ({ visible, moment, onClose }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!visible) return;
    setLoading(true); setErr("");
    MomentsAPI.viewers(moment.id).then((d) => setList(d.viewers || [])).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [visible, moment.id]);

  return (
    <Sheet visible={visible} onClose={onClose} title={`Views (${moment?.views_count || 0})`}>
      <ScrollView style={{ maxHeight: 380 }} contentContainerClassName="px-5 gap-3">
        {loading && <ActivityIndicator color="#247cff" />}
        {err && <Text className="text-[#ff6b6b] text-[12px] text-center py-6">{err}</Text>}
        {!loading && !err && !list.length && <Text className="text-[#71809a] text-center py-6 text-[12px]">No views yet.</Text>}
        {list.map((v) => (
          <View key={v.user_id} className="flex-row items-center">
            <Avatar uri={v.profile_photo} name={v.name || v.username} size={36} />
            <View className="ml-3 flex-1">
              <Text className="text-white text-[13px] font-semibold" numberOfLines={1}>{v.name || v.username}</Text>
              <Text className="text-[#71809a] text-[11px]" numberOfLines={1}>@{v.username} · {when(v.viewed_at)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
};

const MoreSheet = ({ visible, isMine, moment, muted, onToggleMute, onClose, onShare, onArchive, onDelete, onReport }) => (
  <Sheet visible={visible} onClose={onClose} title="More">
    <View className="px-3">
      {moment?.moment_type === "video" && (
        <Row icon={muted ? "volume-mute-outline" : "volume-high-outline"} label={muted ? "Unmute" : "Mute"} onPress={() => { onToggleMute(); onClose(); }} />
      )}
      <Row icon="share-outline" label="Share" onPress={() => { onClose(); onShare(); }} />
      
      {isMine && (
        <>
          <Row icon="archive-outline" label="Archive" onPress={onArchive} />
          <Row icon="trash-outline" label="Delete" danger onPress={onDelete} />
        </>
      )}
      
      {!isMine && (
        <Row icon="flag-outline" label="Report" danger onPress={onReport} />
      )}
    </View>
  </Sheet>
);

const Row = ({ icon, label, onPress, danger }) => (
  <Pressable onPress={onPress} className="flex-row items-center h-14 px-3 rounded-xl active:bg-white/5">
    <View className={`w-9 h-9 rounded-xl items-center justify-center ${danger ? "bg-red-500/15" : "bg-white/8"}`}>
      <Ionicons name={icon} size={18} color={danger ? "#ff6b6b" : "#dbe4f3"} />
    </View>
    <Text className={`ml-3 text-[15px] font-medium ${danger ? "text-danger" : "text-ink"}`}>{label}</Text>
  </Pressable>
);