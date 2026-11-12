import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, useWindowDimensions, ActivityIndicator, Animated, AppState, Alert, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import ReelItem from "../../components/reels/ReelItem";
import { ReelCommentsSheet, ReelMenuSheet } from "../../components/reels/ReelSheets";
import {
  fetchReelsFeed, fetchSavedReels, toggleReelLike, toggleReelSave,
  setLiked, setSaved, setFollowState, patchReel, removeFeedItem,
  prependReelToFeed, // ← NEW
} from "../../store/slices/reelsSlice";
import {
  selectFeedReels, selectLikedById, selectSavedById, selectFollowStates,
} from "../../store/selectors";

const PAGE = 10;
const SESSION_ID = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export default function ReelsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const route = useRoute();
  const { height } = useWindowDimensions();
  const tabH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const h = height - tabH;

  // ── Redux state ──────────────────────────────────────
  const reels        = useSelector(selectFeedReels);
  const liked        = useSelector(selectLikedById);
  const saved        = useSelector(selectSavedById);
  const followStates = useSelector(selectFollowStates);
  const loading      = useSelector((s) => s.reels.feed.status === "loading");
  const more         = useSelector((s) => s.reels.feed.more);
  const lastFetched  = useSelector((s) => s.reels.feed.lastFetchedAt);

  // ── Local playback / UI state ────────────────────────
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pauseIcon, setPauseIcon] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [comments, setComments] = useState([]);
  const [cLoading, setCLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [expandedCaptions, setExpandedCaptions] = useState({});

  const progress = useRef({});
  const fetching = useRef(false);
  const loadedOnce = useRef(false);
  const pausedRef = useRef(false);
  const activeRef = useRef({ id: null, index: 0 });
  const lastTapRef = useRef(0);
  const singleTapTimer = useRef(null);
  const fetchedStatus = useRef({});
  const fetchedFollow = useRef({});
  const videoRefs = useRef({});
  const mutedRef = useRef(false);
  const listRef = useRef(null);
  const lastAutoAdvanceId = useRef(null);
  const focusedRef = useRef(true);

  // ── Incoming reel (from Search explore grid) ──
  const pendingReelRef = useRef(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const pauseAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const silenceAllVideos = useCallback(() => {
    Object.values(videoRefs.current).forEach((ref) => {
      if (ref) { ref.pauseAsync().catch(() => {}); ref.setIsMutedAsync(true).catch(() => {}); }
    });
  }, []);

  const fetchPage = useCallback(async (reset) => {
    if (fetching.current) return;
    fetching.current = true;
    try { await dispatch(fetchReelsFeed({ reset })).unwrap(); }
    catch {}
    fetching.current = false;
  }, [dispatch]);

  const loadSaved = useCallback(() => { dispatch(fetchSavedReels()); }, [dispatch]);

  const flushWatch = useCallback(() => {
    const { id, index } = activeRef.current;
    const p = id && progress.current[id];
    if (!p || !p.dur) return;
    const watch = Math.min(p.pos, p.dur) / 1000;
    const pct = Math.min(100, Math.round((p.pos / p.dur) * 100));
    api(EP.reelWatch(id), {
      method: "POST",
      body: { watch_time: watch, watch_percentage: pct, completed: pct >= 90, replayed: false, session_id: SESSION_ID, feed_position: index, source: "feed" },
      silent401: true,
    }).catch(() => {});
    progress.current[id] = { pos: 0, dur: p.dur };
  }, []);

  // ── STEP 1: capture incoming reel param ──
  useEffect(() => {
    const incoming = route.params?.reel;
    if (!incoming) return;
    pendingReelRef.current = incoming;
  }, [route.params?.reel]);

  // ── STEP 2: once feed is ready, prepend and scroll to that reel ──
  useEffect(() => {
    const pending = pendingReelRef.current;
    if (!pending) return;
    if (reels.length === 0) return; // wait for feed to load

    // Feed has data — prepend the incoming reel to top
    dispatch(prependReelToFeed(pending));
    pendingReelRef.current = null;
    navigation.setParams({ reel: undefined, reelId: undefined });

    // Scroll to index 0 after the state settles
    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({ index: 0, animated: false });
      } catch {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
      activeRef.current = { id: pending.id, index: 0 };
      setActive(0);
      pausedRef.current = false;
      setPaused(false);
    }, 220);

    return () => clearTimeout(t);
  }, [reels.length, dispatch, navigation]);

  useFocusEffect(useCallback(() => {
    setFocused(true); focusedRef.current = true;
    const activeVideo = videoRefs.current[activeRef.current.id];
    if (activeVideo && !pausedRef.current) {
      activeVideo.setIsMutedAsync(mutedRef.current).catch(() => {});
      activeVideo.playAsync().catch(() => {});
    }
    const stale = !lastFetched || Date.now() - lastFetched > 30_000;
    if (!loadedOnce.current || route.params?.refresh || stale) {
      loadedOnce.current = true;
      fetchPage(true);
      navigation.setParams({ refresh: undefined });
    }
    loadSaved();
    return () => {
      setFocused(false); focusedRef.current = false;
      silenceAllVideos(); flushWatch();
    };
  }, [route.params?.refresh, lastFetched, fetchPage, loadSaved, navigation, silenceAllVideos, flushWatch]));

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") { silenceAllVideos(); }
      else {
        const ref = videoRefs.current[activeRef.current.id];
        if (ref && focusedRef.current && !pausedRef.current) {
          ref.setIsMutedAsync(mutedRef.current).catch(() => {});
          ref.playAsync().catch(() => {});
        }
      }
    });
    return () => sub.remove();
  }, [silenceAllVideos]);

  const goToNext = useCallback((currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < reels.length) { listRef.current?.scrollToIndex({ index: nextIndex, animated: true }); return; }
    if (reels.length > 1) { listRef.current?.scrollToIndex({ index: 0, animated: true }); }
    else if (reels.length === 1) {
      const ref = videoRefs.current[reels[0].id];
      if (ref) { lastAutoAdvanceId.current = null; ref.setPositionAsync(0).then(() => ref.playAsync()).catch(() => {}); }
    }
  }, [reels]);

  const onViewable = useRef(({ viewableItems }) => {
    const v = viewableItems[0]; if (!v) return;
    const newId = v.item.id; const oldId = activeRef.current.id;
    if (oldId !== newId) {
      if (oldId) {
        const oldRef = videoRefs.current[oldId];
        if (oldRef) { oldRef.pauseAsync().catch(() => {}); oldRef.setIsMutedAsync(true).catch(() => {}); oldRef.setPositionAsync(0).catch(() => {}); }
      }
      flushWatch(); progressAnim.setValue(0); pausedRef.current = false; setPaused(false); lastAutoAdvanceId.current = null;
      const newRef = videoRefs.current[newId];
      if (newRef) { newRef.setPositionAsync(0).catch(() => {}); newRef.setIsMutedAsync(mutedRef.current).catch(() => {}); newRef.playAsync().catch(() => {}); }
    }
    activeRef.current = { id: newId, index: v.index ?? 0 }; setActive(v.index ?? 0);
  }).current;

  useEffect(() => () => flushWatch(), [flushWatch]);

  useEffect(() => {
    const r = reels[active]; if (!r) return;
    const c = r.creator || {};
    if (c.user_id && !fetchedFollow.current[c.user_id]) {
      fetchedFollow.current[c.user_id] = true;
      api(EP.followStatus(c.user_id), { silent401: true })
        .then((d) => {
          const st = d?.status || (d?.is_following ? "following" : "not_following");
          dispatch(setFollowState({ userId: c.user_id, state: st }));
        })
        .catch(() => {});
    }
    if (!fetchedStatus.current[r.id]) {
      fetchedStatus.current[r.id] = true;
      api(EP.reelStatus(r.id), { silent401: true })
        .then((d) => {
          if (typeof d?.rating === "number") dispatch(setLiked({ id: r.id, on: d.rating >= 2 }));
          if (d?.saved) dispatch(setSaved({ id: r.id, save: true }));
        }).catch(() => {});
    }
  }, [active, reels, dispatch]);

  const openUser = useCallback((publicId) => {
    if (!publicId) return;
    if (publicId === user?.user_id) navigation.navigate("Tabs", { screen: "Profile" });
    else navigation.navigate("UserProfile", { userId: publicId });
  }, [navigation, user?.user_id]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m; mutedRef.current = next;
      const ref = videoRefs.current[activeRef.current.id];
      if (ref) ref.setIsMutedAsync(next).catch(() => {});
      return next;
    });
    flashAnim.stopAnimation(); flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 450, delay: 350, useNativeDriver: true }).start();
  };

  const flashPause = (icon) => {
    setPauseIcon(icon); pauseAnim.stopAnimation(); pauseAnim.setValue(1);
    Animated.timing(pauseAnim, { toValue: 0, duration: 300, delay: 500, useNativeDriver: true }).start(({ finished }) => { if (finished) setPauseIcon(null); });
  };

  const togglePause = () => {
    const next = !pausedRef.current; pausedRef.current = next; setPaused(next);
    flashPause(next ? "play" : "pause");
    const ref = videoRefs.current[activeRef.current.id];
    if (ref) { if (next) ref.pauseAsync().catch(() => {}); else ref.playAsync().catch(() => {}); }
  };

  const playHeartAnim = () => {
    heartScale.setValue(0); heartOpacity.setValue(1);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1.15, friction: 4, tension: 140, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      ]),
      Animated.sequence([Animated.delay(500), Animated.timing(heartOpacity, { toValue: 0, duration: 260, useNativeDriver: true })]),
    ]).start();
  };

  const setLike = useCallback((reel, on) => {
    dispatch(toggleReelLike({ reel, on })).unwrap().catch((e) => {
      Alert.alert("Could not update like", e?.message || "Try again");
    });
  }, [dispatch]);

  const handleVideoTap = useCallback((event, reel) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      if (singleTapTimer.current) { clearTimeout(singleTapTimer.current); singleTapTimer.current = null; }
      lastTapRef.current = 0;
      playHeartAnim();
      if (!liked[reel.id]) setLike(reel, true);
    } else {
      lastTapRef.current = now;
      singleTapTimer.current = setTimeout(() => {
        singleTapTimer.current = null;
        if (lastTapRef.current === now) { lastTapRef.current = 0; togglePause(); }
      }, 260);
    }
  }, [liked, setLike]);

  const toggleFollow = useCallback(async (publicId) => {
    if (!publicId) return;
    const following = followStates[publicId] === "following";
    const next = following ? "not_following" : "following";
    dispatch(setFollowState({ userId: publicId, state: next }));
    try { await api(following ? EP.unfollow : EP.follow, { method: "POST", body: { user_id: publicId } }); }
    catch (e) {
      dispatch(setFollowState({ userId: publicId, state: following ? "following" : "not_following" }));
      Alert.alert("Could not follow", e.message);
    }
  }, [followStates, dispatch]);

  const toggleSave = useCallback((reel) => {
    dispatch(toggleReelSave({ reel, save: !saved[reel.id] })).unwrap().catch((e) => {
      Alert.alert("Failed", e?.message || "Try again");
    });
  }, [saved, dispatch]);

  const share = useCallback(async (reel) => {
    try {
      const r = await Share.share({ message: `${reel.caption ? reel.caption + "\n" : ""}${reel.video_url}` });
      if (r.action === Share.sharedAction) {
        const d = await api(EP.reelShare(reel.id), { method: "POST", body: { share_type: "native" } });
        if (typeof d.share_count === "number") dispatch(patchReel({ id: reel.id, fields: { share_count: d.share_count } }));
      }
    } catch {}
  }, [dispatch]);

  const openComments = useCallback(async (reel) => {
    setSheet({ type: "comments", reel }); setComments([]); setDraft(""); setCLoading(true);
    try { const d = await api(EP.reelComments(reel.id) + "?limit=100"); setComments(d.comments || []); } catch {}
    setCLoading(false);
  }, []);

  const sendComment = async () => {
    const reel = sheet?.reel; const content = draft.trim();
    if (!reel || !content) return;
    setDraft("");
    try {
      const d = await api(EP.reelComments(reel.id), { method: "POST", body: { content } });
      setComments((l) => [d.comment, ...l]);
      dispatch(patchReel({ id: reel.id, fields: { comment_count: (reel.comment_count || 0) + 1 } }));
      setSheet((s) => s && { ...s, reel: { ...s.reel, comment_count: (s.reel.comment_count || 0) + 1 } });
    } catch (e) { Alert.alert("Could not comment", e.message); setDraft(content); }
  };

  const deleteComment = async (c) => {
    const reel = sheet.reel;
    try {
      await api(EP.reelComment(reel.id, c.id), { method: "DELETE" });
      setComments((l) => l.filter((x) => x.id !== c.id));
      dispatch(patchReel({ id: reel.id, fields: { comment_count: Math.max(0, (reel.comment_count || 1) - 1) } }));
    } catch (e) { Alert.alert("Could not delete", e.message); }
  };

  const notInterested = useCallback(async (reel) => {
    setSheet(null); dispatch(removeFeedItem(reel.id));
    try { await api(EP.reelNotInterested(reel.id), { method: "POST" }); } catch {}
  }, [dispatch]);

  const report = useCallback(async (reel, reason) => {
    setSheet(null);
    try { await api(EP.reelReport(reel.id), { method: "POST", body: { reason } }); Alert.alert("Thanks", "Your report was submitted."); }
    catch (e) { Alert.alert("Could not report", e.message); }
  }, []);

  const remove = useCallback((reel) => {
    setSheet(null);
    Alert.alert("Delete reel", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await api(EP.reelDelete(reel.id), { method: "DELETE" }); dispatch(removeFeedItem(reel.id)); }
          catch (e) { Alert.alert("Could not delete", e.message); }
        } },
    ]);
  }, [dispatch]);

  return (
    <View className="flex-1 bg-black">
      <View pointerEvents="box-none" style={{ top: insets.top + 8 }} className="absolute left-0 right-0 z-10 px-4 flex-row items-center justify-between">
        <Text className="text-white text-[24px] font-extrabold tracking-tight">Reels</Text>
        <View className="flex-row items-center gap-2.5">
          <Pressable onPress={toggleMute} className="w-10 h-10 rounded-full bg-black/35 border border-white/20 items-center justify-center active:opacity-70">
            <Ionicons name={muted ? "volume-mute" : "volume-high"} size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => navigation.navigate("ReelUpload")} className="w-10 h-10 rounded-full bg-black/35 border border-white/20 items-center justify-center active:opacity-70">
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <Animated.View pointerEvents="none" style={{ opacity: flashAnim }} className="absolute inset-0 z-10 items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-black/55 border border-white/20 items-center justify-center">
          <Ionicons name={muted ? "volume-mute" : "volume-high"} size={34} color="#fff" />
        </View>
      </Animated.View>

      {loading && reels.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" size="large" />
          <Text className="text-white/50 text-[12px] mt-3">Loading your feed…</Text>
        </View>
      ) : (
        <FlatList ref={listRef} data={reels} pagingEnabled snapToInterval={h} decelerationRate="fast"
          showsVerticalScrollIndicator={false} keyExtractor={(r) => String(r.id)}
          onViewableItemsChanged={onViewable} viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          getItemLayout={(_, i) => ({ length: h, offset: h * i, index: i })}
          onEndReachedThreshold={0.6} onEndReached={() => { if (more && !fetching.current) fetchPage(false); }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          removeClippedSubviews
          onScrollToIndexFailed={(info) => { listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true }); setTimeout(() => { listRef.current?.scrollToIndex({ index: info.index, animated: true }); }, 100); }}
          ListEmptyComponent={
            <View style={{ height: h }} className="justify-center items-center px-10">
              <View className="w-20 h-20 rounded-full bg-white/8 border border-white/10 items-center justify-center mb-5">
                <Ionicons name="film-outline" size={34} color="#9aa7bb" />
              </View>
              <Text className="text-white text-lg font-bold mb-1">No reels yet</Text>
              <Text className="text-[#9aa7bb] text-[13px] text-center mb-6">Be the first to share a moment with everyone.</Text>
              <Pressable onPress={() => navigation.navigate("ReelUpload")} className="h-12 px-7 rounded-full bg-brand flex-row items-center justify-center active:opacity-80">
                <Ionicons name="add" size={20} color="#fff" />
                <Text className="text-white font-bold ml-1.5">Create a reel</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item, index }) => (
            <ReelItem item={item} index={index} active={active} focused={focused} muted={muted} paused={paused}
              user={user} liked={liked} saved={saved} followStates={followStates} expandedCaptions={expandedCaptions}
              setExpandedCaptions={setExpandedCaptions} progressAnim={progressAnim} pauseAnim={pauseAnim}
              pauseIcon={pauseIcon} heartScale={heartScale} heartOpacity={heartOpacity} h={h}
              videoRefs={videoRefs} progress={progress} activeRef={activeRef} lastAutoAdvanceId={lastAutoAdvanceId}
              goToNext={goToNext} handleVideoTap={handleVideoTap} toggleLike={(r) => setLike(r, !liked[r.id])}
              openComments={openComments} toggleSave={toggleSave} share={share} openUser={openUser}
              toggleFollow={toggleFollow} setSheet={setSheet} />
          )}
        />
      )}

      <ReelCommentsSheet visible={sheet?.type === "comments"} sheet={sheet} onClose={() => setSheet(null)}
        comments={comments} cLoading={cLoading} draft={draft} setDraft={setDraft}
        sendComment={sendComment} deleteComment={deleteComment} user={user} />
      <ReelMenuSheet visible={sheet?.type === "menu" || sheet?.type === "report"} sheet={sheet} setSheet={setSheet}
        onClose={() => setSheet(null)} notInterested={notInterested} report={report} remove={remove} user={user} />
    </View>
  );
}