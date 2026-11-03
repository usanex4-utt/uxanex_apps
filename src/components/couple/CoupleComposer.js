import React from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mmss } from "./coupleUtils";

export default function CoupleComposer({
  text, onChange, onSend, accent, canSend, uploading, recording, recMs,
  emojiOpen, attachOpen, onToggleEmoji, onToggleAttach, onCamera, onStartRec, onStopRec,
  onPickMedia, onPickDocument, onPickAudio, conn,
}) {
  return (
    <View className="px-3 pt-2.5 pb-3 bg-white/95 border-t border-black/5">
      {recording ? (
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => onStopRec(false)} className="w-11 h-11 rounded-full bg-black/5 items-center justify-center active:opacity-70">
            <Ionicons name="trash-outline" size={20} color="#e03131" />
          </Pressable>
          <View className="flex-1 h-12 rounded-[24px] bg-[#f6f2f6] border border-black/5 flex-row items-center px-4">
            <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-3" />
            <Text className="text-[#382b3b] text-[15px] font-medium">{mmss(recMs)}</Text>
            <Text className="text-[#968b98] text-[12px] ml-3">Recording…</Text>
          </View>
          <Pressable onPress={() => onStopRec(true)} className="w-12 h-12 rounded-2xl items-center justify-center active:opacity-80"
            style={{ backgroundColor: accent }}>
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-[24px] bg-[#f6f2f6] border border-black/5 pl-2 pr-1 min-h-[48px]">
            <Pressable onPress={onToggleEmoji} hitSlop={6} className="w-9 h-9 items-center justify-center active:opacity-70">
              <Ionicons name={emojiOpen ? "keypad-outline" : "happy-outline"} size={23} color="#968b98" />
            </Pressable>
            <TextInput value={text} onChangeText={onChange} multiline maxLength={4000}
              placeholder="Message…" placeholderTextColor="#968b98"
              className="flex-1 max-h-[120px] px-2 py-3 text-[#382b3b] text-[15px]" />
            <Pressable onPress={onCamera} hitSlop={6} className="w-9 h-9 items-center justify-center active:opacity-70">
              <Ionicons name="camera-outline" size={22} color="#968b98" />
            </Pressable>
            <Pressable onPress={onToggleAttach} hitSlop={6} className="w-9 h-9 items-center justify-center active:opacity-70">
              <Ionicons name="attach" size={24} color="#968b98" style={{ transform: [{ rotate: "45deg" }] }} />
            </Pressable>
            <Pressable onPress={onStartRec} hitSlop={6} className="w-9 h-9 items-center justify-center active:opacity-70">
              <Ionicons name="mic-outline" size={22} color="#968b98" />
            </Pressable>
          </View>
          <Pressable onPress={onSend} disabled={!canSend}
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: canSend ? accent : `${accent}55` }}>
            {uploading ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="paper-plane" size={20} color="#fff" />}
          </Pressable>
        </View>
      )}
      {attachOpen ? (
        <>
          <Pressable className="absolute inset-0 z-40" onPress={onToggleAttach} />
          <View className="absolute left-3 z-50 rounded-2xl bg-white border border-black/10 overflow-hidden shadow-lg"
            style={{ bottom: 78, width: 210, elevation: 12 }}>
            <Pressable onPress={onPickMedia} className="flex-row items-center px-4 py-3 active:bg-black/5 border-b border-black/5">
              <Ionicons name="images-outline" size={20} color={accent} />
              <Text className="ml-3 text-[#382b3b] text-[14px] font-medium">Photos & videos</Text>
            </Pressable>
            <Pressable onPress={onPickDocument} className="flex-row items-center px-4 py-3 active:bg-black/5 border-b border-black/5">
              <Ionicons name="document-text-outline" size={20} color={accent} />
              <Text className="ml-3 text-[#382b3b] text-[14px] font-medium">Document</Text>
            </Pressable>
            <Pressable onPress={onPickAudio} className="flex-row items-center px-4 py-3 active:bg-black/5">
              <Ionicons name="musical-notes-outline" size={20} color={accent} />
              <Text className="ml-3 text-[#382b3b] text-[14px] font-medium">Audio file</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}