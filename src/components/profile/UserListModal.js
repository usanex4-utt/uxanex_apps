import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

/**
 * Bottom sheet list for Followers / Following / Connected.
 */
export default function UserListModal({
  visible,
  title,
  users,
  loading,
  onClose,
  navigation,
  onFollow,
  onUnfollow,
}) {
  const isFollowers = title === "Followers";
  const isFollowing = title === "Following";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-[#0b1220] rounded-t-[28px] border-t border-white/10 pt-2 pb-8 h-[70%]"
          onPress={(e) => e.stopPropagation?.()}
        >
          <View className="self-center w-9 h-1 rounded-full bg-white/20 my-3" />

          <View className="flex-row items-center justify-between px-5 mb-4">
            <Text className="text-white text-[18px] font-bold">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color="#247cff" className="mt-10" />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(u) => String(u.user_id)}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              ListEmptyComponent={
                <Text className="text-[#71809a] text-center mt-10">No users found.</Text>
              }
              renderItem={({ item: u }) => (
                <View className="flex-row items-center py-3 border-b border-white/5">
                  {/* Avatar + name → open profile */}
                  <Pressable
                    onPress={() => {
                      onClose();
                      navigation.navigate("UserProfile", { userId: u.user_id });
                    }}
                    className="flex-row items-center flex-1 min-w-0 active:opacity-70"
                  >
                    <Avatar uri={u.profile_photo} name={u.name || u.username} size={44} />
                    <View className="ml-3 flex-1 min-w-0">
                      <Text className="text-white text-[15px] font-bold" numberOfLines={1}>
                        {u.name}
                      </Text>
                      <Text className="text-[#8493ab] text-[12px]" numberOfLines={1}>
                        @{u.username}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Followers: Follow back */}
                  {isFollowers && !u.is_following && (
                    <Pressable
                      onPress={() => onFollow?.(u)}
                      className="ml-3 h-8 px-3.5 rounded-full bg-[#1685ff] items-center justify-center active:opacity-80"
                    >
                      <Text className="text-white text-[12px] font-bold">Follow back</Text>
                    </Pressable>
                  )}

                  {/* Following: Unfollow — aligned with row */}
                  {isFollowing && (
                    <Pressable
                      onPress={() => onUnfollow?.(u)}
                      className="ml-3 h-8 px-3.5 rounded-full border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 flex-row items-center justify-center active:opacity-80"
                    >
                      <Ionicons name="person-remove-outline" size={14} color="#ff6b6b" />
                      <Text className="text-[#ff6b6b] text-[12px] font-bold ml-1.5">
                        Unfollow
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}