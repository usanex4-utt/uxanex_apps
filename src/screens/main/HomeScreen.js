import React, { useCallback, useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, RefreshControl, ScrollView, Platform, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import CreateSheet from "../../components/CreateSheet";
import { Avatar } from "../../components/ui";
import HomeDrawer from "../../components/home/HomeDrawer";
import ConnectionRow from "../../components/home/ConnectionRow";
import MomentStrip from "../../components/moments/MomentStrip";

const FILTERS = [
  { key: "all", label: "All Connected", chip: "All", icon: "people-outline" },
  { key: "family", label: "Family", chip: "Family", icon: "heart-outline" },
  { key: "friend", label: "Friends", chip: "Friends", icon: "person-outline" },
];

const CATEGORY_OPTIONS = [
  ["friend", "Mark as Friend", "person-outline"],
  ["family", "Mark as Family", "heart-outline"],
  [null, "Remove category", "close-circle-outline"],
];

export default function HomeScreen({ navigation }) {
  const { signOut, user } = useAuth();
  const [people, setPeople] = useState([]);
  const [filter, setFilter] = useState("all");
  const [menu, setMenu] = useState(false);
  const [create, setCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const c = await api(EP.connections);
      setPeople(c.connections || c.users || []);
      setError("");
    } catch (e) { 
      setError(e?.message || "Could not load connections"); 
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shown = people.filter((p) => filter === "all" || p.category === filter);
  const title = FILTERS.find((f) => f.key === filter).label;
  const countOf = (k) => k === "all" ? people.length : people.filter((p) => p.category === k).length;

  const pick = (type) => {
    setCreate(false);
    if (type === "reel") navigation.navigate("ReelUpload");
    else navigation.navigate("Profile", { me: true, edit: Date.now() });
  };

  const setCategory = async (person, category) => {
    const prev = person?.category;
    setPicked(null);
    setPeople((l) => l.map((x) => (x.user_id === person.user_id ? { ...x, category } : x)));
    try {
      if (category) await api(EP.connectionCategory, { method: "POST", body: { connected_user_id: person.user_id, category } });
      else await api(EP.connectionCategoryRemove(person.user_id), { method: "DELETE" });
    } catch (e) {
      setPeople((l) => l.map((x) => (x.user_id === person.user_id ? { ...x, category: prev } : x)));
      setError(e?.message || "Could not update category");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="h-16 flex-row items-center justify-between px-4">
        <Pressable onPress={() => setMenu(true)} className="w-10 h-10 rounded-full bg-white/6 border border-white/10 items-center justify-center active:opacity-70">
          <Ionicons name="menu" size={22} color="#d9e1eb" />
        </Pressable>
        <Text className="text-[22px] font-extrabold tracking-tight">
          <Text className="text-brand">UTA</Text><Text className="text-white">NEXA</Text>
        </Text>
        <Pressable onPress={() => setCreate(true)} className="w-10 h-10 rounded-full bg-brand items-center justify-center active:opacity-80">
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <FlatList data={shown} keyExtractor={(i) => String(i.user_id)} showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
        refreshControl={<RefreshControl refreshing={refreshing} tintColor="#247cff"
          onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }} />}
        ListHeaderComponent={
          <View className="pt-1">
            {/* Moments Strip */}
            <MomentStrip
              refreshKey={refreshing}
              onCreate={() => navigation.navigate("MomentCreate")}
            />

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 gap-2.5 py-2 mt-1">
              {FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <Pressable key={f.key} onPress={() => setFilter(f.key)}
                    className={`flex-row items-center h-10 pl-3.5 pr-3 rounded-full border active:opacity-80 ${on ? "bg-brand border-brand" : "bg-white/5 border-white/10"}`}>
                    <Ionicons name={f.icon} size={16} color={on ? "#fff" : "#8f9bb0"} />
                    <Text className={`ml-2 text-[13px] ${on ? "text-white font-bold" : "text-[#9aa7bb] font-medium"}`}>{f.chip}</Text>
                    <View className={`ml-2 min-w-[20px] h-5 px-1.5 rounded-full items-center justify-center ${on ? "bg-white/25" : "bg-white/10"}`}>
                      <Text className={`text-[11px] font-bold ${on ? "text-white" : "text-[#9aa7bb]"}`}>{countOf(f.key)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {error ? (
              <View className="flex-row items-center mx-4 mt-3 px-3.5 py-2.5 rounded-2xl bg-danger/10 border border-danger/20">
                <Ionicons name="alert-circle-outline" size={16} color="#ff6b6b" />
                <Text className="text-danger text-xs ml-2 flex-1">{error}</Text>
              </View>
            ) : null}
            
            <View className="flex-row justify-between items-end px-5 mt-5 mb-3">
              <View>
                <Text className="text-ink text-[20px] font-extrabold tracking-tight">{title}</Text>
                <Text className="text-muted text-[12px] mt-0.5">Press and hold a person to organize</Text>
              </View>
              <View className="px-3 h-7 rounded-full bg-brand/15 border border-brand/30 items-center justify-center">
                <Text className="text-brand text-xs font-bold">{shown.length}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ConnectionRow item={item} user={user} navigation={navigation} onLongPress={() => setPicked(item)} />
        )}
        ListEmptyComponent={
          <View className="items-center pt-16 px-10">
            <View className="w-20 h-20 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-5">
              <Ionicons name={filter === "all" ? "people-outline" : "heart-outline"} size={34} color="#8f9bb0" />
            </View>
            <Text className="text-ink text-[17px] font-bold mb-1.5">{filter === "all" ? "No connections yet" : "Nobody here yet"}</Text>
            <Text className="text-muted text-[13px] text-center leading-5">
              {filter === "all" ? "Use Search to find people and send connection requests." : "Long-press a connection to mark them as Friend or Family."}
            </Text>
          </View>
        }
      />

      <View className="absolute right-5 bottom-5">
        <View className="absolute -inset-1.5 rounded-full bg-brand/20" />
        <Pressable onPress={() => navigation.navigate("Nexa")} className="h-14 pl-4 pr-5 rounded-full bg-brand flex-row items-center active:opacity-85">
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text className="text-white font-bold text-[14px] ml-2">NEXA</Text>
        </Pressable>
      </View>

      <CreateSheet visible={create} onClose={() => setCreate(false)} onPick={pick} />

      <Modal visible={!!picked} transparent animationType="fade" onRequestClose={() => setPicked(null)}>
        <Pressable className="flex-1 bg-black/65 justify-center px-7" onPress={() => setPicked(null)}>
          <Pressable className="bg-[#0b1424] border border-white/10 rounded-[28px] p-5" onPress={() => {}}>
            <View className="items-center mb-4">
              <View className="p-0.5 rounded-full border border-brand/40 mb-3">
                <Avatar uri={picked?.profile_photo} name={picked?.name || picked?.username} size={56} />
              </View>
              <Text className="text-white text-[17px] font-bold" numberOfLines={1}>{picked?.name || picked?.username}</Text>
              <Text className="text-muted text-[12px] mt-0.5">Organize this connection</Text>
            </View>
            {CATEGORY_OPTIONS.map(([k, l, ic]) => {
              const on = picked?.category === k; const remove = k === null;
              return (
                <Pressable key={String(k)} onPress={() => setCategory(picked, k)}
                  className={`h-13 py-3 flex-row items-center px-3 rounded-2xl mb-1.5 active:opacity-70 ${on ? "bg-[#102f4b] border border-brand/40" : "bg-white/4"}`}>
                  <Ionicons name={ic} size={19} color={remove ? "#ff6b6b" : on ? "#6aa8ff" : "#bec8d5"} />
                  <Text className={`flex-1 ml-3 text-[14px] font-medium ${remove ? "text-danger" : "text-ink"}`}>{l}</Text>
                  {on ? <Ionicons name="checkmark-circle" size={18} color="#4d94ff" /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <HomeDrawer visible={menu} onClose={() => setMenu(false)} user={user} filter={filter} setFilter={setFilter}
        FILTERS={FILTERS} navigation={navigation} onSignOut={signOut} />
    </SafeAreaView>
  );
}