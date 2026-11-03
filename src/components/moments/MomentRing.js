import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";
import { absUrl } from "../../api/client";

export default function MomentRing({ group, onPress, onAdd, isFirst }) {
  const hasMoments = group?.moments?.length > 0;
  const isMine = group?.is_mine;
  const unviewed = group?.has_unviewed;

  return (
    <Pressable onPress={onPress} className="items-center active:opacity-80">
      <View style={{ width: 74, height: 74 }} className="items-center justify-center">
        <View
          style={{
            width: 70, height: 70, borderRadius: 35, padding: 2.5,
            backgroundColor: !hasMoments
              ? "rgba(255,255,255,0.12)"
              : unviewed ? "#ff6b9d" : "#5a6675",
          }}
        >
          <View style={{ flex: 1, borderRadius: 32, overflow: "hidden",
                         backgroundColor: "#0f172a", borderWidth: 3,
                         borderColor: "#05070b" }}>
            {group?.profile_photo
              ? <Image source={{ uri: absUrl(group.profile_photo) }}
                       style={{ width: "100%", height: "100%" }} />
              : <View className="flex-1 items-center justify-center">
                  <Text className="text-white font-bold" style={{ fontSize: 24 }}>
                    {(group?.name || group?.username || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>}
          </View>
        </View>
        {isMine && onAdd && (
          <Pressable onPress={onAdd}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#247cff]
                       items-center justify-center border-2 border-[#05070b] active:opacity-80">
            <Ionicons name="add" size={14} color="#fff" />
          </Pressable>
        )}
      </View>
      <Text className="text-[#d9e1eb] text-[11px] mt-1 font-medium max-w-[76px]"
            numberOfLines={1}>
        {isMine ? "You" : group?.username || group?.name || ""}
      </Text>
    </Pressable>
  );
}