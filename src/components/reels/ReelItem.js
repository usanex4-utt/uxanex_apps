import React from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";
import { Avatar } from "../ui";

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
};
const likeCount = (r) => (r.two_star_count || 0) + (r.three_star_count || 0);
const tags = (s) => (s || "").split(/[\s,]+/).filter(Boolean).slice(0, 3).map((t) => (t.startsWith("#") ? t : `#${t}`));

const RailBtn = ({ icon, color = "#fff", label, onPress, active }) => (
  <Pressable onPress={onPress} className="items-center active:opacity-70">
    <View className={`w-12 h-12 rounded-full items-center justify-center border ${active ? "bg-white/20 border-white/40" : "bg-black/35 border-white/15"}`}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    {label !== undefined && <Text className="text-white text-[11px] font-semibold mt-1.5">{fmt(label)}</Text>}
  </Pressable>
);

const ExpandableCaption = ({ text, expanded, onToggle }) => {
  if (!text) return null;
  const isLong = text.length > 70;
  return (
    <View>
      <Text numberOfLines={expanded ? undefined : 3} className="text-white/95 text-[14px] leading-5">{text}</Text>
      {isLong && (
        <Pressable onPress={onToggle} hitSlop={12} className="mt-1 self-start">
          <Text className="text-white/60 text-[13px] font-semibold">{expanded ? "see less" : "... see more"}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default function ReelItem(props) {
  const {
    item, index, active, focused, muted, paused, user, liked, saved, followStates, expandedCaptions,
    setExpandedCaptions, progressAnim, pauseAnim, pauseIcon, heartScale, heartOpacity, h, videoRefs,
    progress, activeRef, lastAutoAdvanceId, goToNext, handleVideoTap, toggleLike, openComments,
    toggleSave, share, openUser, toggleFollow, setSheet,
  } = props;

  const c = item.creator || {};
  const isLiked = !!liked[item.id];
  const isSaved = !!saved[item.id];
  const chips = tags(item.hashtags);
  const isSelf = c.user_id && c.user_id === user?.user_id;
  const fState = followStates[c.user_id];
  const followLabel = fState === "following" ? "Following" : fState === "pending" ? "Requested" : "Follow";

  return (
    <View style={{ height: h }} className="bg-black">
      <View style={{ flex: 1 }}>
        <Video ref={(r) => { if (r) videoRefs.current[item.id] = r; else delete videoRefs.current[item.id]; }}
          source={{ uri: absUrl(item.video_url) }}
          posterSource={item.thumbnail_url ? { uri: absUrl(item.thumbnail_url) } : undefined} usePoster
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
          resizeMode={ResizeMode.COVER} isLooping={false} isMuted={index !== active ? true : muted}
          shouldPlay={focused && index === active && !paused} progressUpdateIntervalMillis={500}
          onPlaybackStatusUpdate={(s) => {
            if (!s.isLoaded) return;
            const dur = s.durationMillis || progress.current[item.id]?.dur || 0;
            progress.current[item.id] = { pos: s.positionMillis || 0, dur };
            if (activeRef.current.id === item.id && dur) progressAnim.setValue(Math.min(1, (s.positionMillis || 0) / dur));
            if (s.didJustFinish && activeRef.current.id === item.id && lastAutoAdvanceId.current !== item.id) {
              lastAutoAdvanceId.current = item.id;
              goToNext(index);
            }
          }} />
        <Pressable style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
          onPress={(e) => handleVideoTap(e, item)} onLongPress={() => setSheet({ type: "menu", reel: item })} delayLongPress={450} />
      </View>

      {pauseIcon && (
        <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, opacity: pauseAnim, alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <View className="w-24 h-24 rounded-full bg-black/55 border border-white/20 items-center justify-center">
            <Ionicons name={pauseIcon === "play" ? "play" : "pause"} size={46} color="#fff" />
          </View>
        </Animated.View>
      )}

      <Animated.View pointerEvents="none" style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -50, marginTop: -50, opacity: heartOpacity, transform: [{ scale: heartScale }] }}>
        <Ionicons name="heart" size={100} color="#ff2d55" />
      </Animated.View>

      <View pointerEvents="none" className="absolute bottom-0 left-0 right-0">
        <View className="absolute bottom-0 left-0 right-0 h-80 bg-black/10" />
        <View className="absolute bottom-0 left-0 right-0 h-64 bg-black/15" />
        <View className="absolute bottom-0 left-0 right-0 h-48 bg-black/20" />
        <View className="absolute bottom-0 left-0 right-0 h-32 bg-black/25" />
        <View className="absolute bottom-0 left-0 right-0 h-16 bg-black/25" />
      </View>

      <View className="absolute left-4 bottom-7 right-24">
        <View className="flex-row items-center mb-2">
          <Pressable onPress={() => openUser(c.user_id)} className="flex-row items-center flex-1 active:opacity-80">
            <View className="p-0.5 rounded-full bg-white/25 border border-white/50">
              <Avatar uri={c.profile_photo} name={c.username || c.name} size={38} />
            </View>
            <View className="ml-2.5 flex-1">
              <Text className="text-white font-bold text-[15px]" numberOfLines={1}>@{c.username || "user"}</Text>
              {c.name && c.name !== c.username ? <Text className="text-white/60 text-[11px]" numberOfLines={1}>{c.name}</Text> : null}
            </View>
          </Pressable>
          {!isSelf && c.user_id && (
            <Pressable onPress={() => toggleFollow(c.user_id)}
              className={`ml-2 px-3 h-7 rounded-full items-center justify-center border ${fState === "following" ? "bg-white/15 border-white/40" : "bg-brand border-brand"}`}>
              <Text className="text-white text-[12px] font-semibold">{followLabel}</Text>
            </Pressable>
          )}
        </View>
        <View className="flex-row items-center mb-2">
          <Ionicons name="play-circle-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text className="text-white/75 text-[11px] ml-1 font-medium">{fmt(item.views_count || 0)} views</Text>
        </View>
        {item.caption ? (
          <ExpandableCaption text={item.caption} expanded={!!expandedCaptions[item.id]}
            onToggle={() => setExpandedCaptions((p) => ({ ...p, [item.id]: !p[item.id] }))} />
        ) : null}
        {chips.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-2.5">
            {chips.map((t) => (
              <View key={t} className="px-2.5 py-1 rounded-full bg-white/15 border border-white/15">
                <Text className="text-brandLight text-[11px] font-semibold">{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="absolute right-3.5 bottom-9 items-center gap-4">
        <RailBtn icon={isLiked ? "heart" : "heart-outline"} color={isLiked ? "#ff2d55" : "#fff"} active={isLiked} label={likeCount(item)} onPress={() => toggleLike(item)} />
        <RailBtn icon="chatbubble-outline" label={item.comment_count || 0} onPress={() => openComments(item)} />
        <RailBtn icon={isSaved ? "bookmark" : "bookmark-outline"} color={isSaved ? "#72b0ff" : "#fff"} active={isSaved} label={item.save_count || 0} onPress={() => toggleSave(item)} />
        <RailBtn icon="paper-plane-outline" label={item.share_count || 0} onPress={() => share(item)} />
        <RailBtn icon="ellipsis-horizontal" onPress={() => setSheet({ type: "menu", reel: item })} />
      </View>

      <View pointerEvents="none" className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15">
        {index === active && (
          <Animated.View className="h-full bg-white rounded-r-full"
            style={{ width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />
        )}
      </View>
    </View>
  );
}