import React, { useState, useRef } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";
import VideoPicker from "../../components/reel-upload/VideoPicker";
import TagField, { Field, inputBase, parseTags, TagChips } from "../../components/reel-upload/TagField";
import CategoryPicker from "../../components/reel-upload/CategoryPicker";
import LanguagePicker from "../../components/reel-upload/LanguagePicker";

const MIME = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska" };

export default function ReelUploadScreen({ navigation }) {
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("reels");
  const [busy, setBusy] = useState(false);
  
  // ── Toast State ──
  const [toast, setToast] = useState(null);
  
  const abortRef = useRef(null);

  const buildFormData = async () => {
    const extFromUri = (video.uri.split("?")[0].split(".").pop() || "").toLowerCase();
    const extFromName = (video.fileName?.split(".").pop() || "").toLowerCase();
    const ext = MIME[extFromName] ? extFromName : MIME[extFromUri] ? extFromUri : "mp4";
    const filename = video.fileName && /\.\w+$/.test(video.fileName) ? video.fileName : `reel_${Date.now()}.${ext}`;
    const mimeType = video.mimeType && video.mimeType.startsWith("video/") ? video.mimeType : MIME[ext];
    const fd = new FormData();
    if (Platform.OS === "web") {
      let blob;
      if (video.file) blob = video.file;
      else { const resp = await fetch(video.uri); blob = await resp.blob(); }
      const fileObj = new File([blob], filename, { type: mimeType });
      fd.append("video", fileObj, filename);
    } else {
      fd.append("video", { uri: video.uri, name: filename, type: mimeType });
    }
    if (caption.trim()) fd.append("caption", caption.trim());
    if (hashtags.trim()) fd.append("hashtags", hashtags.trim());
    if (language.trim()) fd.append("language", language.trim());
    fd.append("category", category || "reels");
    return fd;
  };

  const post = async () => {
    if (!video || busy) return;
    setBusy(true);
    setToast(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    
    try {
      const fd = await buildFormData();
      await api(EP.reelUpload, { method: "POST", form: fd, signal: ctrl.signal });
      
      // SUCCESS TOAST
      setToast({ type: "success", msg: "Reel posted successfully!" });
      setTimeout(() => {
        setToast(null);
        navigation.navigate("Tabs", { screen: "Reels", params: { refresh: Date.now() } });
      }, 1500);

    } catch (e) {
      if (e?.name === "AbortError") return;
      // ERROR TOAST
      setToast({ type: "error", msg: e?.message || "Upload failed. Try again." });
      setTimeout(() => setToast(null), 3000);
    } finally {
      abortRef.current = null; setBusy(false);
    }
  };

  const cancelUpload = () => { abortRef.current?.abort(); abortRef.current = null; setBusy(false); };
  const canPost = !!video && !busy;
  const chips = parseTags(hashtags);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="h-16 flex-row items-center justify-between px-4">
        <Pressable onPress={() => navigation.goBack()} disabled={busy}
          className="w-10 h-10 rounded-full bg-white/8 border border-white/10 items-center justify-center active:opacity-70">
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="text-white text-[18px] font-extrabold tracking-tight">New reel</Text>
        <Pressable onPress={post} disabled={!canPost}
          className={`h-10 px-5 rounded-full items-center justify-center min-w-[78px] ${canPost ? "bg-[#168cff] active:opacity-80" : "bg-white/10"}`}>
          {busy ? <ActivityIndicator color="#fff" size="small" />
            : <Text className={`text-sm font-bold ${canPost ? "text-white" : "text-[#5d6a80]"}`}>Share</Text>}
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-4 pt-2 pb-16" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <VideoPicker video={video} setVideo={setVideo} busy={busy} />

          <Field label="Caption" hint={`${caption.length}/5000`}>
            <TextInput value={caption} onChangeText={setCaption} multiline maxLength={5000} editable={!busy}
              placeholder="Say something about your reel…" placeholderTextColor="#6f8295"
              style={{ textAlignVertical: "top" }}
              className={`${inputBase} min-h-[110px] pt-3.5 pb-3.5`} />
          </Field>

          <Field label="Hashtags">
            <TagField icon="pricetag-outline" placeholder="#travel #food" value={hashtags} onChange={setHashtags} />
            <TagChips chips={chips} />
          </Field>

          <Field label="Language">
            <LanguagePicker value={language} onChange={setLanguage} busy={busy} />
          </Field>

          <Field label="Category">
            <CategoryPicker value={category} onChange={setCategory} busy={busy} />
          </Field>

          <Pressable onPress={post} disabled={!canPost}
            className={`mt-9 h-14 rounded-2xl flex-row items-center justify-center ${canPost ? "bg-[#168cff] active:opacity-80" : "bg-white/8"}`}>
            {busy ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text className="text-white font-bold text-[15px] ml-3">Uploading…</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color={canPost ? "#fff" : "#5d6a80"} />
                <Text className={`font-bold text-[15px] ml-2 ${canPost ? "text-white" : "text-[#5d6a80]"}`}>
                  {video ? "Share reel" : "Select a video to share"}
                </Text>
              </>
            )}
          </Pressable>

          {busy && (
            <>
              <View className="flex-row items-center justify-center mt-4 px-4">
                <Ionicons name="information-circle-outline" size={15} color="#8d96a5" />
                <Text className="text-[#8d96a5] text-xs ml-1.5 flex-shrink">Large videos can take a while. Keep the app open.</Text>
              </View>
              <Pressable onPress={cancelUpload} className="mt-3 self-center h-10 px-5 rounded-full bg-red-500/15 border border-red-500/30 flex-row items-center active:opacity-70">
                <Ionicons name="close-circle-outline" size={16} color="#ff6b6b" />
                <Text className="text-[#ff6b6b] font-bold text-[13px] ml-2">Cancel upload</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── SUCCESS / ERROR TOAST ── */}
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