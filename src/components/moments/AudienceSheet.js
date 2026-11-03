import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, FlatList, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";
import { MomentsAPI } from "../../api/moments";

const AUDIENCES = [
  ["connections", "My connections", "people-outline"],
  ["following",   "People I follow", "person-add-outline"],
  ["followers",   "My followers",    "people-circle-outline"],
  ["selected_people", "Selected people", "list-outline"],
  ["only_me",     "Only me",         "lock-closed-outline"],
];

export default function AudienceSheet({ visible, initialAudience, initialSelected,
                                       onClose, onSave }) {
  const [audience, setAudience] = useState(initialAudience || "connections");
  const [selected, setSelected] = useState(initialSelected || []);
  const [showPeople, setShowPeople] = useState(false);
  const [tab, setTab] = useState("connections");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setAudience(initialAudience || "connections");
      setSelected(initialSelected || []);
      setShowPeople(initialAudience === "selected_people");
    }
  }, [visible, initialAudience, initialSelected]);

  useEffect(() => {
    if (!showPeople) return;
    setLoading(true);
    MomentsAPI.audienceUsers(tab)
      .then((d) => setUsers(d.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [showPeople, tab]);

  const toggle = (u) => {
    setSelected((s) => s.includes(u.user_id)
      ? s.filter((x) => x !== u.user_id)
      : [...s, u.user_id]);
  };

  const save = () => {
    if (audience === "selected_people" && !selected.length)
      return onSave && alert("Select at least one person.");
    onSave({ audience, selected_user_ids: selected });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-[#0b1220] rounded-t-[28px] border-t border-white/10
                              px-4 pt-2 pb-8" style={{ maxHeight: "88%" }}
          onPress={() => {}}>
          <View className="self-center w-9 h-1 rounded-full bg-white/20 my-3" />

          {!showPeople ? (
            <ScrollView>
              <Text className="text-white text-[18px] font-extrabold mb-1">
                Who can see this?
              </Text>
              <Text className="text-[#8493ab] text-[12px] mb-4">
                Choose who this moment is shared with.
              </Text>
              {AUDIENCES.map(([k, label, icon]) => (
                <Pressable key={k}
                  onPress={() => {
                    setAudience(k);
                    if (k === "selected_people") setShowPeople(true);
                  }}
                  className={`flex-row items-center p-3.5 rounded-2xl mb-2 active:opacity-80
                    ${audience === k ? "bg-[#102f4b] border border-[#247cff]"
                                     : "bg-white/4 border border-white/6"}`}>
                  <Ionicons name={icon} size={20}
                    color={audience === k ? "#6aa8ff" : "#8f9bb0"} />
                  <Text className={`flex-1 ml-3 text-[15px] font-medium
                    ${audience === k ? "text-white" : "text-[#d9e1eb]"}`}>{label}</Text>
                  {audience === k && <Ionicons name="checkmark-circle" size={20} color="#247cff" />}
                </Pressable>
              ))}
              <Pressable onPress={save}
                className="mt-4 h-12 rounded-2xl bg-[#247cff] items-center justify-center active:opacity-80">
                <Text className="text-white font-bold text-[14px]">Done</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <>
              <View className="flex-row items-center mb-3">
                <Pressable onPress={() => setShowPeople(false)} hitSlop={8}>
                  <Ionicons name="chevron-back" size={22} color="#fff" />
                </Pressable>
                <Text className="ml-2 text-white text-[17px] font-extrabold">
                  Select people
                </Text>
                <View className="flex-1" />
                <Text className="text-[#8fb4ff] text-[12px] font-bold">
                  {selected.length} selected
                </Text>
              </View>
              <View className="flex-row mb-3 p-1 rounded-xl bg-white/6">
                {["connections", "following", "followers"].map((t) => (
                  <Pressable key={t} onPress={() => setTab(t)}
                    className={`flex-1 py-1.5 rounded-lg items-center
                      ${tab === t ? "bg-[#247cff]" : ""}`}>
                    <Text className={`text-[12px] font-semibold capitalize
                      ${tab === t ? "text-white" : "text-[#8493ab]"}`}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row gap-2 mb-2">
                <Pressable onPress={() => setSelected(users.map((u) => u.user_id).slice(0, 500))}
                  className="px-3 h-8 rounded-full bg-[#247cff]/20 border border-[#247cff]/40
                             items-center justify-center">
                  <Text className="text-[#8fb4ff] text-[11px] font-bold">Select All</Text>
                </Pressable>
                <Pressable onPress={() => setSelected([])}
                  className="px-3 h-8 rounded-full bg-white/8 border border-white/12
                             items-center justify-center">
                  <Text className="text-[#d9e1eb] text-[11px] font-bold">Clear All</Text>
                </Pressable>
              </View>
              {loading
                ? <ActivityIndicator color="#247cff" className="mt-8" />
                : <FlatList data={users} keyExtractor={(u) => u.user_id}
                    style={{ maxHeight: 340 }}
                    ListEmptyComponent={
                      <Text className="text-[#71809a] text-center mt-8 text-[12px]">
                        No users in this list.
                      </Text>
                    }
                    renderItem={({ item: u }) => {
                      const on = selected.includes(u.user_id);
                      return (
                        <Pressable onPress={() => toggle(u)}
                          className="flex-row items-center py-2.5 active:opacity-80">
                          <Avatar uri={u.profile_photo} name={u.name || u.username} size={40} />
                          <View className="flex-1 ml-3">
                            <Text className="text-white text-[14px] font-semibold"
                              numberOfLines={1}>{u.name || u.username}</Text>
                            <Text className="text-[#8493ab] text-[11px]"
                              numberOfLines={1}>@{u.username}</Text>
                          </View>
                          <View className={`w-6 h-6 rounded-full items-center justify-center
                            border ${on ? "bg-[#247cff] border-[#247cff]"
                                       : "border-[#5a6675]"}`}>
                            {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </View>
                        </Pressable>
                      );
                    }} />}
              <Pressable onPress={() => { if (selected.length) { setAudience("selected_people"); save(); } }}
                className="mt-3 h-12 rounded-2xl bg-[#247cff] items-center justify-center active:opacity-80">
                <Text className="text-white font-bold">Save selection</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}