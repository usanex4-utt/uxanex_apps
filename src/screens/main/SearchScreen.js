import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api, absUrl } from "../../api/client";
import { EP } from "../../api/endpoints";
import { Avatar } from "../../components/ui";
import SearchSkeleton from "../../components/home/SearchSkeleton"; // <-- Naya Import

const HINT = "Search people by name, username, user ID or mobile";

function status(u) {
  if (u.is_self || u.connection_status === "self") return "self";
  if (u.is_connected || u.connection_status === "connected") return "connected";
  if (u.request_sent || u.connection_status === "pending_sent") return "pending_sent";
  if (u.request_received || u.connection_status === "pending_received") return "pending_received";
  return "none";
}

const Action = ({ u, onConnect, onAccept, onCancel }) => {
  const s = status(u);

  if (s === "self") return null;

  if (s === "connected") {
    return (
      <View className="flex-row items-center h-9 pl-2.5 pr-3.5 rounded-full bg-[#3bb273]/12 border border-[#3bb273]/35">
        <View className="w-5 h-5 rounded-full bg-[#3bb273] items-center justify-center shadow-md shadow-[#3bb273]/60">
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
        <Text className="text-[#5fdc9d] text-[12px] font-bold ml-1.5">Connected</Text>
      </View>
    );
  }

  // Requested → tap to cancel (back to Connect)
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
    <View
      className={`rounded-2xl pb-[3px] shadow-lg ${
        accept ? "bg-[#1f8a5b] shadow-[#3bb273]/50" : "bg-[#1b4fb8] shadow-[#2f7cff]/50"
      }`}
    >
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

export default function SearchScreen({ navigation }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [viewer, setViewer] = useState(null);
  const timer = useRef(null);

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
    if (!query) {
      setUsers([]);
      setInfo("");
      return;
    }
    setLoading(true);
    setInfo("");
    try {
      const d = await api(`${EP.searchPeople}?q=${encodeURIComponent(query)}`);
      setUsers(d.users || d.results || []);
      if (!(d.users || d.results || []).length) setInfo("No users found");
    } catch (e) {
      setUsers([]);
      setInfo(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
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
      const next = d.status || "pending_sent";
      patch(u.user_id, next, { request_id: d.request_id });
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
      patch(u.user_id, "none");
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

  const idle = !q.trim() && users.length === 0;
  const noResults = !loading && !!q.trim() && users.length === 0 && info === "No users found";

  // Logic for showing Skeletons: If typing, loading, and no previous results
  const showSkeletons = loading && users.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-white text-[24px] font-extrabold tracking-tight mb-3">
          Search
        </Text>
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
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#5d6a80" />
            </Pressable>
          )}
        </View>
        {!!info && !loading ? (
          <Text className="text-[#ff6b6b] text-[12px] mt-2 px-1">{info}</Text>
        ) : null}
      </View>

      {idle ? (
        <View className="items-center pt-16 px-10">
          <View className="rounded-[30px] bg-[#0b2a5c] pb-1.5 shadow-2xl shadow-[#2f7cff]/60">
            <View className="w-24 h-24 rounded-[30px] bg-[#2f7cff] border-t border-white/35 items-center justify-center">
              <Ionicons name="people" size={42} color="#fff" />
            </View>
          </View>
          <Text className="text-white text-[19px] font-extrabold mt-8">
            Discover your people
          </Text>
          <Text className="text-[#71809a] text-[13px] text-center leading-5 mt-1.5">
            {HINT}
          </Text>
        </View>
      ) : null}

      {noResults ? (
        <View className="items-center pt-12 px-10">
          <View className="w-20 h-20 rounded-full bg-[#0a0f17] border border-black border-b-white/10 items-center justify-center shadow-lg shadow-black">
            <Ionicons name="person-outline" size={30} color="#5d6a80" />
          </View>
          <Text className="text-white text-[17px] font-bold mt-5">No one found</Text>
          <Text className="text-[#71809a] text-[13px] text-center mt-1.5">
            Check the spelling or try their username or ID.
          </Text>
        </View>
      ) : null}

      {/* 
        Yahan Skeleton List Add ki hai
        Agar loading chal rahi hai, toh FlatList ki jagah Skeletons dikhao.
      */}
      {showSkeletons ? (
        <ScrollView contentContainerClassName="px-4 pt-1 pb-10" showsVerticalScrollIndicator={false}>
          {[...Array(6)].map((_, i) => (
            <SearchSkeleton key={i} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
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
                      <Avatar
                        uri={u.profile_photo}
                        name={u.name || u.username}
                        size={50}
                      />
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
                <Action
                  u={u}
                  onConnect={connect}
                  onAccept={accept}
                  onCancel={cancel}
                />
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={!!viewer}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer(null)}
      >
        <Pressable
          className="flex-1 bg-black/95 items-center justify-center"
          onPress={() => setViewer(null)}
        >
          <View className="w-[86%] aspect-square items-center justify-center">
            <View className="absolute w-full h-full rounded-full bg-[#2f7cff]/8" />
            <View className="absolute w-[92%] h-[92%] rounded-full bg-[#2f7cff]/10" />
            <View className="w-[80%] aspect-square rounded-full p-1.5 bg-[#2f7cff]/60 shadow-2xl shadow-[#2f7cff]">
              <View className="flex-1 rounded-full overflow-hidden bg-[#11161e] border-[5px] border-[#070b12] items-center justify-center">
                {viewer?.profile_photo ? (
                  <Image
                    source={{ uri: absUrl(viewer.profile_photo) }}
                    className="w-full h-full"
                  />
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