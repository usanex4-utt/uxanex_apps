import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";

export default function ReelPlayerModal({ player, onClose, videoFocused, insets, isOwner, onDelete }) {
  return (
    <Modal visible={!!player} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        {player && (
          <Video key={`vp-${player.id}`} source={{ uri: absUrl(player.video_url) }} style={{ flex: 1 }}
            resizeMode={ResizeMode.CONTAIN} shouldPlay={videoFocused} isLooping useNativeControls />
        )}
        {player?.caption ? (
          <View pointerEvents="none" className="absolute left-4 right-4 bottom-12 px-4 py-3 rounded-2xl bg-black/55 border border-white/10">
            <Text className="text-white text-[14px] leading-5" numberOfLines={4}>{player.caption}</Text>
          </View>
        ) : null}
        
        {/* Close Button */}
        <Pressable onPress={onClose} style={{ top: insets.top + 8 }}
          className="absolute right-4 w-10 h-10 rounded-full bg-black/55 border border-white/20 items-center justify-center active:opacity-70">
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>

        {/* 🚀 FIXED: Delete Button (Ab video band nahi hogi, bas Confirm Modal khulega) */}
        {isOwner && onDelete && (
          <Pressable onPress={() => onDelete(player)} style={{ top: insets.top + 8 }}
            className="absolute left-4 w-10 h-10 rounded-full bg-red-500/80 border border-red-400 items-center justify-center active:opacity-70">
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
    </Modal>
  );
}