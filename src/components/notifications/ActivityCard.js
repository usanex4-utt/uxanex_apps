import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";
import { when, typeIcon, normType, normPhoto } from "./notificationUtils";

export default function ActivityCard({ notification: n, onPress }) {
  const [ic, col] = typeIcon(normType(n));
  const photo = normPhoto(n);
  return (
    <Pressable onPress={onPress}
      className={`flex-row items-center p-3.5 mb-2.5 rounded-3xl border active:opacity-80 ${n.is_read ? "bg-surface border-white/8" : "bg-brand/8 border-brand/35"}`}>
      <View>
        <Avatar uri={photo} name={n.sender_name || n.sender_username} size={46} />
        <View className="absolute -right-1 -bottom-1 w-[22px] h-[22px] rounded-full bg-[#070b12] items-center justify-center">
          <View className="w-[18px] h-[18px] rounded-full items-center justify-center" style={{ backgroundColor: col }}>
            <Ionicons name={ic} size={10} color="#fff" />
          </View>
        </View>
      </View>
      <View className="flex-1 ml-3.5">
        <Text className={`text-[14px] leading-5 ${n.is_read ? "text-[#b4c0d3]" : "text-white font-medium"}`}>{n.message}</Text>
        <Text className="text-faint text-[11px] mt-1">{when(n.created_at)}</Text>
      </View>
      {!n.is_read && <View className="w-2.5 h-2.5 rounded-full bg-brand ml-2.5" />}
    </Pressable>
  );
}