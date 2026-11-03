import React from "react";
import { View, Text, Pressable, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { absUrl } from "../../api/client";
import { parseTime } from "../chat/chatUtils";

const tick = (x) =>
  x.status === "seen" ? ["checkmark-done", "#e8f9ff"]
  : x.status === "delivered" ? ["checkmark-done", "rgba(255,255,255,0.75)"]
  : x.status === "sent" ? ["checkmark", "rgba(255,255,255,0.75)"]
  : ["time-outline", "rgba(255,255,255,0.75)"];

export default function CoupleMessage({ item, user, accent }) {
  const mine = item.sender_id === user.id;
  const [ti, tc] = mine ? tick(item) : [];
  const t = parseTime(item.created_at)?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const url = absUrl(item.media_url);
  const isImg = item.media_type === "image";
  const isVid = item.media_type === "video";
  const hasMedia = item.media_url && (isImg || isVid);

  return (
    <View className={`max-w-[80%] rounded-[22px] overflow-hidden ${hasMedia && !item.content ? "p-1" : "px-4 pt-2.5 pb-2"} ${mine ? "self-end rounded-br-md" : "self-start bg-white border border-black/5 rounded-bl-md"} ${item.pending ? "opacity-70" : ""}`}
      style={mine ? { backgroundColor: accent } : undefined}>
      {isImg ? (
        <Pressable onPress={() => Linking.openURL(url)}>
          <Image source={{ uri: url }} className="w-[200px] h-[200px] rounded-xl mb-1" resizeMode="cover" />
        </Pressable>
      ) : null}
      {isVid ? (
        <Video source={{ uri: url }} useNativeControls resizeMode={ResizeMode.CONTAIN}
          style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 4, backgroundColor: "#000" }} />
      ) : null}
      {item.media_url && !isImg && !isVid ? (
        <Pressable onPress={() => Linking.openURL(url)}
          className="flex-row items-center mb-1.5 pr-3 py-2 pl-2 rounded-xl bg-black/10 active:opacity-70">
          <View className="w-8 h-8 rounded-lg bg-white/20 items-center justify-center">
            <Ionicons name={item.media_type === "audio" ? "musical-notes" : "document-text"} size={16} color={mine ? "#fff" : accent} />
          </View>
          <Text className={`text-[13px] font-semibold ml-2.5 ${mine ? "text-white" : "text-[#382b3b]"}`}>
            {item.media_type === "audio" ? "Play audio" : "Open file"}
          </Text>
        </Pressable>
      ) : null}
      {item.content ? <Text className={`text-[15px] leading-[21px] ${mine ? "text-white" : "text-[#382b3b]"}`}>{item.content}</Text> : null}
      <View className={`flex-row justify-end items-center gap-1 ${hasMedia && !item.content ? "pr-2 pb-1" : "mt-0.5"}`}>
        <Text className={`text-[10px] ${mine ? "text-white/75" : "text-[#968b98]"}`}>{t}</Text>
        {mine && <Ionicons name={ti} size={14} color={tc} />}
      </View>
    </View>
  );
}