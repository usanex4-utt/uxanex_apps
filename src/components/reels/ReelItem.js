import React, { memo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  useWindowDimensions,
  Image,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";
import { Avatar } from "../ui";
import Logo from "../../../assets/IMG-20261113-WA4533.jpg";

const fmt = (value) => {
  const n = Number(value) || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
};

const likeCount = (reel) =>
  (Number(reel.two_star_count) || 0) +
  (Number(reel.three_star_count) || 0) +
  (Number(reel.like_count) || 0) +
  (Number(reel.likes_count) || 0);

const parseTags = (value) =>
  (value || "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

// Icons without circle / shadow background
const RailBtn = memo(function RailBtn({
  icon,
  color = "#fff",
  label,
  onPress,
  active,
  scale = 1,
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center active:opacity-70"
      hitSlop={8}
      style={{ transform: [{ scale }] }}
    >
      <Ionicons name={icon} size={28} color={color} />
      {label !== undefined && label !== null ? (
        <Text
          className="text-white text-[12px] font-semibold mt-0.5"
          style={{
            textShadowColor: "rgba(0,0,0,0.65)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
        >
          {fmt(label)}
        </Text>
      ) : null}
    </Pressable>
  );
});

const CaptionBlock = memo(function CaptionBlock({
  caption,
  hashtags,
  category,
  expanded,
  onToggleMore,
  onInterested,
  onNotInterested,
}) {
  if (!caption && !hashtags && !category) return null;

  const chips = parseTags(hashtags);
  const isLong = (caption || "").length > 80;

  return (
    <View>
      {caption ? (
        <Text
          numberOfLines={expanded ? undefined : 2}
          className="text-white/95 text-[13px] leading-5"
        >
          {caption}
        </Text>
      ) : null}

      {(isLong || chips.length > 0 || category) && (
        <Pressable onPress={onToggleMore} hitSlop={10} className="mt-1 self-start">
          <Text className="text-white/55 text-[12px] font-semibold">
            {expanded ? "see less" : "more"}
          </Text>
        </Pressable>
      )}

      {expanded ? (
        <View className="mt-2">
          {category ? (
            <View className="self-start px-2.5 py-1 rounded-full bg-white/12 border border-white/15 mb-2">
              <Text className="text-white/85 text-[11px] font-semibold capitalize">
                {String(category).replace(/_/g, " ")}
              </Text>
            </View>
          ) : null}

          {chips.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5 mb-2.5">
              {chips.map((tag, i) => (
                <View
                  key={`${tag}-${i}`}
                  className="px-2 py-0.5 rounded-full bg-white/12 border border-white/12"
                >
                  <Text className="text-[#9ec4ff] text-[11px] font-semibold">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="flex-row gap-2 mt-0.5">
            <Pressable
              onPress={onInterested}
              className="flex-row items-center h-8 px-3 rounded-full bg-white/12 border border-white/18 active:opacity-75"
            >
              <Ionicons name="thumbs-up-outline" size={14} color="#fff" />
              <Text className="text-white text-[12px] font-semibold ml-1.5">
                Interested
              </Text>
            </Pressable>
            <Pressable
              onPress={onNotInterested}
              className="flex-row items-center h-8 px-3 rounded-full bg-white/10 border border-white/15 active:opacity-75"
            >
              <Ionicons name="thumbs-down-outline" size={14} color="#fff" />
              <Text className="text-white text-[12px] font-semibold ml-1.5">
                Not interested
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
});

function ReelItem(props) {
  const {
    item,
    index,
    active,
    focused,
    muted,
    paused,
    user,
    liked,
    saved,
    followStates,
    expandedCaptions,
    setExpandedCaptions,
    progressAnim,
    pauseAnim,
    pauseIcon,
    heartScale,
    heartOpacity,
    h,
    videoRefs,
    progress,
    activeRef,
    lastAutoAdvanceId,
    goToNext,
    handleVideoTap,
    toggleLike,
    openComments,
    toggleSave,
    share,
    openUser,
    toggleFollow,
    setSheet,
    notInterested,
    railButtonScale = 1,
  } = props;

  const c = item.creator || {};
  const isLiked = !!liked[item.id];
  const isSaved = !!saved[item.id];
  const isSelf = c.user_id && c.user_id === user?.user_id;
  const fState = followStates?.[c.user_id];

  const followLabel =
    fState === "following"
      ? "Following"
      : fState === "pending"
        ? "Requested"
        : "Follow";

  const videoUrl = item.video_url ? absUrl(item.video_url) : null;
  const thumbnailUrl = item.thumbnail_url ? absUrl(item.thumbnail_url) : null;

  const { width } = useWindowDimensions();
  const isSmall = width < 380;

  const expanded = !!expandedCaptions[item.id];
  const toggleMore = () =>
    setExpandedCaptions((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));

  const username = c.username || "user";

  return (
    <View style={{ height: h }} className="bg-black">
      <View style={{ flex: 1 }}>
        {videoUrl ? (
          <Video
            ref={(ref) => {
              if (ref) videoRefs.current[item.id] = ref;
              else delete videoRefs.current[item.id];
            }}
            source={{ uri: videoUrl }}
            posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
            usePoster
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
            isMuted={index !== active ? true : muted}
            shouldPlay={focused && index === active && !paused}
            progressUpdateIntervalMillis={500}
            onPlaybackStatusUpdate={(status) => {
              if (!status.isLoaded) return;

              const duration =
                status.durationMillis || progress.current[item.id]?.dur || 0;

              progress.current[item.id] = {
                pos: status.positionMillis || 0,
                dur: duration,
              };

              if (activeRef.current.id === item.id && duration) {
                progressAnim.setValue(
                  Math.min(1, (status.positionMillis || 0) / duration)
                );
              }

              if (
                status.didJustFinish &&
                activeRef.current.id === item.id &&
                lastAutoAdvanceId.current !== item.id
              ) {
                lastAutoAdvanceId.current = item.id;
                goToNext(index);
              }
            }}
          />
        ) : (
          <View className="flex-1 bg-neutral-900 items-center justify-center">
            <Ionicons name="videocam-off-outline" size={45} color="#888" />
            <Text className="text-white/60 mt-2">Video unavailable</Text>
          </View>
        )}

        <Pressable
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
          onPress={(event) => handleVideoTap(event, item)}
          onLongPress={() => setSheet({ type: "menu", reel: item })}
          delayLongPress={450}
        />
      </View>

      {pauseIcon ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            opacity: pauseAnim,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <View className="w-20 h-20 rounded-full bg-black/55 border border-white/20 items-center justify-center">
            <Ionicons
              name={pauseIcon === "play" ? "play" : "pause"}
              size={40}
              color="#fff"
            />
          </View>
        </Animated.View>
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: -45,
          marginTop: -45,
          opacity: heartOpacity,
          transform: [{ scale: heartScale }],
        }}
      >
        <Ionicons name="heart" size={90} color="#ff2d55" />
      </Animated.View>

      {/* Watermark — logo + @username */}
      <View
        pointerEvents="none"
        className="absolute right-3"
        style={{ top: isSmall ? 52 : 58 }}
      >
        {/* Instagram Style Watermark */}
        <View
          pointerEvents="none"
          className="absolute right-3"
          style={{ top: isSmall ? 52 : 58 }}
        >
          <View className="flex-row items-center">

            {/* Profile Logo */}
            <View className="w-9 h-9 items-center justify-center mr-2">
              <Image
                source={Logo}
                style={{
                  width: 36,
                  height: 36,
                  resizeMode: "contain",
                  borderRadius: 8,
                }}
              />
            </View>

            {/* Username */}
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 0.4,
                textTransform: "uppercase",
                textShadowColor: "rgba(0,0,0,0.8)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {username}
            </Text>

          </View>
        </View>
      </View>

      {/* Left bottom — no views, no inline hashtags */}
      <View
        className="absolute left-3 right-[72px]"
        style={{ bottom: isSmall ? 18 : 24 }}
      >
        <View className="flex-row items-center mb-2">
          <Pressable
            onPress={() => openUser(c.user_id)}
            className="flex-row items-center flex-1 active:opacity-80"
          >
            <View className="p-0.5 rounded-full bg-white/20 border border-white/40">
              <Avatar
                uri={c.profile_photo}
                name={c.username || c.name}
                size={isSmall ? 34 : 38}
              />
            </View>

            <View className="ml-2 flex-1">
              <Pressable onPress={() => openUser(c.user_id)}>
                <Text
                  className="text-white font-bold text-[14px]"
                  numberOfLines={1}
                >
                  @{username}
                </Text>
              </Pressable>
              {c.user_id ? (
                <Pressable onPress={() => openUser(c.user_id)}>
                  <Text className="text-white/55 text-[11px]" numberOfLines={1}>
                    ID {c.user_id}
                  </Text>
                </Pressable>
              ) : c.name && c.name !== c.username ? (
                <Text className="text-white/60 text-[11px]" numberOfLines={1}>
                  {c.name}
                </Text>
              ) : null}
            </View>
          </Pressable>

          {!isSelf && c.user_id ? (
            <Pressable
              onPress={() => toggleFollow(c.user_id)}
              className={`ml-2 px-3 h-7 rounded-full items-center justify-center border ${fState === "following"
                ? "bg-white/15 border-white/40"
                : "bg-brand border-brand"
                }`}
            >
              <Text className="text-white text-[12px] font-semibold">
                {followLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <CaptionBlock
          caption={item.caption}
          hashtags={item.hashtags}
          category={item.category}
          expanded={expanded}
          onToggleMore={toggleMore}
          onInterested={() => {
            setExpandedCaptions((prev) => ({ ...prev, [item.id]: false }));
          }}
          onNotInterested={() => {
            if (typeof notInterested === "function") notInterested(item);
            else setSheet({ type: "menu", reel: item });
          }}
        />
      </View>

      {/* Right action rail — no circle behind icons */}
      <View
        className="absolute right-2.5 items-center"
        style={{ bottom: isSmall ? 20 : 28, gap: isSmall ? 14 : 18 }}
      >
        <RailBtn
          icon={isLiked ? "heart" : "heart-outline"}
          color={isLiked ? "#ff2d55" : "#fff"}
          active={isLiked}
          label={likeCount(item)}
          onPress={() => toggleLike(item)}
          scale={railButtonScale}
        />
        <RailBtn
          icon="chatbubble-outline"
          label={item.comment_count || 0}
          onPress={() => openComments(item)}
          scale={railButtonScale}
        />
        <RailBtn
          icon="repeat-outline"
          label={item.share_count || 0}
          onPress={() => share(item)}
          scale={railButtonScale}
        />
        <RailBtn
          icon="paper-plane-outline"
          onPress={() => share(item)}
          scale={railButtonScale}
        />
        <RailBtn
          icon={isSaved ? "bookmark" : "bookmark-outline"}
          color={isSaved ? "#72b0ff" : "#fff"}
          active={isSaved}
          label={item.save_count || 0}
          onPress={() => toggleSave(item)}
          scale={railButtonScale}
        />
        <RailBtn
          icon="ellipsis-horizontal"
          onPress={() => setSheet({ type: "menu", reel: item })}
          scale={railButtonScale}
        />
      </View>

      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/15"
      >
        {index === active ? (
          <Animated.View
            className="h-full bg-white rounded-r-full"
            style={{
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export default memo(ReelItem);
