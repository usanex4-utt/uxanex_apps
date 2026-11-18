
import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function CreatorComingSoonScreen({ navigation, route }) {
  const title = route.params?.title || "Coming Soon";

  return (
    <SafeAreaView className="flex-1 bg-[#05070b]">
      <View className="h-14 flex-row items-center px-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white/8 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>

        <Text className="flex-1 text-center text-white text-[16px] font-bold">
          {title}
        </Text>

        <View className="w-10" />
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="time-outline" size={54} color="#247cff" />

        <Text className="text-white text-[23px] font-extrabold mt-5">
          Coming Soon
        </Text>

        <Text className="text-[#71809a] text-[13px] text-center mt-2">
          {title} feature is coming soon to UtaNexa.
        </Text>
      </View>
    </SafeAreaView>
  );
}
