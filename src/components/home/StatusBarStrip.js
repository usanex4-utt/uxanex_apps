import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

export default function StatusBarStrip({ myStatus, friendsStatus, user, uploading, onUpload, onOpenViewer }) {
  return (
    <View className="pt-2 pb-1">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 gap-4">
        <Pressable onPress={() => {
            if (myStatus && myStatus.statuses?.length > 0)
              onOpenViewer(myStatus.statuses, { username: user?.username, profile_photo: user?.profile_photo });
            else onUpload();
          }} className="items-center" disabled={uploading}>
          <View className="relative">
            <View className={`w-[68px] h-[68px] rounded-full border items-center justify-center mb-1 p-[2px] ${myStatus?.statuses?.length > 0 ? "border-brand" : "border-white/20"}`}>
              {uploading ? (
                <View className="w-[62px] h-[62px] rounded-full bg-white/10 items-center justify-center">
                  <ActivityIndicator color="#4d94ff" />
                </View>
              ) : (
                <Avatar uri={user?.profile_photo} name={user?.name || user?.username} size={62} />
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-brand w-6 h-6 rounded-full items-center justify-center border-2 border-[#0a0f16]">
              <Ionicons name="add" size={14} color="#fff" />
            </View>
          </View>
          <Text className="text-[#d9e1eb] text-[11px] mt-1 font-medium">My Status</Text>
        </Pressable>

        {friendsStatus.map((s) => (
          <Pressable key={s.user_id} onPress={() => onOpenViewer(s.statuses, { username: s.username, profile_photo: s.profile_photo })} className="items-center">
            <View className={`w-[68px] h-[68px] rounded-full p-[2.5px] mb-1 ${s.has_unviewed ? "bg-brand" : "bg-white/20"}`}>
              <View className="w-full h-full rounded-full border-2 border-[#0a0f16] p-[2px]">
                <Avatar uri={s.profile_photo} name={s.username} size={56} />
              </View>
            </View>
            <Text className="text-[#d9e1eb] text-[11px] mt-1 font-medium" numberOfLines={1}>{s.username}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}