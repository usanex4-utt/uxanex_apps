
import React, { memo, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";

const ConnectionRow = ({ item, user, navigation, onLongPress }) => {
  const fam = item.category === "family";

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!item.user_id || item.user_id === user?.user_id) return;

    api(EP.followStatus(encodeURIComponent(item.user_id)))
      .then((data) => {
        if (active) setIsFollowing(Boolean(data?.is_following));
      })
      .catch((error) => {
        console.warn("Follow status error:", error?.message);
      });

    return () => {
      active = false;
    };
  }, [item.user_id, user?.user_id]);

  const handleFollowToggle = async (event) => {
    event?.stopPropagation?.();

    if (followLoading) return;

    setFollowLoading(true);

    try {
      await api(isFollowing ? EP.unfollow : EP.follow, {
        method: "POST",
        body: { user_id: item.user_id },
      });

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.warn("Follow action failed:", error?.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const openProfile = () => {
    if (item.user_id === user?.user_id) {
      navigation.navigate("Tabs", { screen: "Profile" });
    } else {
      navigation.navigate("UserProfile", {
        userId: item.user_id,
      });
    }
  };

  const openChat = () => {
    navigation.navigate("Chat", { user: item });
  };

  return (
    <Pressable
      onPress={openChat}
      onLongPress={onLongPress}
      className="flex-row items-center mx-0 mb-0.5 p-3.5 rounded-3xl"
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? "rgba(47,124,255,0.18)"
          : "transparent",
        transform: [{ scale: pressed ? 0.97 : 1 }],
        opacity: pressed ? 0.90 : 1,
      })}
    >
      {/* Profile Avatar */}
      <Pressable
        onPress={openProfile}
        className="active:opacity-80"
        hitSlop={5}
      >
        <View className="p-0.5 rounded-full border border-brand/40">
          <Avatar
            uri={item.profile_photo}
            name={item.name || item.username}
            size={50}
          />
        </View>
      </Pressable>

      {/* User Information */}
      <View className="flex-1 ml-3.5">
        <Text
          className="text-ink text-[16px] font-bold"
          numberOfLines={1}
        >
          {item.name || item.username}
        </Text>

        <View className="flex-row items-center mt-1">
          <Text
            className="text-muted text-[12px] flex-shrink"
            numberOfLines={1}
          >
            @{item.username}
          </Text>

          {item.category ? (
            <View
              className={`ml-2 px-2 py-0.5 rounded-full border ${
                fam
                  ? "bg-[#ed80dc]/12 border-[#ed80dc]/30"
                  : "bg-brand/12 border-brand/30"
              }`}
            >
              <Text
                className={`text-[10px] font-bold capitalize ${
                  fam ? "text-[#f29be4]" : "text-[#6aa8ff]"
                }`}
              >
                {item.category}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Follow / Unfollow Button */}
      {item.user_id !== user?.user_id && (
        <Pressable
          onPress={handleFollowToggle}
          disabled={followLoading}
          className={`ml-2 px-3 py-2 rounded-full ${
            isFollowing
              ? "border border-white/20 bg-white/5"
              : "bg-brand"
          }`}
        >
          <Text
            className={`text-[12px] font-bold ${
              isFollowing ? "text-ink" : "text-white"
            }`}
          >
            {followLoading
              ? "..."
              : isFollowing
              ? "Following"
              : "Follow"}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export default memo(ConnectionRow);
