import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, Pressable, FlatList, Image, ActivityIndicator,
  Alert, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MomentsAPI } from "../../api/moments";
import { mediaUri, when } from "./momentUtils";
import ConfirmDialog from "./ConfirmDialog";

const notify = (title, msg) => {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    window.alert(`${title}\n\n${msg || ""}`.trim());
  } else {
    Alert.alert(title, msg);
  }
};

export default function MomentArchiveScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // confirm + deleting state
  const [pending, setPending] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await MomentsAPI.archive();
      setItems(d.moments || []);
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async (m) => {
    try {
      await MomentsAPI.restoreOne(m.id);
      setItems((l) => l.filter((x) => x.id !== m.id));
    } catch (e) { notify("Failed", e.message); }
  };

  const askDelete = (m) => setPending(m);

  const executeDelete = async () => {
    if (!pending || deleting) return;
    setDeleting(true);
    try {
      await MomentsAPI.remove(pending.id);
      setItems((l) => l.filter((x) => x.id !== pending.id));
      setPending(null);
    } catch (e) {
      setPending(null);
      notify("Delete failed", e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#05070b]">
      <View className="h-14 flex-row items-center px-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}
          className="w-10 h-10 rounded-full bg-white/8 items-center justify-center">
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-center text-white text-[16px] font-bold">Archive</Text>
        <View className="w-10" />
      </View>

      {loading
        ? <ActivityIndicator color="#247cff" className="mt-10" />
        : <FlatList data={items} keyExtractor={(m) => String(m.id)}
            contentContainerClassName="px-4 pb-16 gap-3"
            ListEmptyComponent={
              <View className="items-center pt-24 px-10">
                <Ionicons name="archive-outline" size={40} color="#5d6a80" />
                <Text className="text-white text-[16px] font-bold mt-4">Archive is empty</Text>
                <Text className="text-[#71809a] text-[12px] text-center mt-2">
                  Archived moments will appear here.
                </Text>
              </View>
            }
            renderItem={({ item: m }) => {
              const uri = mediaUri(m);
              return (
                <View className="flex-row items-center p-3 rounded-2xl
                                  bg-white/4 border border-white/8">
                  {uri
                    ? <Image source={{ uri }} className="w-14 h-14 rounded-xl bg-black"
                             resizeMode="cover" />
                    : <View className="w-14 h-14 rounded-xl bg-white/8 items-center
                                      justify-center">
                        <Ionicons name="text-outline" size={22} color="#8fb4ff" />
                      </View>}
                  <View className="flex-1 ml-3">
                    <Text className="text-white text-[13px] font-semibold"
                      numberOfLines={1}>{m.caption || "Moment"}</Text>
                    <Text className="text-[#71809a] text-[11px] mt-0.5">
                      {m.moment_type} · {when(m.created_at)}
                    </Text>
                  </View>
                  <Pressable onPress={() => restore(m)} hitSlop={6}
                    className="w-9 h-9 rounded-full bg-white/8 items-center
                               justify-center active:opacity-70">
                    <Ionicons name="refresh-outline" size={16} color="#8fb4ff" />
                  </Pressable>
                  <Pressable onPress={() => askDelete(m)} hitSlop={6}
                    className="w-9 h-9 rounded-full bg-red-500/15 items-center
                               justify-center ml-2 active:opacity-70">
                    <Ionicons name="trash-outline" size={15} color="#ff6b6b" />
                  </Pressable>
                </View>
              );
            }} />}

      <ConfirmDialog
        visible={!!pending}
        title={deleting ? "Deleting…" : "Delete moment?"}
        message="This moment will be permanently removed. This cannot be undone."
        confirmText={deleting ? "…" : "Delete"}
        cancelText="Cancel"
        danger
        onCancel={() => { if (!deleting) setPending(null); }}
        onConfirm={executeDelete}
      />
    </SafeAreaView>
  );
}