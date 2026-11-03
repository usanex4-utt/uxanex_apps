// src/components/moments/MomentStrip.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MomentsAPI } from "../../api/moments";
import { useAuth } from "../../context/AuthContext";
import MomentRing from "./MomentRing";
import MomentViewer from "./MomentViewer";

export default function MomentStrip({ onCreate, refreshKey }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await MomentsAPI.storyRow();
      setGroups(d.groups || []);
    } catch { setGroups([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const openGroup = (g) => {
    const firstUnviewed = g.moments.findIndex((m) => !m.viewed);
    setViewer({
      moments: g.moments,
      index: Math.max(0, firstUnviewed),
      owner: {
        user_id: g.user_id, name: g.name,
        username: g.username, profile_photo: g.profile_photo,
      },
    });
  };

  const myGroup = groups.find((g) => g.is_mine);
  const others = groups.filter((g) => !g.is_mine);

  if (loading && !groups.length) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color="#247cff" />
      </View>
    );
  }

  return (
    <View className="py-2">
      <View className="flex-row items-center justify-between px-4 mb-2">
        <View className="flex-row items-center">
          <Ionicons name="sparkles" size={13} color="#247cff" />
          <Text className="text-white text-[13px] font-bold ml-1.5">Moments</Text>
        </View>
        <Text className="text-[#71809a] text-[11px]">24h</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {/* ── MY TILE — ALWAYS A PRESSABLE ─────────────────── */}
        {myGroup ? (
          <MomentRing
            group={myGroup}
            onPress={() => openGroup(myGroup)}
            onAdd={onCreate}
          />
        ) : (
          <Pressable
            onPress={onCreate}
            style={{ alignItems: "center" }}
            className="active:opacity-80"
          >
            <View
              style={{ width: 74, height: 74 }}
              className="items-center justify-center"
            >
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  padding: 2.5,
                  backgroundColor: "rgba(36,124,255,0.25)",
                }}
              >
                <View className="flex-1 rounded-full bg-[#0f172a] items-center justify-center border-[3px] border-[#05070b]">
                  <Ionicons name="add" size={26} color="#247cff" />
                </View>
              </View>
            </View>
            <Text className="text-[#8bb8ff] text-[11px] mt-1 font-semibold">
              Add Moment
            </Text>
          </Pressable>
        )}

        {/* ── OTHER PEOPLE'S TILES ─────────────────────────── */}
        {others.map((g) => (
          <MomentRing
            key={g.user_id}
            group={g}
            onPress={() => openGroup(g)}
          />
        ))}

        {!myGroup && !others.length && (
          <Text className="text-[#71809a] text-[12px] py-6 pr-4">
            No moments yet from your network.
          </Text>
        )}
      </ScrollView>

      {viewer && (
        <MomentViewer
          visible={!!viewer}
          moments={viewer.moments}
          startIndex={viewer.index}
          owner={viewer.owner}
          viewerId={user?.user_id}
          onClose={() => { setViewer(null); load(); }}
          onMutated={load}
        />
      )}
    </View>
  );
}