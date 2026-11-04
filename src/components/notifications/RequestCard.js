
import React, { memo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

const RequestCard = memo(function RequestCard({
  request: r,
  busy = false,
  onAccept,
  onReject,
}) {
  const name = r?.sender_name || r?.sender_username || "Unknown User";
  const username = r?.sender_username || "user";

  return (
    <View className="p-4 mb-3 rounded-3xl border border-white/10 bg-surface">

      {/* User Information */}
      <View className="flex-row items-center">

        <View className="p-0.5 rounded-full border border-brand/40">
          <Avatar
            uri={r?.sender_profile_photo}
            name={name}
            size={50}
          />
        </View>

        <View className="flex-1 ml-3.5">
          <Text
            className="text-white text-[16px] font-bold"
            numberOfLines={1}
          >
            {name}
          </Text>

          <Text
            className="text-muted text-[12px] mt-0.5"
            numberOfLines={1}
          >
            @{username} wants to connect
          </Text>
        </View>

        <View className="w-9 h-9 rounded-full bg-brand/15 items-center justify-center">
          <Ionicons
            name="person-add"
            size={16}
            color="#4d94ff"
          />
        </View>

      </View>

      {/* Accept / Decline Buttons */}
      <View className="flex-row gap-2.5 mt-4">

        {/* Accept */}
        <Pressable
          onPress={onAccept}
          disabled={busy}
          className={`flex-1 h-11 rounded-full flex-row items-center justify-center ${
            busy
              ? "bg-brand/40"
              : "bg-brand active:opacity-80"
          }`}
        >
          {busy ? (
            <ActivityIndicator
              color="#fff"
              size="small"
            />
          ) : (
            <>
              <Ionicons
                name="checkmark"
                size={18}
                color="#fff"
              />

              <Text className="text-white text-[14px] font-bold ml-1.5">
                Accept
              </Text>
            </>
          )}
        </Pressable>

        {/* Decline */}
        <Pressable
          onPress={onReject}
          disabled={busy}
          className={`flex-1 h-11 rounded-full border border-white/12 flex-row items-center justify-center ${
            busy
              ? "bg-white/5 opacity-50"
              : "bg-white/6 active:opacity-70"
          }`}
        >
          <Ionicons
            name="close"
            size={18}
            color="#aeb7c5"
          />

          <Text className="text-[#aeb7c5] text-[14px] font-bold ml-1.5">
            Decline
          </Text>
        </Pressable>

      </View>
    </View>
  );
});

export default RequestCard;
