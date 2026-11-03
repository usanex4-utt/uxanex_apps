// src/components/moments/ConfirmDialog.js
import React from "react";
import { Modal, View, Text, Pressable } from "react-native";

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 bg-black/70 items-center justify-center px-6"
        onPress={onCancel}>
        <Pressable className="bg-[#0f172a] rounded-3xl w-full max-w-sm p-6 border border-white/10"
          onPress={() => {}}>
          <Text className="text-white text-[18px] font-bold mb-2">{title}</Text>
          <Text className="text-[#9aa7bb] text-[14px] leading-6 mb-6">{message}</Text>
          <View className="flex-row gap-3">
            <Pressable onPress={onCancel}
              className="flex-1 h-12 rounded-2xl bg-white/8 border border-white/10
                         items-center justify-center active:opacity-70">
              <Text className="text-white font-bold">{cancelText}</Text>
            </Pressable>
            <Pressable onPress={onConfirm}
              className={`flex-1 h-12 rounded-2xl items-center justify-center
                active:opacity-80 ${danger ? "bg-red-500" : "bg-[#247cff]"}`}>
              <Text className="text-white font-bold">{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}