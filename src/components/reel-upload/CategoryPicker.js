import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { id: "reels", icon: "film-outline" },
  { id: "entertainment", icon: "sparkles-outline" },
  { id: "education", icon: "school-outline" },
  { id: "music", icon: "musical-notes-outline" },
  { id: "sports", icon: "basketball-outline" },
  { id: "technology", icon: "hardware-chip-outline" },
  { id: "lifestyle", icon: "leaf-outline" },
  { id: "comedy", icon: "happy-outline" },
];

export default function CategoryPicker({ value, onChange, busy }) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {CATEGORIES.map((c) => {
        const on = value === c.id;
        return (
          <Pressable key={c.id} onPress={() => onChange(c.id)} disabled={busy}
            className={`flex-row items-center pl-3 pr-4 h-11 rounded-full border active:opacity-80 ${on ? "bg-[#102f4b] border-[#168cff]" : "bg-[#0d1522] border-white/10"}`}>
            <Ionicons name={c.icon} size={16} color={on ? "#4aa8ff" : "#7f8fa3"} />
            <Text className={`ml-2 text-[13px] capitalize ${on ? "text-white font-bold" : "text-[#9eafc0] font-medium"}`}>{c.id}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}