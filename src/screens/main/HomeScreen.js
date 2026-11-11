import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "../../context/AuthContext";

import CreateSheet from "../../components/CreateSheet";
import { Avatar } from "../../components/ui";
import HomeDrawer from "../../components/home/HomeDrawer";
import ConnectionRow from "../../components/home/ConnectionRow";
import ConnectionSkeleton from "../../components/home/ConnectionSkeleton"; // <-- NEW IMPORT
import MomentStrip from "../../components/moments/MomentStrip";

import {
  fetchConnections,
  setConnectionCategory,
  invalidateConnections,
} from "../../store/slices/connectionsSlice";

import {
  selectAllConnections,
  selectConnectionCounts,
  selectConnectionsHasMore,
  selectConnectionsLoadingMore,
} from "../../store/selectors";

// =====================================================
// FILTER CONFIGURATION
// =====================================================

const FILTERS = [
  { key: "all",    label: "All Connected", chip: "All",    icon: "people-outline" },
  { key: "family", label: "Family",        chip: "Family", icon: "heart-outline"  },
  { key: "friend", label: "Friends",       chip: "Friends",icon: "person-outline" },
];

const CATEGORY_OPTIONS = [
  ["friend", "Mark as Friend", "person-outline"],
  ["family", "Mark as Family", "heart-outline"],
  [null, "Remove category", "close-circle-outline"],
];

const PAGE_FETCH_THRESHOLD = 0.5; // fetch more when 50% from bottom

// =====================================================
// HOME SCREEN
// =====================================================

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();

  const all         = useSelector(selectAllConnections);
  const counts      = useSelector(selectConnectionCounts);
  const hasMore     = useSelector(selectConnectionsHasMore);
  const loadingMore = useSelector(selectConnectionsLoadingMore);
  const error       = useSelector((state) => state.connections.error);
  
  // NEW: Check if initial data is loading
  const loading     = useSelector((state) => state.connections.status === "loading");

  const { signOut, user } = useAuth();

  const [filter,     setFilter]     = useState("all");
  const [menu,       setMenu]       = useState(false);
  const [create,     setCreate]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [picked,     setPicked]     = useState(null);

  // ===================================================
  // LOAD FIRST PAGE
  // ===================================================
  const load = useCallback(async () => {
    try {
      await dispatch(fetchConnections({ reset: false })).unwrap();
    } catch (e) {
      console.log("Home connections error:", e?.message || e);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ===================================================
  // LOAD MORE (lazy pagination)
  // ===================================================
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    dispatch(fetchConnections({}))
      .unwrap()
      .catch((e) => console.log("Load more failed:", e?.message || e));
  }, [dispatch, hasMore, loadingMore]);

  // ===================================================
  // FILTER
  // ===================================================
  const shown = useMemo(() => {
    const connections = Array.isArray(all) ? all : [];
    if (filter === "all") return connections;
    return connections.filter((person) => person.category === filter);
  }, [all, filter]);

  const title =
    FILTERS.find((item) => item.key === filter)?.label || "All Connected";

  const countOf = useCallback(
    (key) => {
      if (key === "all") return counts?.all ?? all.length;
      return counts?.[key] ?? all.filter((p) => p.category === key).length;
    },
    [counts, all]
  );

  // ===================================================
  // CREATE / CATEGORY / REFRESH
  // ===================================================
  const pick = useCallback(
    (type) => {
      setCreate(false);
      if (type === "reel") navigation.navigate("ReelUpload");
      else navigation.navigate("Profile", { me: true, edit: Date.now() });
    },
    [navigation]
  );

  const setCategory = useCallback(
    async (person, category) => {
      if (!person) return;
      setPicked(null);
      try {
        await dispatch(setConnectionCategory({ person, category })).unwrap();
      } catch (e) {
        console.log("Category update failed:", e?.message || e);
      }
    },
    [dispatch]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      dispatch(invalidateConnections());
      await dispatch(fetchConnections({ reset: true })).unwrap();
    } catch (e) {
      console.log("Refresh error:", e?.message || e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // ===================================================
  // EMPTY
  // ===================================================
  const EmptyComponent = useMemo(
    () => (
      <View className="items-center pt-16 px-10">
        <View className="w-20 h-20 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-5">
          <Ionicons
            name={filter === "all" ? "people-outline" : "heart-outline"}
            size={34}
            color="#8f9bb0"
          />
        </View>
        <Text className="text-ink text-[17px] font-bold mb-1.5">
          {filter === "all" ? "No connections yet" : "Nobody here yet"}
        </Text>
        <Text className="text-muted text-[13px] text-center leading-5">
          {filter === "all"
            ? "Use Search to find people and send connection requests."
            : "Long-press a connection to mark them as Friend or Family."}
        </Text>
      </View>
    ),
    [filter]
  );

  // ===================================================
  // HEADER
  // ===================================================
  const HeaderComponent = useMemo(
    () => (
      <View className="pt-1">
        <MomentStrip
          refreshKey={refreshing}
          onCreate={() => navigation.navigate("MomentCreate")}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 gap-2.5 py-2 mt-1"
        >
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                className={`flex-row items-center h-10 pl-3.5 pr-3 rounded-full border active:opacity-80 ${
                  active ? "bg-brand border-brand" : "bg-white/5 border-white/10"
                }`}
              >
                <Ionicons name={item.icon} size={16} color={active ? "#fff" : "#8f9bb0"} />
                <Text
                  className={`ml-2 text-[13px] ${
                    active ? "text-white font-bold" : "text-[#9aa7bb] font-medium"
                  }`}
                >
                  {item.chip}
                </Text>
                <View
                  className={`ml-2 min-w-[20px] h-5 px-1.5 rounded-full items-center justify-center ${
                    active ? "bg-white/25" : "bg-white/10"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      active ? "text-white" : "text-[#9aa7bb]"
                    }`}
                  >
                    {countOf(item.key)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {error ? (
          <View className="flex-row items-center mx-4 mt-3 px-3.5 py-2.5 rounded-2xl bg-danger/10 border border-danger/20">
            <Ionicons name="alert-circle-outline" size={16} color="#ff6b6b" />
            <Text className="text-danger text-xs ml-2 flex-1">
              {typeof error === "string" ? error : "Could not load connections"}
            </Text>
          </View>
        ) : null}

        <View className="flex-row justify-between items-end px-5 mt-5 mb-3">
          <View>
            <Text className="text-ink text-[20px] font-extrabold tracking-tight">{title}</Text>
            <Text className="text-muted text-[12px] mt-0.5">
              Press and hold a person to organize
            </Text>
          </View>
          <View className="px-3 h-7 rounded-full bg-brand/15 border border-brand/30 items-center justify-center">
            <Text className="text-brand text-xs font-bold">{shown.length}</Text>
          </View>
        </View>
      </View>
    ),
    [refreshing, navigation, filter, error, title, shown.length, countOf]
  );

  // ===================================================
  // SKELETON LOADER COMPONENTS
  // ===================================================
  
  // 1. Initial Load Skeleton (Jab pehli baar data load ho raha ho)
  const InitialSkeleton = useMemo(() => (
    <View className="pt-2 pb-10">
      {[...Array(7)].map((_, i) => (
        <ConnectionSkeleton key={i} />
      ))}
    </View>
  ), []);

  // 2. Footer Skeleton (Jab infinite scroll se next page load ho raha ho)
  const FooterSkeleton = useMemo(() => {
    if (!loadingMore) return <View className="h-4" />;
    return (
      <View className="pt-2 pb-10">
        {[...Array(3)].map((_, i) => (
          <ConnectionSkeleton key={i} />
        ))}
      </View>
    );
  }, [loadingMore]);

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* TOP NAVIGATION */}
      <View className="h-16 flex-row items-center justify-between px-4">
        <Pressable
          onPress={() => setMenu(true)}
          className="w-10 h-10 rounded-full bg-white/6 border border-white/10 items-center justify-center active:opacity-70"
        >
          <Ionicons name="menu" size={22} color="#d9e1eb" />
        </Pressable>

        <Text className="text-[22px] font-extrabold tracking-tight">
          <Text className="text-brand">UTA</Text>
          <Text className="text-white">NEXA</Text>
        </Text>

        <Pressable
          onPress={() => setCreate(true)}
          className="w-10 h-10 rounded-full bg-brand items-center justify-center active:opacity-80"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* 
        CONNECTION LIST
        - Agar initial load chal raha hai aur list khali hai, toh InitialSkeleton dikhao.
        - Warna FlatList dikhao.
      */}
      {loading && all.length === 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
          {HeaderComponent}
          {InitialSkeleton}
        </ScrollView>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item, index) => String(item.user_id ?? item.id ?? index)}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-28"
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={9}
          removeClippedSubviews={true}
          onEndReached={loadMore}
          onEndReachedThreshold={PAGE_FETCH_THRESHOLD}
          ListFooterComponent={FooterSkeleton} // <-- Yahan footer skeleton lagega
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor="#247cff"
              onRefresh={onRefresh}
            />
          }
          ListHeaderComponent={HeaderComponent}
          renderItem={({ item }) => (
            <ConnectionRow
              item={item}
              user={user}
              navigation={navigation}
              onLongPress={() => setPicked(item)}
            />
          )}
          ListEmptyComponent={EmptyComponent}
        />
      )}

      {/* NEXA AI BUTTON */}
      <View className="absolute right-5 bottom-5">
        <View className="absolute -inset-1.5 rounded-full bg-brand/20" />
        <Pressable
          onPress={() => navigation.navigate("Nexa")}
          className="h-14 pl-4 pr-5 rounded-full bg-brand flex-row items-center active:opacity-85"
        >
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text className="text-white font-bold text-[14px] ml-2">NEXA</Text>
        </Pressable>
      </View>

      {/* CREATE SHEET */}
      <CreateSheet visible={create} onClose={() => setCreate(false)} onPick={pick} />

      {/* CATEGORY MODAL */}
      <Modal
        visible={!!picked}
        transparent
        animationType="fade"
        onRequestClose={() => setPicked(null)}
      >
        <Pressable
          className="flex-1 bg-black/65 justify-center px-7"
          onPress={() => setPicked(null)}
        >
          <Pressable
            className="bg-[#0b1424] border border-white/10 rounded-[28px] p-5"
            onPress={() => {}}
          >
            <View className="items-center mb-4">
              <View className="p-0.5 rounded-full border border-brand/40 mb-3">
                <Avatar
                  uri={picked?.profile_photo}
                  name={picked?.name || picked?.username}
                  size={56}
                />
              </View>
              <Text className="text-white text-[17px] font-bold" numberOfLines={1}>
                {picked?.name || picked?.username}
              </Text>
              <Text className="text-muted text-[12px] mt-0.5">
                Organize this connection
              </Text>
            </View>

            {CATEGORY_OPTIONS.map(([key, label, icon]) => {
              const active = picked?.category === key;
              const remove = key === null;
              return (
                <Pressable
                  key={String(key)}
                  onPress={() => setCategory(picked, key)}
                  className={`py-3 flex-row items-center px-3 rounded-2xl mb-1.5 active:opacity-70 ${
                    active ? "bg-[#102f4b] border border-brand/40" : "bg-white/4"
                  }`}
                >
                  <Ionicons
                    name={icon}
                    size={19}
                    color={remove ? "#ff6b6b" : active ? "#6aa8ff" : "#bec8d5"}
                  />
                  <Text
                    className={`flex-1 ml-3 text-[14px] font-medium ${
                      remove ? "text-danger" : "text-ink"
                    }`}
                  >
                    {label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={18} color="#4d94ff" />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* HOME DRAWER */}
      <HomeDrawer
        visible={menu}
        onClose={() => setMenu(false)}
        user={user}
        filter={filter}
        setFilter={setFilter}
        FILTERS={FILTERS}
        navigation={navigation}
        onSignOut={signOut}
      />
    </SafeAreaView>
  );
}