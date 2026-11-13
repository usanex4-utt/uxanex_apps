import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  AppState,
  Keyboard,
  Animated, // 👈 Skeleton animation ke liye add kiya
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import { api, absUrl } from "../../api/client";
import { EP } from "../../api/endpoints";
import { Avatar } from "../../components/ui";
import SearchSkeleton from "../../components/home/SearchSkeleton";

const HINT = "Search people by name, username, user ID or mobile";
const TILE_RATIO = 1.33;
const GRID_COLS = 3;
const TILE_GAP = 2;

/* ── helpers ────────────────────────────────────────── */
function status(u) {
  if (u.is_self || u.connection_status === "self") return "self";
  if (u.is_connected || u.connection_status === "connected") return "connected";
  if (u.request_sent || u.connection_status === "pending_sent") return "pending_sent";
  if (u.request_received || u.connection_status === "pending_received") return "pending_received";
  return "none";
}

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
};

/* ── Reel Grid Skeleton (Instagram style) ── */
const ReelGridSkeleton = ({ tileWidth, tileHeight }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: TILE_GAP / 2, paddingTop: 10 }}>
      {[...Array(12)].map((_, i) => (
        <View key={i} style={{ width: tileWidth, height: tileHeight, padding: TILE_GAP / 2 }}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "#1a2332", // Dark skeleton color
              borderRadius: 2,
              opacity: opacity,
            }}
          />
        </View>
      ))}
    </View>
  );
};

/* ── Action button ── */
const Action = ({ u, onConnect, onAccept, onCancel }) => {
  const s = status(u);
  if (s === "self") return null;

  if (s === "connected") {
    return (
      <View className="flex-row items-center h-9 pl-2.5 pr-3.5 rounded-full bg-[#3bb273]/12 border border-[#3bb273]/35">
        <View className="w-5 h-5 rounded-full bg-[#3bb273] items-center justify-center">
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
        <Text className="text-[#5fdc9d] text-[12px] font-bold ml-1.5">Connected</Text>
      </View>
    );
  }

  if (s === "pending_sent") {
    return (
      <Pressable
        onPress={() => onCancel(u)}
        className="min-w-[96px] h-9 px-3.5 rounded-2xl bg-[#0a0e15] border border-white/10 flex-row items-center justify-center active:opacity-70"
      >
        <Ionicons name="time-outline" size={14} color="#7e8795" />
        <Text className="text-[#7e8795] text-[12px] font-bold ml-1.5">Requested</Text>
      </Pressable>
    );
  }

  const accept = s === "pending_received";
  return (
    <View className={`rounded-2xl pb-[3px] ${accept ? "bg-[#1f8a5b]" : "bg-[#1b4fb8]"}`}>
      <Pressable
        onPress={() => (accept ? onAccept(u) : onConnect(u))}
        className={`min-w-[96px] h-9 px-3.5 rounded-2xl border-t border-white/30 flex-row items-center justify-center active:translate-y-[3px] ${
          accept ? "bg-[#3bb273]" : "bg-[#2f7cff]"
        }`}
      >
        <Ionicons name={accept ? "checkmark" : "person-add"} size={14} color="#fff" />
        <Text className="text-white text-[13px] font-bold ml-1.5">
          {accept ? "Accept" : "Connect"}
        </Text>
      </Pressable>
    </View>
  );
};

/* ── ReelCell ── */
const ReelCell = React.memo(function ReelCell({ reel, width, height, shouldPlay, onPress }) {
  const videoRef = React.useRef(null);
  
  const thumb = typeof reel?.thumbnail_url === "string" ? absUrl(reel.thumbnail_url) : null;
  const videoUrl = typeof reel?.video_url === "string" ? absUrl(reel.video_url) : null;
  
  const [videoErr, setVideoErr] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const ref = videoRef.current;
    if (!ref || !ready) return;
    if (shouldPlay) {
      ref.setIsMutedAsync(true).catch(() => {});
      ref.playAsync().catch(() => {});
    } else {
      ref.pauseAsync().catch(() => {});
    }
  }, [shouldPlay, ready]);

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
            isMuted={true}
            isLooping={true}
            shouldPlay={shouldPlay}
            progressUpdateIntervalMillis={800}
            onLoad={() => setReady(true)}
            onError={() => setVideoErr(true)}
          />
        ) : thumb ? (
          <Image source={{ uri: thumb }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="film-outline" size={24} color="#5d6a80" />
          </View>
        )}

        <View className="absolute inset-x-0 bottom-0 h-12" />

        <View className="absolute bottom-1.5 left-1.5 right-1.5 flex-row items-center">
          <Ionicons name="play" size={12} color="#fff" />
          <Text className="text-white text-[11px] font-bold ml-1">
            {fmt(reel?.views_count || 0)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

/* ── Screen ── */
export default function SearchScreen({ navigation }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [info, setInfo] = useState("");
  const [viewer, setViewer] = useState(null);
  
  const timer = useRef(null);
  const searchIdRef = useRef(0);

  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [reelsRefreshing, setReelsRefreshing] = useState(false);
  const [visibleIds, setVisibleIds] = useState(() => new Set());

  const { width } = useWindowDimensions();
  const tileSize = Math.floor(width / GRID_COLS);
  const tileHeight = Math.floor(tileSize * TILE_RATIO);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const ids = new Set((viewableItems || []).map((v) => v.item?.id).filter(Boolean));
    setVisibleIds(ids);
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 40,
    minimumViewTime: 80,
  }).current;

  useFocusEffect(
    useCallback(() => {
      return () => setVisibleIds(new Set());
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") setVisibleIds(new Set());
    });
    return () => sub.remove();
  }, []);

  const loadReels = async () => {
    try {
      const d = await api(`${EP.reelsFeed}?limit=30`);
      setReels(d?.reels || []);
    } catch {}
    finally {
      setReelsLoading(false);
      setReelsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, []);

  const patch = (userId, nextStatus, extra = {}) => {
    setUsers((list) =>
      list.map((u) => {
        if (u.user_id !== userId) return u;
        return {
          ...u,
          ...extra,
          connection_status: nextStatus,
          is_connected: nextStatus === "connected",
          request_sent: nextStatus === "pending_sent",
          request_received: nextStatus === "pending_received",
        };
      })
    );
  };

  const search = async (text) => {
    const query = text.trim();
    if (!query) return;

    const currentSearchId = ++searchIdRef.current;

    setLoading(true);
    setInfo("");
    try {
      const d = await api(`${EP.searchPeople}?q=${encodeURIComponent(query)}`);
      if (searchIdRef.current !== currentSearchId) return;

      const list = d?.users || d?.results || (Array.isArray(d) ? d : []) || [];
      setUsers(list);
      if (!list.length) setInfo("No users found");
    } catch (e) {
      if (searchIdRef.current !== currentSearchId) return;
      setUsers([]);
      setInfo(e?.message || "Search failed");
    } finally {
      if (searchIdRef.current === currentSearchId) {
        setLoading(false);
        setSearching(false);
      }
    }
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (!q.trim()) {
      searchIdRef.current++; 
      setUsers([]);
      setInfo("");
      setSearching(false);
      return;
    }

    setSearching(true);
    timer.current = setTimeout(() => search(q), 350);
    return () => clearTimeout(timer.current);
  }, [q]);

  const connect = async (u) => {
    const prev = status(u);
    patch(u.user_id, "pending_sent");
    try {
      const d = await api(EP.connectionRequest, {
        method: "POST",
        body: { user_id: u.user_id },
      });
      patch(u.user_id, d.status || "pending_sent", { request_id: d.request_id });
    } catch (e) {
      patch(u.user_id, prev);
      setInfo(e.message);
    }
  };

  const cancel = async (u) => {
    const prev = status(u);
    patch(u.user_id, "none");
    try {
      await api(EP.connectionCancel, {
        method: "POST",
        body: { user_id: u.user_id },
      });
    } catch (e) {
      patch(u.user_id, prev);
      setInfo(e.message || "Could not cancel request");
    }
  };

  const accept = async (u) => {
    try {
      const r = await api(EP.connectionRequests);
      const req = (r.requests || []).find((x) => x.sender_user_id === u.user_id);
      if (!req) return setInfo("Request not found. Pull to refresh in Alerts.");
      await api(EP.connectionAccept(req.request_id), { method: "POST" });
      patch(u.user_id, "connected");
    } catch (e) {
      setInfo(e.message);
    }
  };

  const openProfile = (u) => {
    if (status(u) === "connected" || status(u) === "self") {
      navigation.navigate("UserProfile", { userId: u.user_id });
    } else {
      setInfo("Profiles are visible only to connected users. Send a request first.");
    }
  };

  const openReel = (reel) => {
    setVisibleIds(new Set());
    navigation.navigate("Tabs", {
      screen: "Reels",
      params: {
        reelId: reel.id,
        reel,
        _t: Date.now(),
      },
      merge: true,
    });
  };

  const showExplore = !q.trim();
  const showSkeletons = (searching || loading) && users.length === 0;
  const noResults = !searching && !loading && !!q.trim() && users.length === 0;
  const isError = !!info && info !== "No users found";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Search bar */}
      <View className="px-4 pt-2 pb-3">
        <Text className="text-white text-[24px] font-extrabold tracking-tight mb-3">Search</Text>
        <View className="flex-row items-center h-12 px-3.5 rounded-2xl bg-[#0f1621] border border-white/10">
          <Ionicons name="search" size={18} color="#7e8795" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={HINT}
            placeholderTextColor="#5d6a80"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 ml-2.5 text-white text-[15px]"
          />
          {!!q && (
            <Pressable
              onPress={() => {
                Keyboard.dismiss(); 
                setQ(""); 
              }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="close-circle" size={18} color="#5d6a80" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── EXPLORE GRID ── */}
      {showExplore ? (
        reelsLoading ? (
          // 👈 YAHAN REEL SKELETON LAGA DIYA HAI
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
             <View className="flex-row items-center justify-between px-4 mb-2 mt-1">
                <View className="flex-row items-center">
                  <Ionicons name="compass-outline" size={16} color="#247cff" />
                  <Text className="text-white text-[15px] font-extrabold ml-2">Explore</Text>
                </View>
              </View>
            <ReelGridSkeleton tileWidth={tileSize} tileHeight={tileHeight} />
          </ScrollView>
        ) : (
          <FlatList
            key="explore-grid"
            data={reels}
            numColumns={GRID_COLS}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            removeClippedSubviews={false}
            windowSize={7}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            refreshControl={
              <RefreshControl
                refreshing={reelsRefreshing}
                tintColor="#247cff"
                onRefresh={() => {
                  setReelsRefreshing(true);
                  loadReels();
                }}
              />
            }
            ListHeaderComponent={
              <View className="flex-row items-center justify-between px-4 mb-2 mt-1">
                <View className="flex-row items-center">
                  <Ionicons name="compass-outline" size={16} color="#247cff" />
                  <Text className="text-white text-[15px] font-extrabold ml-2">Explore</Text>
                </View>
                {reels.length > 0 && (
                  <Text className="text-[#71809a] text-[11px]">{reels.length} reels</Text>
                )}
              </View>
            }
            ListEmptyComponent={
              <View className="items-center pt-16 px-10">
                <View className="w-20 h-20 rounded-full bg-[#0a0f17] border border-white/10 items-center justify-center mb-4">
                  <Ionicons name="film-outline" size={32} color="#5d6a80" />
                </View>
                <Text className="text-white text-[17px] font-bold">No reels yet</Text>
                <Text className="text-[#71809a] text-[13px] text-center mt-1.5">
                  Be the first to share a reel with everyone.
                </Text>
                <Pressable
                  onPress={() => navigation.navigate("ReelUpload")}
                  className="mt-5 h-11 px-6 rounded-full bg-brand flex-row items-center active:opacity-80"
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text className="text-white font-bold ml-1.5 text-[13px]">Create a reel</Text>
                </Pressable>
              </View>
            }
            renderItem={({ item }) => (
              <ReelCell
                reel={item}
                width={tileSize}
                height={tileHeight}
                shouldPlay={visibleIds.has(item.id)}
                onPress={() => openReel(item)}
              />
            )}
          />
        )
      ) : showSkeletons ? (
        // 👈 YEH SEARCH USERS KA SKELETON HAI
        <ScrollView contentContainerClassName="px-4 pt-1 pb-10" showsVerticalScrollIndicator={false}>
          {[...Array(6)].map((_, i) => (
            <SearchSkeleton key={i} />
          ))}
        </ScrollView>
      ) : noResults ? (
        <View className="items-center pt-12 px-10">
          <View
            className={`w-20 h-20 rounded-full bg-[#0a0f17] border items-center justify-center ${
              isError ? "border-[#ff6b6b]/40" : "border-white/10"
            }`}
          >
            <Ionicons
              name={isError ? "alert-circle-outline" : "person-outline"}
              size={30}
              color={isError ? "#ff6b6b" : "#5d6a80"}
            />
          </View>
          <Text className="text-white text-[17px] font-bold mt-5">
            {isError ? "Search failed" : "No one found"}
          </Text>
          <Text className={`text-[13px] text-center mt-1.5 ${isError ? "text-[#ff8a8a]" : "text-[#71809a]"}`}>
            {isError ? info : "Check the spelling or try their username or ID."}
          </Text>
        </View>
      ) : (
        <FlatList
          key="search-list"
          data={users}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyExtractor={(u, i) => String(u.user_id || i)}
          contentContainerClassName="px-4 pt-1 pb-10"
          renderItem={({ item: u }) => (
            <View className="mb-3.5 rounded-[26px] bg-[#04070b] pb-1.5 shadow-xl shadow-black/80">
              <View className="flex-row items-center p-3.5 rounded-[26px] bg-[#0f1621] border border-white/6 border-t-white/15">
                <Pressable onPress={() => setViewer(u)} className="active:opacity-80">
                  <View className="rounded-full p-[3px] bg-[#2f7cff]/45 shadow-lg shadow-[#2f7cff]/50">
                    <View className="rounded-full p-0.5 bg-[#0f1621]">
                      <Avatar uri={u.profile_photo} name={u.name || u.username} size={50} />
                    </View>
                  </View>
                </Pressable>
                <Pressable className="flex-1 mx-3.5" onPress={() => openProfile(u)}>
                  <Text className="text-white text-[16px] font-bold" numberOfLines={1}>
                    {u.name || u.username}
                  </Text>
                  <Text className="text-[#8d96a5] text-[13px] mt-0.5" numberOfLines={1}>
                    @{u.username}
                  </Text>
                </Pressable>
                <Action u={u} onConnect={connect} onAccept={accept} onCancel={cancel} />
              </View>
            </View>
          )}
        />
      )}

      {/* Fullscreen avatar viewer */}
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable className="flex-1 bg-black/95 items-center justify-center" onPress={() => setViewer(null)}>
          <View className="w-[86%] aspect-square items-center justify-center">
            <View className="absolute w-full h-full rounded-full bg-[#2f7cff]/8" />
            <View className="absolute w-[92%] h-[92%] rounded-full bg-[#2f7cff]/10" />
            <View className="w-[80%] aspect-square rounded-full p-1.5 bg-[#2f7cff]/60">
              <View className="flex-1 rounded-full overflow-hidden bg-[#11161e] border-[5px] border-[#070b12] items-center justify-center">
                {viewer?.profile_photo ? (
                  <Image source={{ uri: absUrl(viewer.profile_photo) }} className="w-full h-full" />
                ) : (
                  <Text className="text-white text-7xl font-extrabold">
                    {(viewer?.name || "U").charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View className="w-44 h-4 rounded-full bg-[#2f7cff]/20 -mt-3 mb-6" />
          <Text className="text-white text-[20px] font-extrabold tracking-tight">
            {viewer?.name || viewer?.username}
          </Text>
          {viewer?.username ? (
            <View className="mt-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/12">
              <Text className="text-[#9aa7bb] text-[13px]">@{viewer.username}</Text>
            </View>
          ) : null}
          <Text className="text-[#5d6a80] text-[12px] mt-8">Tap anywhere to close</Text>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}