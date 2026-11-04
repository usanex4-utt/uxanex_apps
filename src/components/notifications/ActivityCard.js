import React, { memo } from "react";
import {
  View,
  Text,
  Pressable,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

import {
  when,
  typeIcon,
  normType,
  normPhoto,
} from "./notificationUtils";

const ActivityCard = memo(function ActivityCard({
  notification: n,
  onPress,
}) {
  // Safety check
  if (!n) return null;

  // Notification icon and color
  const [ic, col] = typeIcon(normType(n));

  // Sender profile photo
  const photo = normPhoto(n);

  // Sender name fallback
  const senderName =
    n.sender_name ||
    n.sender_username ||
    "User";

  // Read status
  const isRead = Boolean(n.is_read);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`
        flex-row
        items-center
        p-3.5
        mb-2.5
        rounded-3xl
        border
        active:opacity-80
        ${
          isRead
            ? "bg-surface border-white/8"
            : "bg-brand/8 border-brand/35"
        }
      `}
    >
      {/* Avatar and notification icon */}
      <View className="relative">
        <Avatar
          uri={photo}
          name={senderName}
          size={46}
        />

        {/* Notification type badge */}
        <View
          className="
            absolute
            -right-1
            -bottom-1
            w-[22px]
            h-[22px]
            rounded-full
            bg-[#070b12]
            items-center
            justify-center
          "
        >
          <View
            className="
              w-[18px]
              h-[18px]
              rounded-full
              items-center
              justify-center
            "
            style={{
              backgroundColor: col || "#64748b",
            }}
          >
            <Ionicons
              name={ic || "notifications"}
              size={10}
              color="#ffffff"
            />
          </View>
        </View>
      </View>

      {/* Notification content */}
      <View className="flex-1 ml-3.5">
        <Text
          className={`
            text-[14px]
            leading-5
            ${
              isRead
                ? "text-[#b4c0d3]"
                : "text-white font-medium"
            }
          `}
        >
          {n.message || "New activity"}
        </Text>

        <Text className="text-faint text-[11px] mt-1">
          {n.created_at ? when(n.created_at) : ""}
        </Text>
      </View>

      {/* Unread indicator */}
      {!isRead && (
        <View
          className="
            w-2.5
            h-2.5
            rounded-full
            bg-brand
            ml-2.5
          "
        />
      )}
    </Pressable>
  );
});

export default ActivityCard;
