import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_VIDEO_DURATION_S = 300;
const FORMATS = ["MP4", "MOV", "WebM", "MKV"];

const fmt = (ms) => {
  const s = Math.round((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function VideoPicker({ video, setVideo, busy }) {
  const pick = async () => {
    try {
      if (Platform.OS !== "web") {
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!p.granted) return Alert.alert("Permission needed", "Allow photo library access to choose a video.");
      }
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 1, videoMaxDuration: MAX_VIDEO_DURATION_S,
      });
      if (r.canceled) return;
      const asset = r.assets?.[0];
      if (!asset) return;
      if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
        return Alert.alert("Video too large", "Maximum allowed size is 2 GB. Please trim the clip and try again.");
      }
      setVideo(asset);
    } catch (e) { Alert.alert("Could not pick video", e?.message || "Unknown error"); }
  };

  const durationText = video ? fmt(video.duration) : null;
  const sizeText = video?.fileSize ? `${(video.fileSize / (1024 * 1024)).toFixed(1)} MB` : null;

  if (!video) {
    return (
      <Pressable onPress={pick} className="min-h-[300px] items-center justify-center px-6 py-8 rounded-[28px] border border-dashed border-[#168cff]/40 bg-[#0d1d2d]/70 active:opacity-80">
        <View className="w-24 h-24 rounded-full bg-[#168cff]/10 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-[#168cff]/20 border border-[#168cff]/40 items-center justify-center">
            <Ionicons name="videocam" size={30} color="#4aa8ff" />
          </View>
        </View>
        <Text className="text-white text-[22px] font-extrabold mt-5">Choose a video</Text>
        <Text className="text-[#91a5b8] text-[13px] text-center mt-1.5 mb-5">Pick a clip from your library to share with everyone.</Text>
        <View className="flex-row gap-2">
          {FORMATS.map((f) => (
            <View key={f} className="px-3 py-1 rounded-full bg-white/8 border border-white/10">
              <Text className="text-[#9eafc0] text-[11px] font-semibold">{f}</Text>
            </View>
          ))}
        </View>
        <View className="mt-6 h-12 px-6 rounded-full bg-[#168cff] flex-row items-center">
          <Ionicons name="images-outline" size={18} color="#fff" />
          <Text className="text-white font-bold ml-2">Open library</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View>
      <View className="rounded-[28px] overflow-hidden border border-white/10 bg-black">
        <Video source={{ uri: video.uri }} useNativeControls resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false} isLooping={false} isMuted={false}
          style={{ width: "100%", height: 420, backgroundColor: "#000" }} />
        <View pointerEvents="none" className="absolute top-3 left-3 flex-row items-center px-2.5 py-1 rounded-full bg-black/55 border border-white/15">
          <Ionicons name="time-outline" size={13} color="#fff" />
          <Text className="text-white text-[12px] font-semibold ml-1">{durationText}</Text>
        </View>
        {sizeText ? (
          <View pointerEvents="none" className="absolute top-3 right-3 flex-row items-center px-2.5 py-1 rounded-full bg-black/55 border border-white/15">
            <Ionicons name="cloud-outline" size={13} color="#fff" />
            <Text className="text-white text-[12px] font-semibold ml-1">{sizeText}</Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={pick} disabled={busy} className="self-center mt-3 h-10 px-5 rounded-full bg-white/8 border border-white/10 flex-row items-center active:opacity-70">
        <Ionicons name="swap-horizontal" size={16} color="#8fb4ff" />
        <Text className="text-brandLight text-[13px] font-semibold ml-2">Replace video</Text>
      </Pressable>
    </View>
  );
}