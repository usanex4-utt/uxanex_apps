import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";
import { parseTime } from "../chat/chatUtils";

export default function CoupleHeader({ partner, onBack, conn, typing, online, lastSeen, mood, accent }) {
  const live = conn === "open" && (online || typing);
  const status = conn === "denied" ? "Unavailable"
    : conn !== "open" ? (conn === "connecting" ? "Connecting…" : "Reconnecting…")
    : typing ? "typing…"
    : online ? "online"
    : (() => {
        const d = parseTime(lastSeen);
        return d ? `last seen ${d.toLocaleDateString([], { day: "numeric", month: "short" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Couple chat";
      })();

  return (
    <View className="h-[64px] flex-row items-center px-3 border-b border-black/5 bg-white/95">
      <Pressable onPress={onBack} className="w-10 h-10 rounded-full bg-black/5 items-center justify-center active:opacity-70">
        <Ionicons name="chevron-back" size={22} color="#382b3b" />
      </Pressable>
      <View className="ml-2.5">
        <View className="p-0.5 rounded-full border-2" style={{ borderColor: live ? "#2f9e6a" : `${accent}66` }}>
          <Avatar uri={partner.profile_photo} name={partner.name || "P"} size={36} />
        </View>
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-[#382b3b] text-[16px] font-bold" numberOfLines={1}>{partner.name || partner.username || "Partner"}</Text>
        <Text className="text-[12px] mt-0.5" numberOfLines={1} style={{ color: live ? "#2f9e6a" : "#968b98" }}>{status}</Text>
      </View>
      <View className="flex-row items-center pl-3 pr-3 h-9 rounded-full" style={{ backgroundColor: accent }}>
        <Text className="text-white text-[12px] font-bold">{mood[1]}</Text>
      </View>
    </View>
  );
}