import React, { memo } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";
import { Avatar } from "../ui";

// Format numbers
const fmt = (value) => {
  const n = Number(value) || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
};

const likeCount = (reel) =>
  (Number(reel.two_star_count) || 0) + (Number(reel.three_star_count) || 0);

const tags = (value) =>
  (value || "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

// ── Action Button ───────────────────────────────────────
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
      <View
        className={`w-11 h-11 rounded-full items-center justify-center border ${
          active ? "bg-white/20 border-white/40" : "bg-black/40 border-white/20"
        }`}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>

      {label !== undefined && (
        <Text className="text-white text-[11px] font-semibold mt-1">
          {fmt(label)}
        </Text>
      )}
    </Pressable>
  );
});

// ── Expandable Caption ──────────────────────────────────
const ExpandableCaption = memo(function ExpandableCaption({
  text,
  expanded,
  onToggle,
}) {
  if (!text) return null;
  const isLong = text.length > 70;

  return (
    <View>
      <Text
        numberOfLines={expanded ? undefined : 2}
        className="text-white/95 text-[13px] leading-5"
      >
        {text}
      </Text>
      {isLong && (
        <Pressable onPress={onToggle} hitSlop={12} className="mt-1 self-start">
          <Text className="text-white/60 text-[12px] font-semibold">
            {expanded ? "see less" : "... see more"}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

// ── Main Component ──────────────────────────────────────
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
    railButtonScale = 1,
  } = props;

  const c = item.creator || {};          // ✅ Fixed here
  const isLiked = !!liked[item.id];
  const isSaved = !!saved[item.id];
  const chips = tags(item.hashtags);
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

  return (
    <View style={{ height: h }} className="bg-black">
      {/* VIDEO */}
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

      {/* Pause / Play icon */}
      {pauseIcon && (
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
      )}

      {/* Double tap heart */}
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

      {/* LEFT BOTTOM */}
      <View
        className="absolute left-3 right-20"
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
              <Text className="text-white font-bold text-[14px]" numberOfLines={1}>
                @{c.username || "user"}
              </Text>
              {c.name && c.name !== c.username && (
                <Text className="text-white/60 text-[11px]" numberOfLines={1}>
                  {c.name}
                </Text>
              )}
            </View>
          </Pressable>

          {!isSelf && c.user_id && (
            <Pressable
              onPress={() => toggleFollow(c.user_id)}
              className={`ml-2 px-3 h-7 rounded-full items-center justify-center border ${
                fState === "following"
                  ? "bg-white/15 border-white/40"
                  : "bg-brand border-brand"
              }`}
            >
              <Text className="text-white text-[12px] font-semibold">
                {followLabel}
              </Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row items-center mb-1.5">
          <Ionicons
            name="play-circle-outline"
            size={13}
            color="rgba(255,255,255,0.75)"
          />
          <Text className="text-white/75 text-[11px] ml-1 font-medium">
            {fmt(item.views_count || 0)} views
          </Text>
        </View>

        {item.caption ? (
          <ExpandableCaption
            text={item.caption}
            expanded={!!expandedCaptions[item.id]}
            onToggle={() =>
              setExpandedCaptions((prev) => ({
                ...prev,
                [item.id]: !prev[item.id],
              }))
            }
          />
        ) : null}

        {chips.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {chips.map((tag, i) => (
              <View
                key={`${tag}-${i}`}
                className="px-2 py-0.5 rounded-full bg-white/15 border border-white/15"
              >
                <Text className="text-brandLight text-[11px] font-semibold">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* RIGHT ACTION RAIL */}
      <View
        className="absolute right-3 items-center"
        style={{ bottom: isSmall ? 20 : 28, gap: isSmall ? 12 : 16 }}
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
          icon={isSaved ? "bookmark" : "bookmark-outline"}
          color={isSaved ? "#72b0ff" : "#fff"}
          active={isSaved}
          label={item.save_count || 0}
          onPress={() => toggleSave(item)}
          scale={railButtonScale}
        />

        <RailBtn
          icon="paper-plane-outline"
          label={item.share_count || 0}
          onPress={() => share(item)}
          scale={railButtonScale}
        />

        <RailBtn
          icon="ellipsis-horizontal"
          onPress={() => setSheet({ type: "menu", reel: item })}
          scale={railButtonScale}
        />
      </View>

      {/* PROGRESS BAR */}
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/15"
      >
        {index === active && (
          <Animated.View
            className="h-full bg-white rounded-r-full"
            style={{
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        )}
      </View>
    </View>
  );
}

export default memo(ReelItem);