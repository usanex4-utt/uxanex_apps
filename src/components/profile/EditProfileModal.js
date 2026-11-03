import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";

const FIELDS = [
  ["name", "Name", 100, "person-outline"],
  ["bio", "Bio", 500, "create-outline"],
  ["website", "Website", 500, "globe-outline"],
  ["instagram", "Instagram", 500, "logo-instagram"],
  ["social_link", "Other link", 500, "link-outline"],
];

export default function EditProfileModal({ visible, onClose, form, setForm, saving, onSave, onChangePhoto, u }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-[#050b18]">
        <View className="h-16 flex-row items-center justify-between px-4 border-b border-white/8">
          <Pressable onPress={onClose} disabled={saving} className="h-10 px-1 justify-center active:opacity-60">
            <Text className="text-[#9aa7bb] text-[15px] font-medium">Cancel</Text>
          </Pressable>
          <Text className="text-white text-[17px] font-extrabold tracking-tight">Edit profile</Text>
          <Pressable onPress={onSave} disabled={saving} className="h-10 px-5 rounded-full bg-[#1685ff] items-center justify-center min-w-[72px] active:opacity-80">
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white text-[14px] font-bold">Save</Text>}
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          <ScrollView contentContainerClassName="px-4 pt-6 pb-16" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="items-center mb-6">
              <Pressable onPress={onChangePhoto} className="items-center justify-center active:opacity-90">
                <View className="rounded-full p-[3px] bg-brand" style={{ width: 96, height: 96 }}>
                  {u?.profile_photo ? <Image source={{ uri: absUrl(u.profile_photo) }} className="w-full h-full rounded-full bg-[#0d1729]" />
                    : <View className="w-full h-full rounded-full bg-[#0d1729] items-center justify-center">
                        <Text className="text-white text-4xl font-extrabold">{(u?.name || "U").charAt(0).toUpperCase()}</Text>
                      </View>}
                </View>
                <View className="absolute right-0 bottom-1 w-8 h-8 rounded-full bg-brand items-center justify-center border-[3px] border-[#050b18]">
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </Pressable>
              <Pressable onPress={onChangePhoto} className="mt-3 h-9 px-4 rounded-full bg-white/6 border border-white/10 flex-row items-center justify-center active:opacity-70">
                <Ionicons name="image-outline" size={15} color="#6aa8ff" />
                <Text className="text-brandLight text-[13px] font-semibold ml-1.5">Change profile photo</Text>
              </Pressable>
            </View>
            {FIELDS.map(([k, l, max, ic]) => (
              <View key={k} className="mb-4">
                <View className="flex-row items-baseline justify-between mb-2 px-1">
                  <Text className="text-white text-[14px] font-bold">{l}</Text>
                  {k === "bio" ? <Text className="text-[#64748a] text-[11px]">{(form.bio || "").length}/{max}</Text> : null}
                </View>
                <View className={`flex-row rounded-2xl border border-white/10 bg-[#0a1424] px-4 ${k === "bio" ? "items-start" : "items-center"}`}>
                  <View className={k === "bio" ? "pt-3.5" : ""}><Ionicons name={ic} size={18} color="#64748a" /></View>
                  <TextInput value={form[k] || ""} onChangeText={(v) => setForm({ ...form, [k]: v })} maxLength={max} editable={!saving}
                    multiline={k === "bio"} autoCapitalize={k === "name" || k === "bio" ? "sentences" : "none"}
                    placeholderTextColor="#64748a" placeholder={l}
                    className={`flex-1 ml-3 text-white text-[14px] ${k === "bio" ? "min-h-[104px] pt-3 pb-3" : "h-12"}`}
                    style={k === "bio" ? { textAlignVertical: "top" } : undefined} />
                </View>
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}