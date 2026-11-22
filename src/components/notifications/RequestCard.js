
import React, { memo, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

const getRequestTime = (createdAt, now) => {
  if (!createdAt) return "";

  const raw = String(createdAt);
  const iso = /Z$|[+-]\d{2}:?\d{2}$/.test(raw)
    ? raw
    : `${raw}Z`;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(
    0,
    Math.floor((now - date.getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";

  if (seconds < 360) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const RequestCard = memo(function RequestCard({
  request: r,
  busy = false,
  onAccept,
  onReject,
}) {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const name = r?.sender_name || "UtaNexa User";
  const username = r?.sender_username || "user";
  const time = getRequestTime(r?.created_at, now);

  return (
    <View className="mb-3 overflow-hidden rounded-[22px] border border-[#2459a5]/50 bg-[#0b1427]">

      {/* Collapsed notification */}
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        className="flex-row items-center px-3.5 py-4 active:bg-[#142542]"
      >
        <View className="mr-3 rounded-full border border-[#398cff]/50 p-0.5">
          <Avatar
            uri={r?.sender_profile_photo}
            name={name}
            size={45}
          />
        </View>

        <View className="flex-1">
          <Text className="text-white text-[14px] font-extrabold">
            @{username}
          </Text>

          <Text
            className="mt-1 text-[#b8c8e3] text-[12px]"
            numberOfLines={1}
          >
            sent you a connection request
          </Text>

          <Text className="mt-1 text-[#75aaff] text-[11px]">
            {time}
          </Text>
        </View>

        <View className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-[#173968]">
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={21}
            color="#83b8ff"
          />
        </View>
      </Pressable>

      {/* Expanded notification */}
      {expanded && (
        <View className="border-t border-[#244574]/60 px-4 pb-4 pt-3">

          {/* UtaNexa branding */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={require("../../../assets/utanexa-logo.png")}
                resizeMode="contain"
                className="h-7 w-7"
              />

              <Text className="ml-2 text-white text-[15px] font-extrabold">
                UtaNexa
              </Text>
            </View>

            <Text className="text-[#82b5ff] text-[11px]">
              {time}
            </Text>
          </View>

          {/* Sender details */}
          <View className="items-center rounded-2xl border border-[#2459a5]/40 bg-[#101f39] px-3 py-5">
            <View className="rounded-full border-2 border-[#398cff] p-1">
              <Avatar
                uri={r?.sender_profile_photo}
                name={name}
                size={70}
              />
            </View>

            <Text className="mt-3 text-[#82b5ff] text-[13px] font-bold">
              @{username}
            </Text>

            <Text className="mt-1 text-white text-[18px] font-extrabold">
              {name}
            </Text>

            <Text className="mt-3 text-center text-[#c5d5ef] text-[14px]">
              Let's connect on UtaNexa!
            </Text>
          </View>

          {/* Accept / Reject */}
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={onAccept}
              disabled={busy}
              className={`h-12 flex-1 items-center justify-center rounded-full ${
                busy ? "bg-[#2462a8]/50" : "bg-[#1769e8]"
              }`}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-[14px] font-extrabold">
                  Accept
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={onReject}
              disabled={busy}
              className="h-12 flex-1 items-center justify-center rounded-full border border-[#64748b]/50 bg-[#202d43]"
            >
              <Text className="text-[#e1e8f4] text-[14px] font-extrabold">
                Reject
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
});

export default RequestCard;
