import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "../../context/AuthContext";
import { fetchStoryRow } from "../../store/slices/momentsSlice";
import { selectMomentGroups } from "../../store/selectors";

import MomentRing from "./MomentRing";
import MomentViewer from "./MomentViewer";
import { Avatar } from "../ui";
import MomentSkeleton from "./MomentSkeleton"; // <-- Naya Import

export default function MomentStrip({ onCreate, refreshKey }) {
  // =========================================
  // REDUX & AUTH
  // =========================================
  const dispatch = useDispatch();
  const groups = useSelector(selectMomentGroups) || [];
  const loading = useSelector((state) => state.moments.status === "loading");
  const { user } = useAuth();

  // =========================================
  // LOCAL STATE
  // =========================================
  const [viewer, setViewer] = useState(null);

  // =========================================
  // FETCH MOMENTS
  // =========================================
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchStoryRow());
    }, [dispatch])
  );

  useEffect(() => {
    if (refreshKey) {
      dispatch(fetchStoryRow());
    }
  }, [dispatch, refreshKey]);

  // =========================================
  // OPEN MOMENT GROUP
  // =========================================
  const openGroup = (group) => {
    if (!group?.moments?.length) return;

    const firstUnviewed = group.moments.findIndex((moment) => !moment.viewed);

    setViewer({
      moments: group.moments,
      index: Math.max(0, firstUnviewed),
      owner: {
        user_id: group.user_id,
        name: group.name,
        username: group.username,
        profile_photo: group.profile_photo,
      },
    });
  };

  // =========================================
  // SEPARATE MY MOMENTS AND OTHERS
  // =========================================
  const myGroup = groups.find((group) => group.is_mine);
  const others = groups.filter((group) => !group.is_mine);

  // =========================================
  // UI
  // =========================================
  return (
    <View className="py-2">
      {/* 
        SKELETON LOGIC:
        Agar loading chal rahi hai AUR abhi tak koi data load nahi hua (groups.length === 0), 
        toh user ko skeleton dikhao. 
        (Isse background refresh ke time UI flicker nahi hota)
      */}
      {loading && groups.length === 0 ? (
        <MomentSkeleton />
      ) : (
        <>
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-4 mb-2">
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={13} color="#247cff" />
              <Text className="text-white text-[13px] font-bold ml-1.5">
                Moments
              </Text>
            </View>
            <Text className="text-[#71809a] text-[11px]">24h</Text>
          </View>

          {/* MOMENTS LIST */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 16,
            }}
          >
            {/* MY MOMENTS */}
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
               style={{
                width: 74,
                height: 74,
                borderRadius: 37,
                borderWidth: 3,
                borderColor: "rgba(36,124,255,0.35)",
                alignItems: "center",
                justifyContent: "center",
               }}
              >
               <Avatar
                uri={user?.profile_photo}
                name={user?.name || user?.username}
                size={64}
               />

               <View
                style={{
                 position: "absolute",
                 right: -2,
                 bottom: -2,
                 width: 25,
                 height: 25,
                 borderRadius: 13,
                 backgroundColor: "#247cff",
                 alignItems: "center",
                 justifyContent: "center",
                 borderWidth: 2,
                 borderColor: "#05070b",
                }}
               >
                <Ionicons name="add" size={19} color="#fff" />
               </View>
              </View>

              <Text className="text-[#8bb8ff] text-[11px] mt-1 font-semibold">
               Add Moment
              </Text>
             </Pressable>
            )}

            {/* OTHER USERS' MOMENTS */}
            {others.map((group) => (
              <MomentRing
                key={group.user_id}
                group={group}
                onPress={() => openGroup(group)}
              />
            ))}

            {/* EMPTY STATE */}
            {!myGroup && others.length === 0 && (
              <Text className="text-[#71809a] text-[12px] py-6 pr-4">
                No moments yet from your network.
              </Text>
            )}
          </ScrollView>
        </>
      )}

      {/* MOMENT VIEWER */}
      {viewer && (
        <MomentViewer
          visible={!!viewer}
          moments={viewer.moments}
          startIndex={viewer.index}
          owner={viewer.owner}
          viewerId={user?.user_id}
          onClose={() => {
            setViewer(null);
            dispatch(fetchStoryRow());
          }}
          onMutated={() => {
            dispatch(fetchStoryRow());
          }}
        />
      )}
    </View>
  );
}
