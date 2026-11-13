import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";
import { Empty } from "../ui";

const TAB_ICONS = {
  reels: "film-outline",
  saved: "bookmark-outline",
  posts: "grid-outline",
};
const LABEL = { reels: "Reels", saved: "Saved", posts: "Posts" };

/** Same proportions as Search explore grid */
const TILE_RATIO = 1.33;
const GRID_COLS = 3;
const TILE_GAP = 2;

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6)
    return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3)
    return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
};

/** Search-style cell: muted looping video + play/views badge */
const ReelCell = memo(function ReelCell({
  item,
  width,
  height,
  shouldPlay,
  onPress,
  isPost,
}) {
  const videoRef = useRef(null);

  const thumb =
    typeof item?.thumbnail_url === "string"
      ? absUrl(item.thumbnail_url)
      : typeof item?.media_url === "string" &&
        String(item.media_type || "").startsWith("image")
      ? absUrl(item.media_url)
      : null;

  const videoUrl =
    !isPost && typeof item?.video_url === "string"
      ? absUrl(item.video_url)
      : null;

  const [videoErr, setVideoErr] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ref = videoRef.current;
    if (!ref) return;
    if (shouldPlay && !videoErr) {
      ref.setIsMutedAsync(true).catch(() => {});
      ref.playAsync().catch(() => {});
    } else {
      ref.pauseAsync().catch(() => {});
    }
  }, [shouldPlay, ready, videoErr]);

  return (
    <Pressable
      onPress={onPress}
      style={{ width, height, padding: TILE_GAP / 2 }}
      className="active:opacity-80"
    >
      <View className="flex-1 bg-[#0d1729] overflow-hidden">
        {videoUrl && !videoErr ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            posterSource={thumb ? { uri: thumb } : undefined}
            usePoster={!!thumb}
            style={{ width: "100%", height: "100%" }}
            resizeMode={ResizeMode.COVER}
            isMuted
            isLooping
            shouldPlay={!!shouldPlay}
            progressUpdateIntervalMillis={800}
            onLoad={() => setReady(true)}
            onReadyForDisplay={() => setReady(true)}
            onError={() => setVideoErr(true)}
          />
        ) : thumb ? (
          <Image
            source={{ uri: thumb }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center px-2">
            {isPost && (item.caption || item.content) ? (
              <Text
                className="text-[#dce5f2] text-[11px] text-center"
                numberOfLines={6}
              >
                {item.caption || item.content}
              </Text>
            ) : (
              <Ionicons name="film-outline" size={24} color="#5d6a80" />
            )}
          </View>
        )}

        {!isPost ? (
          <View className="absolute bottom-1.5 left-1.5 right-1.5 flex-row items-center">
            <Ionicons name="play" size={12} color="#fff" />
            <Text className="text-white text-[11px] font-bold ml-1">
              {fmt(item.views_count || item.view_count || item.views || 0)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

export default function ProfileGrid({
  tabs,
  tab,
  setTab,
  grid,
  setPlayer,
  loading = false,
}) {
  const { width } = useWindowDimensions();
  const tileW = Math.floor(width / GRID_COLS);
  const tileH = Math.floor(tileW * TILE_RATIO);

  // Autoplay first 6 muted (Search-like)
  const [playingIds, setPlayingIds] = useState(() => new Set());

  useEffect(() => {
    const ids = new Set(
      (grid || [])
        .slice(0, 6)
        .filter(() => tab !== "posts")
        .map((x) => x.id)
    );
    setPlayingIds(ids);
  }, [grid, tab]);

  const onPressItem = useCallback(
    (it) => {
      if (tab === "posts") return;
      setPlayer?.(it);
    },
    [tab, setPlayer]
  );

  return (
    <View className="mt-4">
      <View className="mx-4 flex-row p-1 rounded-full bg-[#0a1424] border border-white/10">
        {tabs.map((t) => {
          const on = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 h-10 rounded-full flex-row items-center justify-center ${
                on ? "bg-[#1685ff]" : ""
              }`}
            >
              <Ionicons
                name={TAB_ICONS[t]}
                size={16}
                color={on ? "#fff" : "#64748a"}
              />
              <Text
                className={`ml-1.5 text-[13px] font-bold ${
                  on ? "text-white" : "text-[#64748a]"
                }`}
              >
                {LABEL[t]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {Array.from({ length: 9 }, (_, i) => (
            <View
              key={i}
              style={{
                width: tileW,
                height: tileH,
                padding: TILE_GAP / 2,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#151c28",
                  borderRadius: 2,
                }}
              />
            </View>
          ))}
        </View>
      ) : grid.length === 0 ? (
        <View className="items-center pt-12 pb-6">
          <View className="w-16 h-16 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-3">
            <Ionicons name={TAB_ICONS[tab]} size={26} color="#64748a" />
          </View>
          <Empty text={`No ${LABEL[tab].toLowerCase()} yet.`} />
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          {grid.map((it) => (
            <ReelCell
              key={`${tab}-${it.id}`}
              item={it}
              width={tileW}
              height={tileH}
              isPost={tab === "posts"}
              shouldPlay={playingIds.has(it.id)}
              onPress={() => onPressItem(it)}
            />
          ))}
        </View>
      )}
    </View>
  );
}