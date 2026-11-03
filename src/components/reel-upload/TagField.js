import React from "react";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const Field = ({ label, hint, children }) => (
  <View className="mt-6">
    <View className="flex-row items-baseline justify-between mb-2.5 px-1">
      <Text className="text-white text-[15px] font-bold">{label}</Text>
      {hint ? <Text className="text-[#6f8295] text-[11px]">{hint}</Text> : null}
    </View>
    {children}
  </View>
);

export const inputBase = "rounded-2xl border border-white/10 bg-[#0d1522] text-white text-[14px] px-4";

export const parseTags = (s) =>
  (s || "").split(/[\s,]+/).filter(Boolean).slice(0, 12).map((t) => (t.startsWith("#") ? t : `#${t}`));

export default function TagField({ label, icon, placeholder, value, onChange, chips }) {
  return (
    <View className="flex-row items-center rounded-2xl border border-white/10 bg-[#0d1522] px-4">
      <Ionicons name={icon} size={18} color="#6f8295" />
      <TextInput value={value} onChangeText={onChange} maxLength={2000} autoCapitalize="none"
        placeholder={placeholder} placeholderTextColor="#6f8295"
        className="flex-1 h-12 ml-2.5 text-white text-[14px]" />
    </View>
  );
}

export const TagChips = ({ chips }) => {
  if (!chips.length) return null;
  return (
    <View className="flex-row flex-wrap gap-1.5 mt-2.5 px-0.5">
      {chips.map((t, i) => (
        <View key={`${t}${i}`} className="px-2.5 py-1 rounded-full bg-[#168cff]/12 border border-[#168cff]/30">
          <Text className="text-brandLight text-[12px] font-semibold">{t}</Text>
        </View>
      ))}
    </View>
  );
};