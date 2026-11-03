import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati"];

export default function LanguagePicker({ value, onChange, busy }) {
  return (
    <>
      <View className="flex-row items-center rounded-2xl border border-white/10 bg-[#0d1522] px-4">
        <Ionicons name="language-outline" size={18} color="#6f8295" />
        <TextInput value={value} onChangeText={onChange} maxLength={50} editable={!busy}
          placeholder="e.g. Hindi, English" placeholderTextColor="#6f8295"
          className="flex-1 h-12 ml-2.5 text-white text-[14px]" />
      </View>
      <View className="flex-row flex-wrap gap-2 mt-2.5">
        {LANGUAGES.map((l) => {
          const on = value.trim().toLowerCase() === l.toLowerCase();
          return (
            <Pressable key={l} onPress={() => onChange(l)} disabled={busy}
              className={`px-3.5 py-1.5 rounded-full border ${on ? "bg-[#102f4b] border-[#168cff]" : "bg-white/5 border-white/10"}`}>
              <Text className={`text-[12px] ${on ? "text-white font-bold" : "text-[#9eafc0] font-medium"}`}>{l}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}