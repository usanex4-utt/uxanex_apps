import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, Empty } from "../ui";

export default function PartnerPicker({ connections, navigation, onPick }) {
  return (
    <SafeAreaView className="flex-1 bg-[#fff0f6]">
      <View className="h-16 flex-row items-center px-4">
        <Pressable onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white border border-[#f3d9e4] items-center justify-center active:opacity-70">
          <Ionicons name="chevron-back" size={22} color="#382b3b" />
        </Pressable>
        <View className="ml-3">
          <Text className="text-[#382b3b] text-[20px] font-extrabold tracking-tight">Choose your partner</Text>
          <Text className="text-[#968b98] text-[12px]">Start a private couple chat</Text>
        </View>
      </View>
      <FlatList data={connections} keyExtractor={(c) => c.user_id} contentContainerClassName="p-4 gap-3"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center pt-16 px-8">
            <View className="w-20 h-20 rounded-full bg-white border border-[#f3d9e4] items-center justify-center mb-4">
              <Ionicons name="heart-outline" size={34} color="#e56b9a" />
            </View>
            <Empty text="No connections yet. Connect with your partner first (Search tab)." />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => onPick(item)}
            className="flex-row items-center p-3.5 rounded-3xl bg-white border border-[#f3d9e4] active:opacity-80">
            <View className="p-0.5 rounded-full border border-[#e56b9a]/40">
              <Avatar uri={item.profile_photo} name={item.name || item.username} size={48} />
            </View>
            <View className="flex-1 ml-3.5">
              <Text className="text-[#382b3b] text-[16px] font-bold" numberOfLines={1}>{item.name || item.username}</Text>
              <Text className="text-[#968b98] text-[12px] mt-0.5">@{item.username}</Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-[#fff0f6] items-center justify-center">
              <Ionicons name="heart" size={18} color="#e56b9a" />
            </View>
          </Pressable>
        )} />
    </SafeAreaView>
  );
}