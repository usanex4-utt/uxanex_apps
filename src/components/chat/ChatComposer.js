import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mmss } from "./chatUtils";

const MenuRow = ({ icon, title, sub, onPress }) => (
  <Pressable onPress={onPress} className="flex-row items-center px-5 py-3.5 active:bg-white/5">
    <Ionicons name={icon} size={19} color="#c4d2ea" />
    <View className="ml-4 flex-1">
      <Text className="text-[#f4f6fb] text-[15px] font-semibold">{title}</Text>
      {sub ? <Text className="text-[#8493ab] text-[11px] mt-0.5">{sub}</Text> : null}
    </View>
  </Pressable>
);

export default function ChatComposer({
  text, onChange, onSend, canSend, recording, recMs, emojiOpen, attachOpen,
  onToggleEmoji, onToggleAttach, onCamera, onStartRec, onStopRec,
  onPickMedia, onPickDocument, onPickAudio,
}) {
  return (
    <View className="px-3 pt-2 pb-1 bg-[#080c16]">
      {recording ? (
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => onStopRec(false)} className="w-11 h-11 rounded-full bg-white/8 items-center justify-center active:opacity-70">
            <Ionicons name="trash-outline" size={20} color="#ff8a8a" />
          </Pressable>
          <View className="flex-1 h-12 rounded-[24px] bg-[#121b2d] border border-white/8 flex-row items-center px-4">
            <View className="w-2.5 h-2.5 rounded-full bg-[#ff5f6d] mr-3" />
            <Text className="text-white text-[15px] font-medium">{mmss(recMs)}</Text>
            <Text className="text-[#8493ab] text-[12px] ml-3">Recording…</Text>
          </View>
          <Pressable onPress={() => onStopRec(true)} className="w-12 h-12 rounded-2xl bg-[#8bb8ff] items-center justify-center active:opacity-80">
            <Ionicons name="arrow-up" size={22} color="#090d18" />
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-[24px] bg-[#121b2d] border border-white/8 pl-2 pr-1 min-h-[48px]">
            <Pressable onPress={onToggleEmoji} hitSlop={6} className="w-9 h-9 items-center justify-center active:opacity-70">
              <Ionicons name={emojiOpen ? "keypad-outline" : "happy-outline"} size={23} color="#c4d2ea" />
            </Pressable>
            <TextInput value={text} onChangeText={onChange} multiline maxLength={10000}
              placeholder="Message…" placeholderTextColor="#71809a"
              className="flex-1 max-h-[120px] px-2 py-3 text-white text-[15px]" />
            <Pressable onPress={onCamera} hitSlop={6} className="w-9 h-9 items-center justify-center active:opacity-70">
              <Ionicons name="camera-outline" size={22} color="#c4d2ea" />
            </Pressable>
            <Pressable onPress={onToggleAttach} hitSlop={6} className="w-9 h-9 items-center justify-center active:opacity-70">
              <Ionicons name="attach" size={24} color="#c4d2ea" style={{ transform: [{ rotate: "45deg" }] }} />
            </Pressable>
            <Pressable onPress={onStartRec} hitSlop={6} className="w-9 h-9 items-center justify-center active:opacity-70">
              <Ionicons name="mic-outline" size={22} color="#c4d2ea" />
            </Pressable>
          </View>
          <Pressable onPress={onSend} disabled={!canSend}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${canSend ? "bg-[#8bb8ff] active:opacity-80" : "bg-[#1b2a45]"}`}>
            <Ionicons name="paper-plane" size={20} color={canSend ? "#090d18" : "#7f93b5"} />
          </Pressable>
        </View>
      )}
      <Text className="text-center text-[10px] text-[#5d6a80] mt-1.5">
        Private chat  ·  <Text className="text-[#8bb8ff]">UtaNexa</Text>
      </Text>

      {attachOpen ? (
        <>
          <Pressable className="absolute inset-0" onPress={onToggleAttach} />
          <View className="absolute left-3 rounded-2xl bg-[#101a2e] border border-white/8 overflow-hidden"
            style={{ bottom: 78, width: 210, elevation: 12 }}>
            <MenuRow icon="images-outline" title="Photos & videos" onPress={onPickMedia} />
            <MenuRow icon="document-text-outline" title="Document" onPress={onPickDocument} />
            <MenuRow icon="musical-notes-outline" title="Audio file" onPress={onPickAudio} />
          </View>
        </>
      ) : null}
    </View>
  );
}