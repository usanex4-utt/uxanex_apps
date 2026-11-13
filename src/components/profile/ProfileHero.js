
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6)
    return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3)
    return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
};

const cleanUrl = (t) =>
  String(t || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");

const LinkChip = ({ icon, text }) => {
  const display = cleanUrl(text);
  if (!display) return null;

  return (
    <View className="flex-row items-center px-2.5 h-7 rounded-full bg-brand/10 border border-brand/25">
      <Ionicons name={icon} size={11} color="#6aa8ff" />
      <Text
        className="text-brandLight text-[11px] font-semibold ml-1.5"
        numberOfLines={1}
        style={{ maxWidth: 130 }}
      >
        {display}
      </Text>
    </View>
  );
};

const LinksRow = ({ website, instagram, social }) => {
  const items = [];

  if (website && cleanUrl(website))
    items.push({ icon: "globe-outline", text: website });
  if (instagram && cleanUrl(instagram))
    items.push({ icon: "logo-instagram", text: instagram });
  if (social && cleanUrl(social))
    items.push({ icon: "link-outline", text: social });

  if (!items.length) return null;

  return (
    <View className="w-full mt-3.5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 6,
          paddingHorizontal: 8,
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {items.map((it, i) => (
          <LinkChip key={`${it.icon}-${i}`} icon={it.icon} text={it.text} />
        ))}
      </ScrollView>
    </View>
  );
};

const Stat = ({ n, l, last, onPress }) => (
  <Pressable
    onPress={onPress}
    className={`flex-1 items-center py-2 active:opacity-60 ${
      last ? "" : "border-r border-white/8"
    }`}
  >
    <Text className="text-white text-[19px] font-extrabold tracking-tight">
      {fmt(n)}
    </Text>
    <Text className="text-[#71809a] text-[11px] mt-0.5">{l}</Text>
  </Pressable>
);

export const ProfileStats = ({
  stats,
  onPressFollowers,
  onPressConnected,
  onPressFollowing,
  onPressPosts,
}) => (
  <View className="flex-row mx-4 py-2 rounded-3xl bg-[#0a1424] border border-white/10">
    <Stat n={stats.followers} l="Followers" onPress={onPressFollowers} />
    <Stat n={stats.connected} l="Connected" onPress={onPressConnected} />
    <Stat n={stats.following} l="Following" onPress={onPressFollowing} />
    <Stat n={stats.posts} l="Posts" last onPress={onPressPosts} />
  </View>
);

export const ProfileHero = ({
  u,
  isMe,
  following,
  onEdit,
  onShare,
  onFollow,
  onChangePhoto,
  onMessage,
  animationKey,
}) => {
  const size = 104;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animationKey) return;

    glow.stopAnimation();
    glow.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(glow, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(100),
      Animated.timing(glow, {
        toValue: 0,
        duration: 550,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [animationKey, glow]);

  const streakStyle = {
    opacity: glow,
    transform: [
      {
        scaleX: glow.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1.5],
        }),
      },
    ],
  };

  return (
    <View className="items-center px-5 pt-2 pb-6 overflow-hidden">
      {/* Background blobs */}
      <View
        pointerEvents="none"
        className="absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#1685ff]/15"
      />
      <View
        pointerEvents="none"
        className="absolute -top-16 -right-20 w-56 h-56 rounded-full bg-[#7a5cff]/12"
      />

      {/* DP with left-right electric blue animation */}
      <Pressable
        onPress={isMe ? onChangePhoto : undefined}
        className="items-center justify-center active:opacity-90"
        style={{ width: 124, height: 104 }}
      >
        {/* Left electric streaks */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: 0,
              top: 30,
              width: 13,
              height: 3,
              borderRadius: 5,
              backgroundColor: "#38bdf8",
              shadowColor: "#1685ff",
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 5,
            },
            streakStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: 1,
              top: 50,
              width: 10,
              height: 3,
              borderRadius: 5,
              backgroundColor: "#60a5fa",
              shadowColor: "#1685ff",
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 5,
            },
            streakStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: 0,
              top: 70,
              width: 13,
              height: 3,
              borderRadius: 5,
              backgroundColor: "#38bdf8",
              shadowColor: "#1685ff",
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 5,
            },
            streakStyle,
          ]}
        />

        {/* Right electric streaks */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              right: 0,
              top: 30,
              width: 13,
              height: 3,
              borderRadius: 5,
              backgroundColor: "#38bdf8",
              shadowColor: "#1685ff",
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 5,
            },
            streakStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              right: 1,
              top: 50,
              width: 10,
              height: 3,
              borderRadius: 5,
              backgroundColor: "#60a5fa",
              shadowColor: "#1685ff",
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 5,
            },
            streakStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              right: 0,
              top: 70,
              width: 13,
              height: 3,
              borderRadius: 5,
              backgroundColor: "#38bdf8",
              shadowColor: "#1685ff",
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 5,
            },
            streakStyle,
          ]}
        />

        {/* Original avatar */}
        <View
          className="rounded-full p-[3px] bg-brand"
          style={{ width: size, height: size }}
        >
          {u?.profile_photo ? (
            <Image
              source={{ uri: absUrl(u.profile_photo) }}
              className="w-full h-full rounded-full bg-[#0d1729] border-[3px] border-[#050b18]"
            />
          ) : (
            <View className="w-full h-full rounded-full bg-[#0d1729] border-[3px] border-[#050b18] items-center justify-center">
              <Text className="text-white text-4xl font-extrabold">
                {(u?.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {isMe && (
          <View
            className="absolute bottom-1 w-8 h-8 rounded-full bg-brand items-center justify-center border-[3px] border-[#050b18]"
            style={{ right: 10 }}
          >
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* Name */}
      <Text
        className="text-white text-[24px] font-extrabold tracking-tight mt-4"
        numberOfLines={1}
      >
        {u?.name}
      </Text>

      {/* Username + ID */}
      <View className="flex-row items-center mt-1.5 px-3 py-1 rounded-full bg-white/6 border border-white/10">
        <Text className="text-[#9aa7bb] text-[12px]" numberOfLines={1}>
          @{u?.username}
        </Text>
        {u?.user_id ? (
          <Text className="text-[#5d6a80] text-[12px] ml-2" numberOfLines={1}>
            ID {u.user_id}
          </Text>
        ) : null}
      </View>

      {/* Bio */}
      <Text className="text-[#b4c0d3] text-[14px] leading-[21px] text-center mt-4 px-2">
        {u?.bio || "No bio available."}
      </Text>

      {/* Links */}
      <LinksRow
        website={u?.website}
        instagram={u?.instagram}
        social={u?.social_link}
      />

      {/* Actions */}
      {isMe ? (
        <View className="flex-row gap-2.5 mt-5 w-full">
          <Pressable
            onPress={onEdit}
            className="flex-1 h-11 rounded-full bg-[#1685ff] flex-row items-center justify-center active:opacity-80"
          >
            <Ionicons name="create-outline" size={17} color="#fff" />
            <Text className="text-white text-[14px] font-bold ml-2">
              Edit profile
            </Text>
          </Pressable>
          <Pressable
            onPress={onShare}
            className="flex-1 h-11 rounded-full bg-white/6 border border-white/12 flex-row items-center justify-center active:opacity-70"
          >
            <Ionicons name="share-outline" size={17} color="#fff" />
            <Text className="text-white text-[14px] font-bold ml-2">
              Share
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row gap-2.5 mt-5 w-full">
          <Pressable
            onPress={onFollow}
            className={`flex-1 h-11 rounded-full flex-row items-center justify-center active:opacity-80 ${
              following ? "bg-white/8 border border-white/15" : "bg-[#1685ff]"
            }`}
          >
            <Ionicons
              name={following ? "checkmark" : "person-add-outline"}
              size={17}
              color="#fff"
            />
            <Text className="text-white text-[14px] font-bold ml-2">
              {following ? "Following" : "Follow"}
            </Text>
          </Pressable>
          <Pressable
            onPress={onMessage}
            className="flex-1 h-11 rounded-full bg-white/6 border border-white/12 flex-row items-center justify-center active:opacity-70"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={17}
              color="#fff"
            />
            <Text className="text-white text-[14px] font-bold ml-2">
              Message
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
