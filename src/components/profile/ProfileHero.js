import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";

const fmt = (n) => { n = Number(n) || 0; if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`; return String(n); };

const LinkChip = ({ icon, text }) => (
  <View className="flex-row items-center px-3 py-1.5 rounded-full bg-brand/10 border border-brand/25 max-w-full">
    <Ionicons name={icon} size={13} color="#6aa8ff" />
    <Text className="text-brandLight text-[12px] font-semibold ml-1.5 flex-shrink" numberOfLines={1}>{text}</Text>
  </View>
);

const Stat = ({ n, l, last }) => (
  <View className={`flex-1 items-center py-1 ${last ? "" : "border-r border-white/8"}`}>
    <Text className="text-white text-[19px] font-extrabold tracking-tight">{fmt(n)}</Text>
    <Text className="text-[#71809a] text-[11px] mt-0.5">{l}</Text>
  </View>
);

export const ProfileStats = ({ stats }) => (
  <View className="flex-row mx-4 py-4 rounded-3xl bg-[#0a1424] border border-white/10">
    <Stat n={stats.followers} l="Followers" />
    <Stat n={stats.connected} l="Connected" />
    <Stat n={stats.following} l="Following" />
    <Stat n={stats.posts} l="Posts" last />
  </View>
);

export const ProfileHero = ({ u, isMe, following, onEdit, onShare, onFollow, onChangePhoto, onMessage }) => {
  const size = 104;
  return (
    <View className="items-center px-5 pt-2 pb-6 overflow-hidden">
      <View pointerEvents="none" className="absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#1685ff]/15" />
      <View pointerEvents="none" className="absolute -top-16 -right-20 w-56 h-56 rounded-full bg-[#7a5cff]/12" />
      <Pressable onPress={isMe ? onChangePhoto : undefined} className="items-center justify-center active:opacity-90">
        <View className="rounded-full p-[3px] bg-brand" style={{ width: size, height: size }}>
          {u?.profile_photo ? (
            <Image source={{ uri: absUrl(u.profile_photo) }} className="w-full h-full rounded-full bg-[#0d1729] border-[3px] border-[#050b18]" />
          ) : (
            <View className="w-full h-full rounded-full bg-[#0d1729] border-[3px] border-[#050b18] items-center justify-center">
              <Text className="text-white text-4xl font-extrabold">{(u?.name || "U").charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        {isMe && (
          <View className="absolute right-0 bottom-1 w-8 h-8 rounded-full bg-brand items-center justify-center border-[3px] border-[#050b18]">
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        )}
      </Pressable>
      <Text className="text-white text-[24px] font-extrabold tracking-tight mt-4" numberOfLines={1}>{u?.name}</Text>
      <View className="flex-row items-center mt-1.5 px-3 py-1 rounded-full bg-white/6 border border-white/10">
        <Text className="text-[#9aa7bb] text-[12px]" numberOfLines={1}>@{u?.username}</Text>
        {u?.user_id ? <Text className="text-[#5d6a80] text-[12px] ml-2" numberOfLines={1}>ID {u.user_id}</Text> : null}
      </View>
      <Text className="text-[#b4c0d3] text-[14px] leading-[21px] text-center mt-4 px-2">{u?.bio || "No bio available."}</Text>
      {(u?.website || u?.instagram || u?.social_link) ? (
        <View className="flex-row flex-wrap justify-center gap-2 mt-4">
          {u?.website ? <LinkChip icon="globe-outline" text={u.website} /> : null}
          {u?.instagram ? <LinkChip icon="logo-instagram" text={u.instagram} /> : null}
          {u?.social_link ? <LinkChip icon="link-outline" text={u.social_link} /> : null}
        </View>
      ) : null}
      {isMe ? (
        <View className="flex-row gap-2.5 mt-5 w-full">
          <Pressable onPress={onEdit} className="flex-1 h-11 rounded-full bg-[#1685ff] flex-row items-center justify-center active:opacity-80">
            <Ionicons name="create-outline" size={17} color="#fff" />
            <Text className="text-white text-[14px] font-bold ml-2">Edit profile</Text>
          </Pressable>
          <Pressable onPress={onShare} className="flex-1 h-11 rounded-full bg-white/6 border border-white/12 flex-row items-center justify-center active:opacity-70">
            <Ionicons name="share-outline" size={17} color="#fff" />
            <Text className="text-white text-[14px] font-bold ml-2">Share</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row gap-2.5 mt-5 w-full">
          <Pressable onPress={onFollow} className={`flex-1 h-11 rounded-full flex-row items-center justify-center active:opacity-80 ${following ? "bg-white/8 border border-white/15" : "bg-[#1685ff]"}`}>
            <Ionicons name={following ? "checkmark" : "person-add-outline"} size={17} color="#fff" />
            <Text className="text-white text-[14px] font-bold ml-2">{following ? "Following" : "Follow"}</Text>
          </Pressable>
          <Pressable onPress={onMessage} className="flex-1 h-11 rounded-full bg-white/6 border border-white/12 flex-row items-center justify-center active:opacity-70">
            <Ionicons name="chatbubble-ellipses-outline" size={17} color="#fff" />
            <Text className="text-white text-[14px] font-bold ml-2">Message</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};