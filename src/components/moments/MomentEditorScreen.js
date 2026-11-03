import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, Alert, Image,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { MomentsAPI } from "../../api/moments";
import AudienceSheet from "./AudienceSheet";
import { THEME_COLORS } from "./momentUtils";

const TYPES = [
  ["text",         "Text",       "text-outline"],
  ["image",        "Photo",      "image-outline"],
  ["video",        "Video",      "videocam-outline"],
  ["gif",          "GIF",        "film-outline"],
  ["countdown",    "Countdown",  "timer-outline"],
  ["emoji_slider", "Emoji slider","happy-outline"],
];

export default function MomentEditorScreen({ navigation, route }) {
  const [type, setType] = useState("text");
  const [caption, setCaption] = useState("");
  const [themeIdx, setThemeIdx] = useState(0);
  const [asset, setAsset] = useState(null);
  const [gifUrl, setGifUrl] = useState("");
  const [countdownTitle, setCountdownTitle] = useState("");
  const [countdownDate, setCountdownDate] = useState("");
  const [sliderEmoji, setSliderEmoji] = useState("❤️");
  const [sliderValue, setSliderValue] = useState(50);
  const [audience, setAudience] = useState("connections");
  const [selected, setSelected] = useState([]);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  
  // ── Toast State ──
  const [toast, setToast] = useState(null); 
  const abortRef = useRef(null);

  const pickMedia = async (mediaType) => {
    try {
      const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!p.granted) return Alert.alert("Permission needed", "Allow library access.");
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType === "video"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (r.canceled) return;
      setAsset(r.assets[0]);
    } catch (e) { Alert.alert("Picker failed", e.message); }
  };

  const buildForm = async () => {
    const uri = asset.uri;
    const isVideo = type === "video";
    
    let filename = asset.fileName;
    if (!filename) {
      let ext = isVideo ? "mp4" : "jpg";
      if (asset.mimeType) {
        ext = asset.mimeType.split("/")[1] || ext;
      }
      filename = `moment_${Date.now()}.${ext}`;
    }
    if (!/\.\w+$/.test(filename)) filename += isVideo ? ".mp4" : ".jpg";

    const mime = asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg");
    const fd = new FormData();
    
    if (Platform.OS === "web") {
      let blob;
      if (asset.file) blob = asset.file;
      else { const resp = await fetch(uri); blob = await resp.blob(); }
      const fileObj = new File([blob], filename, { type: mime });
      fd.append("file", fileObj, filename);
    } else {
      fd.append("file", { uri, name: filename, type: mime });
    }
    
    if (caption.trim()) fd.append("caption", caption.trim());
    fd.append("audience", audience);
    fd.append("moment_scope", "normal");
    selected.forEach((id) => fd.append("selected_user_ids", id));
    return fd;
  };

  const publish = async () => {
    setBusy(true);
    setToast(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      if (type === "image" || type === "video") {
        if (!asset) throw new Error("Pick a photo or video first.");
        const fd = await buildForm();
        await MomentsAPI.upload(fd);
      } else {
        const metadata = {};
        if (type === "text") {
          metadata.color = THEME_COLORS[themeIdx][1];
          metadata.background = THEME_COLORS[themeIdx][0];
        }
        if (type === "gif") {
          if (!gifUrl.trim()) throw new Error("GIF URL is required.");
        }
        if (type === "countdown") {
          if (!countdownDate.trim()) throw new Error("Enter target date.");
          metadata.title = countdownTitle.trim();
          metadata.target_date = countdownDate.trim();
        }
        if (type === "emoji_slider") {
          metadata.emoji = sliderEmoji;
          metadata.slider_value = sliderValue;
        }
        await MomentsAPI.create({
          moment_type: type,
          caption: caption.trim(),
          audience,
          moment_scope: "normal",
          selected_user_ids: audience === "selected_people" ? selected : [],
          metadata,
          gif_url: type === "gif" ? gifUrl.trim() : null,
        });
      }
      
      // SUCCESS TOAST
      setToast({ type: "success", msg: "Moment shared successfully!" });
      setTimeout(() => {
        setToast(null);
        navigation.goBack();
      }, 1500);

    } catch (e) {
      if (e.name !== "AbortError") {
        // ERROR TOAST
        setToast({ type: "error", msg: e.message || "Publish failed" });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      abortRef.current = null; setBusy(false);
    }
  };

  const canPublish =
    (type === "text" && caption.trim().length > 0) ||
    (type === "image" && !!asset) ||
    (type === "video" && !!asset) ||
    (type === "gif" && gifUrl.trim().length > 0) ||
    (type === "countdown" && countdownTitle.trim() && countdownDate.trim()) ||
    (type === "emoji_slider" && !!sliderEmoji);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="h-14 flex-row items-center justify-between px-3">
        <Pressable onPress={() => navigation.goBack()} disabled={busy}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:opacity-70">
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <Text className="text-white text-[16px] font-bold">New moment</Text>
        <Pressable onPress={publish} disabled={!canPublish || busy}
          className={`px-4 h-10 rounded-full items-center justify-center
            ${canPublish && !busy ? "bg-[#247cff]" : "bg-white/10"}`}>
          {busy ? <ActivityIndicator color="#fff" size="small" />
            : <Text className={`text-[13px] font-bold
              ${canPublish ? "text-white" : "text-[#5d6a80]"}`}>Share</Text>}
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-4 pt-2 pb-24" keyboardShouldPersistTaps="handled">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
            {TYPES.map(([k, label, icon]) => {
              const on = type === k;
              return (
                <Pressable key={k} onPress={() => setType(k)} disabled={busy}
                  className={`flex-row items-center h-10 pl-3 pr-4 rounded-full border
                    ${on ? "bg-[#102f4b] border-[#247cff]" : "bg-white/6 border-white/10"}`}>
                  <Ionicons name={icon} size={16} color={on ? "#6aa8ff" : "#8f9bb0"} />
                  <Text className={`ml-2 text-[12px] font-bold
                    ${on ? "text-white" : "text-[#9aa7bb]"}`}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {type === "text" && (
            <View style={{
              backgroundColor: THEME_COLORS[themeIdx][0],
              minHeight: 280, borderRadius: 24,
              alignItems: "center", justifyContent: "center", padding: 24,
            }}>
              <TextInput value={caption} onChangeText={setCaption} multiline
                maxLength={500} placeholder="What's on your mind?"
                placeholderTextColor="#ffffff88"
                style={{ color: THEME_COLORS[themeIdx][1], fontSize: 22,
                         fontWeight: "700", textAlign: "center", width: "100%" }} />
              <View className="flex-row gap-2 mt-4">
                {THEME_COLORS.map((c, i) => (
                  <Pressable key={i} onPress={() => setThemeIdx(i)}
                    style={{ width: 26, height: 26, borderRadius: 13,
                             backgroundColor: c[0], borderWidth: 2,
                             borderColor: themeIdx === i ? "#fff" : "transparent" }} />
                ))}
              </View>
            </View>
          )}

          {type === "image" && (
            <Pressable onPress={() => pickMedia("image")}
              className="rounded-3xl overflow-hidden bg-[#0f172a] items-center justify-center"
              style={{ minHeight: 280 }}>
              {asset
                ? <Image source={{ uri: asset.uri }} style={{ width: "100%", height: 320, borderRadius: 24 }} resizeMode="cover" />
                : <>
                    <Ionicons name="image-outline" size={40} color="#6aa8ff" />
                    <Text className="text-white text-[15px] font-bold mt-3">Pick a photo</Text>
                  </>}
            </Pressable>
          )}

          {type === "video" && (
            <Pressable onPress={() => pickMedia("video")}
              className="rounded-3xl bg-[#0f172a] items-center justify-center"
              style={{ minHeight: 280 }}>
              {asset
                ? <Text className="text-white text-[13px] px-4">{asset.fileName || "Video selected"}</Text>
                : <>
                    <Ionicons name="videocam-outline" size={40} color="#6aa8ff" />
                    <Text className="text-white text-[15px] font-bold mt-3">Pick a video</Text>
                  </>}
            </Pressable>
          )}

          {type === "gif" && (
            <View>
              <Text className="text-[#9aa7bb] text-[12px] mb-2">GIF URL</Text>
              <TextInput value={gifUrl} onChangeText={setGifUrl}
                placeholder="https://…giphy.gif" placeholderTextColor="#5d6a80"
                autoCapitalize="none" autoCorrect={false}
                className="h-12 px-4 rounded-2xl bg-white/6 border border-white/10 text-white" />
            </View>
          )}

          {type === "countdown" && (
            <View className="gap-3">
              <TextInput value={countdownTitle} onChangeText={setCountdownTitle}
                placeholder="What's the countdown for?" placeholderTextColor="#5d6a80"
                className="h-12 px-4 rounded-2xl bg-white/6 border border-white/10 text-white" />
              <TextInput value={countdownDate} onChangeText={setCountdownDate}
                placeholder="Target date (YYYY-MM-DD or ISO)" placeholderTextColor="#5d6a80"
                className="h-12 px-4 rounded-2xl bg-white/6 border border-white/10 text-white" />
            </View>
          )}

          {type === "emoji_slider" && (
            <View className="items-center gap-4 py-6">
              <Text style={{ fontSize: 72 }}>{sliderEmoji}</Text>
              <View className="flex-row gap-3">
                {["❤️", "😂", "😮", "😢", "🔥"].map((e) => (
                  <Pressable key={e} onPress={() => setSliderEmoji(e)}
                    className={`w-12 h-12 rounded-full items-center justify-center
                      ${sliderEmoji === e ? "bg-[#247cff]/30 border border-[#247cff]"
                                          : "bg-white/6 border border-white/10"}`}>
                    <Text style={{ fontSize: 24 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="w-full h-3 rounded-full bg-white/10">
                <View className="h-full rounded-full bg-[#247cff]" style={{ width: `${sliderValue}%` }} />
              </View>
            </View>
          )}

          {type !== "text" && (
            <View className="mt-4">
              <Text className="text-[#9aa7bb] text-[12px] mb-2">Caption</Text>
              <TextInput value={caption} onChangeText={setCaption} multiline
                maxLength={2000} placeholder="Say something…"
                placeholderTextColor="#5d6a80"
                style={{ textAlignVertical: "top" }}
                className="min-h-[80px] px-4 py-3 rounded-2xl bg-white/6 border border-white/10 text-white" />
            </View>
          )}

          <Pressable onPress={() => setAudienceOpen(true)}
            className="mt-4 flex-row items-center px-4 py-3 rounded-2xl bg-white/6 border border-white/10 active:opacity-80">
            <Ionicons name="people-outline" size={18} color="#8fb4ff" />
            <View className="flex-1 ml-3">
              <Text className="text-white text-[13px] font-semibold">
                {audience === "selected_people"
                  ? `${selected.length} selected`
                  : audience.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
              <Text className="text-[#71809a] text-[11px]">Who can see this?</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8493ab" />
          </Pressable>

          {busy && (
            <Pressable onPress={() => abortRef.current?.abort()}
              className="mt-4 self-center h-10 px-5 rounded-full bg-red-500/15 border border-red-500/30 flex-row items-center active:opacity-70">
              <Ionicons name="close-circle-outline" size={16} color="#ff6b6b" />
              <Text className="text-[#ff6b6b] font-bold text-[12px] ml-2">Cancel upload</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <AudienceSheet visible={audienceOpen} initialAudience={audience} initialSelected={selected}
        onClose={() => setAudienceOpen(false)}
        onSave={({ audience: a, selected_user_ids }) => {
          setAudience(a); setSelected(selected_user_ids);
        }} />

      {/* ── SHARE SUCCESS/ERROR TOAST ── */}
      {toast && (
        <View className="absolute top-1/2 left-0 right-0 items-center justify-center z-50 pointer-events-none">
          <View className="bg-black/90 px-6 py-4 rounded-2xl items-center border border-white/20 shadow-xl">
            <Ionicons 
              name={toast.type === "success" ? "checkmark-circle" : "alert-circle"} 
              size={44} 
              color={toast.type === "success" ? "#43d9a3" : "#ff6b6b"} 
            />
            <Text className="text-white font-bold mt-2 text-[14px]">{toast.msg}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}