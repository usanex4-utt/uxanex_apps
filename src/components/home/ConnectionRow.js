import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

export default function ConnectionRow({ item, user, navigation, onLongPress }) {
  const fam = item.category === "family";
  return (
    <Pressable onPress={() => navigation.navigate("Chat", { user: item })} onLongPress={onLongPress}
      className="flex-row items-center mx-4 mb-3 p-3.5 rounded-3xl border border-white/8 bg-surface active:opacity-80">
      <Pressable onPress={() => {
          if (item.user_id === user?.user_id) navigation.navigate("Tabs", { screen: "Profile" });
          else navigation.navigate("UserProfile", { userId: item.user_id });
        }} className="active:opacity-80">
        <View className="p-0.5 rounded-full border border-brand/40">
          <Avatar uri={item.profile_photo} name={item.name || item.username} size={50} />
        </View>
      </Pressable>
      <View className="flex-1 ml-3.5">
        <Text className="text-ink text-[16px] font-bold" numberOfLines={1}>{item.name || item.username}</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-muted text-[12px] flex-shrink" numberOfLines={1}>@{item.username}</Text>
          {item.category ? (
            <View className={`ml-2 px-2 py-0.5 rounded-full border ${fam ? "bg-[#ed80dc]/12 border-[#ed80dc]/30" : "bg-brand/12 border-brand/30"}`}>
              <Text className={`text-[10px] font-bold capitalize ${fam ? "text-[#f29be4]" : "text-[#6aa8ff]"}`}>{item.category}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable onPress={() => navigation.navigate("CoupleChat", { user: item })} hitSlop={8}
        className="w-10 h-10 rounded-full bg-[#ed80dc]/12 border border-[#ed80dc]/25 items-center justify-center mr-2 active:opacity-70">
        <Ionicons name="heart" size={18} color="#ed80dc" />
      </Pressable>
      <View className="w-10 h-10 rounded-full bg-brand/15 border border-brand/30 items-center justify-center">
        <Ionicons name="chatbubble-ellipses" size={18} color="#4d94ff" />
      </View>
    </Pressable>
  );
}