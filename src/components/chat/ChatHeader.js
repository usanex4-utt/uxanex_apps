import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

const Btn = ({ icon, onPress, active }) => (
  <Pressable onPress={onPress} hitSlop={6}
    className={`w-10 h-10 rounded-xl items-center justify-center active:opacity-70 ${active ? "bg-white/10" : ""}`}>
    <Ionicons name={icon} size={22} color="#e8eefc" />
  </Pressable>
);

export default function ChatHeader({ peer, name, status, live, online, error, searchOpen, query, setQuery, setSearchOpen, onMenu, onCall, onCouple, onBack, onProfile }) {
  if (searchOpen) {
    return (
      <View className="h-16 flex-row items-center px-3 border-b border-white/5 bg-[#0c1322]">
        <Btn icon="chevron-back" onPress={() => { setSearchOpen(false); setQuery(""); }} />
        <TextInput autoFocus value={query} onChangeText={setQuery} placeholder={`Search in chat with ${name}`}
          placeholderTextColor="#71809a" className="flex-1 mx-2 h-10 px-4 rounded-full bg-[#151e2f] text-white text-[14px]" />
        {query ? <Btn icon="close-circle" onPress={() => setQuery("")} /> : null}
      </View>
    );
  }

  return (
    <View className="h-16 flex-row items-center px-2 border-b border-white/5 bg-[#0c1322]">
      <Btn icon="chevron-back" onPress={onBack} />
      <Pressable onPress={onProfile} className="flex-row items-center flex-1 ml-1 active:opacity-80">
        <View>
          <Avatar uri={peer.profile_photo} name={name} size={42} />
          <View className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0c1322] ${online && !error ? "bg-[#43d9a3]" : "bg-[#5d6a80]"}`} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-white text-[16px] font-bold" numberOfLines={1}>{name}</Text>
          <Text className={`text-[12px] mt-0.5 ${live ? "text-[#43d9a3] font-medium" : "text-[#8493ab]"}`} numberOfLines={1}>{status}</Text>
        </View>
      </Pressable>
      <Btn icon="heart-circle-outline" onPress={onCouple} />
      <Btn icon="call-outline" onPress={onCall} />
      <Btn icon="ellipsis-horizontal" onPress={onMenu} />
    </View>
  );
}