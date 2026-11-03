import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

const DrawerRow = ({ icon, label, onPress, active, danger }) => (
  <Pressable onPress={onPress}
    className={`h-12 flex-row items-center px-3 rounded-2xl mb-1 active:opacity-70 ${active ? "bg-brand/15 border border-brand/30" : ""}`}>
    <View className={`w-8 h-8 rounded-xl items-center justify-center ${danger ? "bg-red-500/12" : active ? "bg-brand/20" : "bg-white/6"}`}>
      <Ionicons name={icon} size={17} color={danger ? "#ff6b6b" : active ? "#6aa8ff" : "#bec8d5"} />
    </View>
    <Text className={`ml-3 text-[14px] font-medium ${danger ? "text-danger" : active ? "text-white font-semibold" : "text-[#bec8d5]"}`}>{label}</Text>
  </Pressable>
);

export default function HomeDrawer({ visible, onClose, user, filter, setFilter, FILTERS, navigation, onSignOut }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/65 flex-row" onPress={onClose}>
        <Pressable className="w-[290px] max-w-[84%] h-full bg-[#090e15] border-r border-white/8 px-4 pt-14 pb-8" onPress={() => {}}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-[20px] font-extrabold tracking-tight">
              <Text className="text-brand">UTA</Text><Text className="text-white">NEXA</Text>
            </Text>
            <Pressable onPress={onClose} className="w-9 h-9 rounded-full bg-white/6 border border-white/10 items-center justify-center active:opacity-70">
              <Ionicons name="close" size={18} color="#d9e1eb" />
            </Pressable>
          </View>
          {user ? (
            <View className="flex-row items-center p-3 rounded-3xl bg-white/4 border border-white/8 mb-6">
              <View className="p-0.5 rounded-full border border-brand/40">
                <Avatar uri={user.profile_photo} name={user.name || user.username} size={44} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white text-[15px] font-bold" numberOfLines={1}>{user.name || user.username}</Text>
                {user.username ? <Text className="text-muted text-[12px] mt-0.5" numberOfLines={1}>@{user.username}</Text> : null}
              </View>
            </View>
          ) : null}
          <Text className="text-[#5d6a80] text-[12px] font-semibold px-3 mb-2">Connections</Text>
          {FILTERS.map((f) => (
            <DrawerRow key={f.key} icon={f.icon} label={f.label} active={filter === f.key}
              onPress={() => { setFilter(f.key); onClose(); }} />
          ))}
          <Text className="text-[#5d6a80] text-[12px] font-semibold px-3 mt-5 mb-2">Explore</Text>
          <DrawerRow icon="settings-outline" label="Moment settings"
  onPress={() => { onClose(); navigation.navigate("MomentSettings"); }} />
<DrawerRow icon="archive-outline" label="Moment archive"
  onPress={() => { onClose(); navigation.navigate("MomentArchive"); }} />
          <DrawerRow icon="heart" label="Couple Chat" onPress={() => { onClose(); navigation.navigate("CoupleChat"); }} />
          <DrawerRow icon="sparkles-outline" label="NEXA AI" onPress={() => { onClose(); navigation.navigate("Nexa"); }} />
          <View className="h-px bg-white/8 my-4" />
          <DrawerRow icon="log-out-outline" label="Log out" danger onPress={() => { onClose(); onSignOut?.(); }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}