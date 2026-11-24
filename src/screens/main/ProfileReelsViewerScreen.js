
import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

import {
  View,
  Text,
  Pressable,
  FlatList,
  useWindowDimensions,
  Alert,
  Image,
  Share,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

import { api, absUrl } from "../../api/client";
import { EP } from "../../api/endpoints";
import {
  ReelCommentsSheet,
  YourReelOptionsSheet,
} from "../../components/reels/ReelSheets";

const count = (value) => {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

function ActionButton({ icon, color = "#fff", label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="items-center justify-center mb-5"
    >
      <Ionicons name={icon} size={27} color={color} />
      {label !== undefined && (
        <Text className="text-white text-[11px] font-semibold mt-1">
          {count(label)}
        </Text>
      )}
    </Pressable>
  );
}

function ProfileReelItem({
  item,
  active,
  height,
  profileUser,
  muted,
  paused,
  liked,
  saved,
  onVideoTap,
  onLike,
  onComment,
  onRepost,
  onShare,
  onSave,
  onMore,
  videoRef,
  onMute,
  hideCounts,
  fullScreen,
  autoScroll,
  onVideoEnd,
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const captionText = String(item?.caption || "").trim();
  const captionWords = captionText ? captionText.split(/\s+/) : [];
  const hasExtraDetails = !!item?.hashtags || !!item?.category;
  const canExpandDetails = captionWords.length > 7 || hasExtraDetails;

  const visibleCaption =
    !detailsExpanded && captionWords.length > 7
      ? `${captionWords.slice(0, 7).join(" ")}...`
      : captionText;
  const creator = item?.creator || profileUser || {};
  const videoUrl = item?.video_url ? absUrl(item.video_url) : null;
  const thumbnailUrl = item?.thumbnail_url
    ? absUrl(item.thumbnail_url)
    : null;

  const username =
    creator.username || profileUser?.username || "User";

  const userId =
    creator.user_id || profileUser?.user_id || "";

  const likeCount =
    Number(item?.likes_count || 0) +
    Number(item?.like_count || 0);

  return (
    <View style={{ height }} className="bg-black">
      {videoUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          posterSource={
            thumbnailUrl ? { uri: thumbnailUrl } : undefined
          }
          usePoster={!!thumbnailUrl}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "100%",
          }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={active && !paused}
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
           if (active && status.didJustFinish && autoScroll) {
            onVideoEnd?.(item.id);
          }
         }}
          isMuted={muted}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-[#111827]">
          <Ionicons name="videocam-off-outline" size={42} color="#888" />
          <Text className="text-white/60 mt-2">Video unavailable</Text>
        </View>
      )}

      {/* Video tap: Play / Pause */}
      <Pressable
        onPress={onVideoTap}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />

    {/* Bottom user and caption details */}
    {!fullScreen && (
      <View
        pointerEvents="box-none"
        className="absolute left-3 right-[76px] bottom-8"
      >
        <View className="flex-row items-center mb-3">
          {creator.profile_photo ? (
           <Image
            source={{ uri: absUrl(creator.profile_photo) }}
            className="w-10 h-10 rounded-full border border-white/50"
           />
         ) : (
           <View className="w-10 h-10 rounded-full border border-white/50 bg-slate-700 items-center justify-center">
            <Text className="text-white font-bold">
             {(creator.username || "U").charAt(0).toUpperCase()}
             </Text>
            </View>
           )}

          <View className="ml-2 flex-1">
            <Text
              className="text-white font-bold text-[14px]"
              numberOfLines={1}
            >
              @{username}
            </Text>

            {!!userId && (
              <Text className="text-white/65 text-[11px]">
                ID {userId}
              </Text>
            )}
          </View>
        </View>

        
        {(!!captionText || canExpandDetails) && (
          <Text className="text-white text-[13px] leading-5">
            {!!captionText && (
              <Text>{visibleCaption}</Text>
            )}
            {canExpandDetails && (
              <Text
                className="text-white/75 font-bold"
                onPress={() => setDetailsExpanded((prev) => !prev)}
              >
                {detailsExpanded ? " Less" : " More"}
              </Text>
            )}
          </Text>
        )}

        {detailsExpanded && (
          <>
            {!!item?.hashtags && (
              <Text className="text-[#9ec4ff] text-[12px] mt-1">
                {item.hashtags}
              </Text>
            )}

            {!!item?.category && (
              <Text className="text-white/65 text-[11px] mt-1">
                {item.category}
              </Text>
            )}
          </>
        )} 
      </View>
     )}

      {/* Right-side actions */}
      {!fullScreen && (
        <View className="absolute right-3 bottom-28 items-center">
        <ActionButton
          icon={liked ? "heart" : "heart-outline"}
          color={liked ? "#ff3158" : "#fff"}
          label={!hideCounts ? likeCount : undefined}
          onPress={onLike}
        />

        <ActionButton
          icon="chatbubble-outline"
          label={!hideCounts ? (item?.comment_count || 0) : undefined}
          onPress={onComment}
        />

        <ActionButton
          icon={item?.is_reposted ? "repeat" : "repeat-outline"}
          color={item?.is_reposted ? "#72b0ff" : "#fff"}
          label={!hideCounts ? (item?.repost_count || 0) : undefined}
          onPress={onRepost}
        />

        <ActionButton
          icon="paper-plane-outline"
          onPress={onShare}
        />

        <ActionButton
          icon={saved ? "bookmark" : "bookmark-outline"}
          color={saved ? "#72b0ff" : "#fff"}
          label={!hideCounts ? (item?.save_count || 0) : undefined}
          onPress={onSave}
        />

        <ActionButton
          icon="ellipsis-horizontal"
          onPress={onMore}
        />
      </View>
     )}

      {/* Pause indicator */}
      {active && paused && (
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center"
        >
          <View className="w-16 h-16 rounded-full bg-black/55 items-center justify-center">
            <Ionicons name="play" size={35} color="#fff" />
          </View>
        </View>
      )}
    </View>
  );
}

export default function ProfileReelsViewerScreen({
  navigation,
  route,
}) {
  const { height } = useWindowDimensions();

  const initialReels = useMemo(
    () =>
      Array.isArray(route.params?.reels)
        ? route.params.reels
        : [],
    [route.params?.reels]
  );

  const [reels, setReels] = useState(initialReels);

  const [activeIndex, setActiveIndex] = useState(() => {
    const id = route.params?.startReelId;
    const index = initialReels.findIndex(
      (r) => String(r.id) === String(id)
    );
    return index >= 0 ? index : 0;
  });

  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reelPreferences, setReelPreferences] = useState({
  hide_reel_counts: false,
  disable_reel_downloads: false,
});

  const [liked, setLiked] = useState(() => {
    const result = {};
    initialReels.forEach((r) => {
      result[r.id] = !!(r.is_liked || r.liked);
    });
    return result;
  });

  const [saved, setSaved] = useState(() => {
    const result = {};
    initialReels.forEach((r) => {
      result[r.id] = !!(r.is_saved || r.saved);
    });
    return result;
  });

  const [sheet, setSheet] = useState(null);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [cLoading, setCLoading] = useState(false);

  const listRef = useRef(null);
  const videoRefs = useRef({});
  const autoScrollHandledRef = useRef(new Set());
  const isOwner = !!route.params?.isOwner;

  useEffect(() => {
   if (!isOwner) return;
    

  let active = true;

  const loadReelPreferences = async () => {
    try {
      const data = await api(EP.reelPreferences);

      if (active && data?.success) {
        setReelPreferences({
          hide_reel_counts: !!data.hide_reel_counts,
          disable_reel_downloads: !!data.disable_reel_downloads,
        });
      }
    } catch (error) {
      console.log("Reel preferences load failed:", error.message);
    }
  };

  loadReelPreferences();

  return () => {
    active = false;
  };
}, [isOwner]);

  const profileUser = route.params?.profileUser || {};

  const currentReel = reels[activeIndex];

  useEffect(() => {
    const updatedReel = route.params?.updatedReel;
    if (!updatedReel?.id) return;

    setReels((previous) =>
      previous.map((item) =>
        String(item.id) === String(updatedReel.id)
          ? { ...item, ...updatedReel }
          : item
      )
    );

    navigation.setParams({ updatedReel: undefined });
  }, [route.params?.updatedReel, navigation]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }) => {
      if (viewableItems?.length) {
        setActiveIndex(viewableItems[0].index ?? 0);
        setPaused(false);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  // Pause every inactive Reel so audio never overlaps

  // Keep only the active Reel playing
  useEffect(() => {
    const activeId = String(reels[activeIndex]?.id || "");

    Object.entries(videoRefs.current).forEach(([id, ref]) => {
      if (!ref) return;

      if (String(id) === activeId && !paused) {
        ref.playAsync().catch(() => {});
      } else {
        ref.pauseAsync().catch(() => {});
      }
    });
  }, [activeIndex, paused, reels]);
  

  // Pause all videos when leaving this screen
useEffect(() => {
  const unsubscribe = navigation.addListener("blur", () => {
    Object.values(videoRefs.current).forEach((ref) => {
      if (ref) {
        ref.pauseAsync().catch(() => {});
      }
    });
  });

  return unsubscribe;
}, [navigation]);

  const togglePause = useCallback(() => {
    const next = !paused;
    setPaused(next);

    const id = currentReel?.id;
    const ref = id ? videoRefs.current[id] : null;

    if (ref) {
      if (next) ref.pauseAsync().catch(() => {});
      else ref.playAsync().catch(() => {});
    }
  }, [paused, currentReel]);

  const toggleMute = useCallback(() => {
  setMuted((previous) => !previous);
}, []);
const handleVideoEnd = useCallback((endedReelId) => {
  if (!autoScroll) return;

  const currentId = String(reels[activeIndex]?.id || "");
  const endedId = String(endedReelId || "");

  if (!currentId || endedId !== currentId) return;
  if (autoScrollHandledRef.current.has(endedId)) return;

  autoScrollHandledRef.current.add(endedId);

  const nextIndex = activeIndex + 1;

  if (nextIndex >= reels.length) {
    setAutoScroll(false);
    return;
  }

  listRef.current?.scrollToIndex({
    index: nextIndex,
    animated: true,
  });
}, [autoScroll, activeIndex, reels]);


  const toggleLike = useCallback(async (reel) => {
    if (!reel?.id) return;

    const id = reel.id;
    const next = !liked[id];

    setLiked((previous) => ({ ...previous, [id]: next }));

    setReels((previous) =>
      previous.map((r) =>
        r.id === id
          ? {
              ...r,
              likes_count: Math.max(
                0,
                Number(r.likes_count || r.like_count || 0) +
                  (next ? 1 : -1)
              ),
            }
          : r
      )
    );

    try {
      await api(next ? EP.reelLike(id) : EP.reelUnlike(id), {
        method: next ? "POST" : "DELETE",
      });
    } catch (error) {
      setLiked((previous) => ({ ...previous, [id]: !next }));
      Alert.alert("Like update failed", error.message || "Try again.");
    }
  }, [liked]);

  const toggleSave = useCallback(async (reel) => {
    if (!reel?.id) return;

    const id = reel.id;
    const next = !saved[id];

    setSaved((previous) => ({ ...previous, [id]: next }));

    try {
      await api(next ? EP.reelSave(id) : EP.reelUnsave(id), {
        method: next ? "POST" : "DELETE",
      });
    } catch (error) {
      setSaved((previous) => ({ ...previous, [id]: !next }));
      Alert.alert("Save update failed", error.message || "Try again.");
    }
  }, [saved]);

  const openComments = useCallback(async (reel) => {
    if (!reel?.id) return;

    setSheet({ type: "comments", reel });
    setComments([]);
    setDraft("");
    setReplyTo(null);
    setCLoading(true);

    try {
      const data = await api(
        EP.reelComments(reel.id) + "?limit=100"
      );
      setComments(data.comments || []);
    } catch (error) {
      Alert.alert("Comments", error.message || "Could not load comments.");
    } finally {
      setCLoading(false);
    }
  }, []);

  const sendComment = useCallback(async () => {
    const reel = sheet?.reel;
    const content = draft.trim();

    if (!reel?.id || !content) return;

    setDraft("");

    try {
      const data = await api(EP.reelComments(reel.id), {
        method: "POST",
        body: {
          content,
          parent_comment_id: replyTo?.id || null,
        },
      });

      if (data?.comment) {
        setComments((previous) => [
          {
            ...data.comment,
            parent_comment_id: replyTo?.id || null,
          },
          ...previous,
        ]);
      }

      setReels((previous) =>
        previous.map((r) =>
          r.id === reel.id
            ? {
                ...r,
                comment_count: Number(r.comment_count || 0) + 1,
              }
            : r
        )
      );

      setReplyTo(null);
    } catch (error) {
      setDraft(content);
      Alert.alert("Comment failed", error.message || "Try again.");
    }
  }, [sheet, draft, replyTo]);

  const likeComment = useCallback(async (comment) => {
    if (!comment?.id) return;

    try {
      const data = await api(EP.commentLike(comment.id), {
        method: "POST",
      });

      setComments((previous) =>
        previous.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                liked: !!data.liked,
                likes_count: Number(data.likes_count || 0),
              }
            : c
        )
      );
    } catch (error) {
      Alert.alert("Comment like failed", error.message || "Try again.");
    }
  }, []);

  const deleteComment = useCallback(async (comment) => {
    const reel = sheet?.reel;
    if (!reel?.id || !comment?.id) return;

    try {
      await api(
        EP.reelCommentDelete(reel.id, comment.id),
        { method: "DELETE" }
      );

      setComments((previous) =>
        previous.filter((c) => c.id !== comment.id)
      );
    } catch (error) {
      Alert.alert("Delete failed", error.message || "Try again.");
    }
  }, [sheet]);

  const handleRepost = useCallback(async (reel) => {
    if (!reel?.id) return;

    try {
      const data = await api(EP.reelRepost(reel.id), {
        method: "POST",
      });

      setReels((previous) =>
        previous.map((r) =>
          r.id === reel.id
            ? {
                ...r,
                is_reposted: !!data.is_reposted,
                repost_count: Number(data.repost_count || 0),
              }
            : r
        )
      );

      Alert.alert(
        data.is_reposted ? "Reposted" : "Repost removed",
        data.message || "Your Repost status has been updated."
      );
    } catch (error) {
      Alert.alert("Repost failed", error.message || "Try again.");
    }
  }, []);

  const handleShare = useCallback(async (reel) => {
    if (!reel?.id) return;

    try {
      await api(EP.reelShare(reel.id), {
        method: "POST",
        body: { share_type: "direct" },
      });

      const url = absUrl(reel.video_url);
      await Share.share({
        message: `Check out this Reel on UtaNexa: ${url}`,
      });
    } catch (error) {
      Alert.alert("Share failed", error.message || "Try again.");
    }
  }, []);

  const deleteCurrentReel = useCallback(() => {
    if (!isOwner || !currentReel || deleting) return;

    Alert.alert(
      "Delete Reel?",
      "This Reel and its media will be deleted. Historical records will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);

            try {
              await api(EP.reelDelete(currentReel.id), {
                method: "DELETE",
              });

              setReels((previous) =>
                previous.filter((r) => r.id !== currentReel.id)
              );

              if (reels.length <= 1) {
                navigation.goBack();
              } else {
                setActiveIndex((previous) =>
                  Math.max(0, Math.min(previous, reels.length - 2))
                );
              }
            } catch (error) {
              Alert.alert(
                "Delete failed",
                error.message || "Please try again."
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [isOwner, currentReel, deleting, navigation, reels.length]);

    const openMore = useCallback((reel) => {
    if (!isOwner || !reel?.id) return;

    setSheet({
      type: "your-reel-options",
      reel,
    });
  }, [isOwner]);

  if (!reels.length) {
    return (
      <SafeAreaView className="flex-1 bg-[#050b18] items-center justify-center">
        <Ionicons name="film-outline" size={45} color="#8a9bb5" />
        <Text className="text-white text-base mt-3">
          No Reels available.
        </Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-5">
          <Text className="text-[#1685ff] font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <FlatList
        ref={listRef}
        data={reels}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <ProfileReelItem
            item={item}
            active={index === activeIndex}
            height={height}
            profileUser={profileUser}
            muted={muted}
            paused={paused}
            liked={!!liked[item.id]}
            saved={!!saved[item.id]}
            onVideoTap={togglePause}
            onLike={() => toggleLike(item)}
            onComment={() => openComments(item)}
            onRepost={() => handleRepost(item)}
            onShare={() => handleShare(item)}
            onSave={() => toggleSave(item)}
            onMore={() => openMore(item)}
            videoRef={(ref) => {
              if (ref) videoRefs.current[item.id] = ref;
              else delete videoRefs.current[item.id];
            }}
            hideCounts={isOwner && reelPreferences.hide_reel_counts}
            fullScreen={fullScreen}
            autoScroll={autoScroll}
            onVideoEnd={handleVideoEnd}
          />
        )}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        initialScrollIndex={activeIndex}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
      />

      {/* Header */}
      <SafeAreaView
        pointerEvents="box-none"
        className="absolute top-0 left-0 right-0"
      >
        <View className="h-14 flex-row items-center justify-between px-4">
          <Pressable
           onPress={() => {
            if (fullScreen) {
              setFullScreen(false);
              return;
             }
             navigation.goBack();
            }}
            className="w-10 h-10 items-center justify-center"
           >
            <Ionicons name="chevron-back" size={25} color="#fff" />
          </Pressable>

          {!fullScreen && (
            <Text className="text-white font-bold text-[16px]">
             Your Reels
            </Text>
           )}

          <Pressable
           onPress={toggleMute}
           className="w-10 h-10 items-center justify-center"
          >
           <Ionicons
            name={muted ? "volume-mute" : "volume-high"}
            size={22}
            color="#fff"
           />
         </Pressable>
        </View>
      </SafeAreaView>

      <ReelCommentsSheet
        visible={sheet?.type === "comments"}
        sheet={sheet}
        onClose={() => setSheet(null)}
        comments={comments}
        cLoading={cLoading}
        draft={draft}
        setDraft={setDraft}
        sendComment={sendComment}
        likeComment={likeComment}
        deleteComment={deleteComment}
        setReplyTo={setReplyTo}
        replyTo={replyTo}
        user={profileUser}
      />
      <YourReelOptionsSheet
        visible={sheet?.type === "your-reel-options"}
        reel={sheet?.reel}
        onClose={() => setSheet(null)}
        onShare={() => {
          const reel = sheet?.reel;
          setSheet(null);
          handleShare(reel);
        }}
        onRepost={() => {
          const reel = sheet?.reel;
          setSheet(null);
          handleRepost(reel);
        }}
        onSave={() => {
          const reel = sheet?.reel;
          setSheet(null);
          toggleSave(reel);
        }}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
        onFullScreen={() => {
         setSheet(null);
         setFullScreen(true);
        }}
        onEdit={() => {
          const reel = sheet?.reel;
          setSheet(null);
          navigation.navigate("MyReelEditor", { reel });
        }}
       />
         
          
    </View>
  );
}
