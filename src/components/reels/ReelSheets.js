import React from "react";
import { View, Text, Modal, Pressable, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

const REPORT_REASONS = ["Spam", "Nudity", "Violence", "Hate or harassment", "False information", "Other"];
const fmt = (n) => { n = Number(n) || 0; if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`; return String(n); };

const SheetHandle = () => (
  <View className="items-center pt-2.5 pb-1"><View className="w-10 h-1 rounded-full bg-white/20" /></View>
);

const MenuRow = ({ icon, label, onPress, danger, chevron }) => (
  <Pressable onPress={onPress} className="flex-row items-center h-14 active:opacity-60">
    <View className={`w-9 h-9 rounded-xl items-center justify-center ${danger ? "bg-red-500/15" : "bg-white/8"}`}>
      <Ionicons name={icon} size={18} color={danger ? "#ff6b6b" : "#dbe4f3"} />
    </View>
    <Text className={`flex-1 ml-3 text-[15px] font-medium ${danger ? "text-danger" : "text-ink"}`}>{label}</Text>
    {chevron && <Ionicons name="chevron-forward" size={16} color="#5d6a80" />}
  </Pressable>
);

export const ReelCommentsSheet = ({ visible, sheet, onClose, comments, cLoading, draft, setDraft, sendComment, deleteComment, user }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
      <Pressable className="h-[72%] bg-[#0b1220] rounded-t-[28px] border-t border-white/10" onPress={() => {}}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          <SheetHandle />
          <View className="h-11 flex-row items-center justify-center border-b border-white/10">
            <Text className="text-white font-bold text-[15px]">Comments</Text>
            {sheet?.reel?.comment_count ? (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-white/10">
                <Text className="text-[#cfd8e6] text-[11px] font-semibold">{fmt(sheet.reel.comment_count)}</Text>
              </View>
            ) : null}
          </View>
          {cLoading ? <ActivityIndicator color="#247cff" className="mt-8" /> : (
            <FlatList data={comments} keyExtractor={(c) => String(c.id)} keyboardShouldPersistTaps="handled"
              contentContainerClassName="px-4 py-4 gap-4"
              ListEmptyComponent={
                <View className="items-center pt-10">
                  <Ionicons name="chatbubbles-outline" size={34} color="#5d6a80" />
                  <Text className="text-[#9aa7bb] text-[13px] mt-3">No comments yet. Start the conversation.</Text>
                </View>
              }
              renderItem={({ item: c }) => (
                <View className="flex-row items-start">
                  <Avatar uri={c.user?.profile_photo} name={c.user?.name || c.user?.username} size={36} />
                  <View className="flex-1 ml-3">
                    <View className="self-start max-w-full bg-[#121b2e] rounded-2xl rounded-tl-md px-3.5 py-2.5">
                      <Text className="text-[#8fb4ff] text-[12px] font-semibold mb-0.5">@{c.user?.username}</Text>
                      <Text className="text-white text-[14px] leading-5">{c.content}</Text>
                    </View>
                  </View>
                  {c.user_id === user.id && (
                    <Pressable onPress={() => deleteComment(c)} hitSlop={10} className="ml-2 mt-2 active:opacity-60">
                      <Ionicons name="trash-outline" size={17} color="#7f8b9b" />
                    </Pressable>
                  )}
                </View>
              )} />
          )}
          <View className="flex-row items-center gap-2.5 px-3.5 pt-2.5 pb-6 border-t border-white/10 bg-[#0b1220]">
            <TextInput value={draft} onChangeText={setDraft} maxLength={2000} placeholder="Add a comment…"
              placeholderTextColor="#71809a"
              className="flex-1 h-11 px-4 rounded-full bg-[#121b2e] border border-white/10 text-white text-[14px]"
              onSubmitEditing={sendComment} returnKeyType="send" />
            <Pressable onPress={sendComment} disabled={!draft.trim()}
              className={`w-11 h-11 rounded-full items-center justify-center ${draft.trim() ? "bg-brand active:opacity-80" : "bg-white/10"}`}>
              <Ionicons name="arrow-up" size={20} color={draft.trim() ? "#fff" : "#5d6a80"} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Pressable>
  </Modal>
);

export const ReelMenuSheet = ({ visible, sheet, setSheet, onClose, notInterested, report, remove, user }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
      <Pressable className="bg-[#0b1220] rounded-t-[28px] border-t border-white/10 px-5 pb-9" onPress={() => {}}>
        <SheetHandle />
        {sheet?.type === "report" ? (
          <>
            <View className="flex-row items-center pt-3 pb-2">
              <Pressable onPress={() => setSheet({ type: "menu", reel: sheet.reel })} hitSlop={10} className="mr-3 active:opacity-60">
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </Pressable>
              <Text className="text-white text-[17px] font-bold">Why are you reporting this?</Text>
            </View>
            <Text className="text-[#9aa7bb] text-[12px] mb-2">Your report is anonymous.</Text>
            {REPORT_REASONS.map((r) => (
              <MenuRow key={r} icon="flag-outline" label={r} chevron onPress={() => report(sheet.reel, r)} />
            ))}
          </>
        ) : (
          <>
            <View className="pt-2">
              {sheet?.reel?.user_id === user.id ? (
                <MenuRow icon="trash-outline" label="Delete reel" danger onPress={() => remove(sheet.reel)} />
              ) : (
                <>
                  <MenuRow icon="eye-off-outline" label="Not interested" onPress={() => notInterested(sheet.reel)} />
                  <MenuRow icon="flag-outline" label="Report" danger onPress={() => setSheet({ type: "report", reel: sheet.reel })} />
                </>
              )}
            </View>
            <Pressable onPress={onClose} className="h-12 mt-3 rounded-2xl bg-white/8 items-center justify-center active:opacity-70">
              <Text className="text-white text-[15px] font-semibold">Cancel</Text>
            </Pressable>
          </>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);