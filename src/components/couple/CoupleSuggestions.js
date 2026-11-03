import React from "react";
import { View, Text, Pressable, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AI_ACTIONS } from "./coupleUtils";

export function SuggestionsStrip({ suggestions, accent, onPick, onClose }) {
  if (!suggestions.length) return null;
  return (
    <View className="px-3.5 pb-2.5">
      <View className="flex-row items-center justify-between mb-2 px-0.5">
        <View className="flex-row items-center">
          <Ionicons name="sparkles" size={13} color={accent} />
          <Text className="text-[#968b98] text-[12px] font-semibold ml-1.5">Suggestions</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} className="w-6 h-6 rounded-full bg-black/5 items-center justify-center">
          <Ionicons name="close" size={14} color="#968b98" />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {suggestions.map((s, i) => (
          <Pressable key={i} onPress={() => onPick(s)}
            className="px-4 py-2.5 rounded-2xl bg-white border active:opacity-70" style={{ borderColor: accent }}>
            <Text className="text-[#382b3b] text-[13px]">{s}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function CoupleAssistantModal({ visible, onClose, accent, onAction }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-center px-6" onPress={onClose}>
        <Pressable className="bg-white rounded-[28px] p-5" onPress={() => {}}>
          <View className="items-center mb-4">
            <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: `${accent}1F` }}>
              <Ionicons name="sparkles" size={26} color={accent} />
            </View>
            <Text className="text-[#382b3b] text-[20px] font-extrabold tracking-tight">Couple assistant</Text>
            <Text className="text-[#968b98] text-[12px] mt-1">What would you like help with?</Text>
          </View>
          <View className="gap-2.5">
            {AI_ACTIONS.map(([k, l, d, ic]) => (
              <Pressable key={k} onPress={() => onAction(k)}
                className="flex-row items-center p-3.5 rounded-2xl border active:opacity-70"
                style={{ borderColor: `${accent}40`, backgroundColor: `${accent}0F` }}>
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: accent }}>
                  <Ionicons name={ic} size={20} color="#fff" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-[#382b3b] text-[14px] font-bold">{l}</Text>
                  <Text className="text-[#968b98] text-[11px] mt-0.5">{d}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={accent} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}