import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";
import { Empty } from "../ui";

const TAB_ICONS = { reels: "film-outline", saved: "bookmark-outline", posts: "grid-outline" };
const LABEL = { reels: "Reels", saved: "Saved", posts: "Posts" };

export default function ProfileGrid({ tabs, tab, setTab, grid, setPlayer }) {
  return (
    <View className="mx-4 mt-4">
      <View className="flex-row p-1 rounded-full bg-[#0a1424] border border-white/10">
        {tabs.map((t) => {
          const on = tab === t;
          return (
            <Pressable key={t} onPress={() => setTab(t)}
              className={`flex-1 h-10 rounded-full flex-row items-center justify-center ${on ? "bg-[#1685ff]" : ""}`}>
              <Ionicons name={TAB_ICONS[t]} size={16} color={on ? "#fff" : "#64748a"} />
              <Text className={`ml-1.5 text-[13px] font-bold ${on ? "text-white" : "text-[#64748a]"}`}>{LABEL[t]}</Text>
            </Pressable>
          );
        })}
      </View>

      {grid.length === 0 ? (
        <View className="items-center pt-12 pb-6">
          <View className="w-16 h-16 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-3">
            <Ionicons name={TAB_ICONS[tab]} size={26} color="#64748a" />
          </View>
          <Empty text={`No ${LABEL[tab].toLowerCase()} yet.`} />
        </View>
      ) : (
        <View className="flex-row flex-wrap -mx-1 mt-3">
          {grid.map((it) => {
            const isReel = tab !== "posts";
            const img = isReel ? it.thumbnail_url : (it.media_type || "").startsWith("image") && it.media_url;
            return (
              <Pressable key={`${tab}-${it.id}`} style={{ width: "33.33%" }} className="aspect-square p-1 active:opacity-80"
                onPress={() => isReel && setPlayer(it)}>
                <View className="flex-1 bg-[#0d1729] border border-white/6 rounded-2xl items-center justify-center overflow-hidden">
                  {img ? <Image source={{ uri: absUrl(isReel ? it.thumbnail_url : it.media_url) }} className="w-full h-full" />
                    : <Text className="text-[#dce5f2] text-xs text-center p-2" numberOfLines={5}>{it.caption || it.content || ""}</Text>}
                  {isReel && (
                    <View className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 items-center justify-center">
                      <Ionicons name="play" size={11} color="#fff" />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}