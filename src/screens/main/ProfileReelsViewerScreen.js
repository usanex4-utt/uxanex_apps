import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";

import {
  View,
  Text,
  Pressable,
  FlatList,
  useWindowDimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

import { api, absUrl } from "../../api/client";
import { EP } from "../../api/endpoints";

function ProfileReelItem({ item, active, height, profileUser }) {
  const videoUrl = item?.video_url ? absUrl(item.video_url) : null;
  const thumbnailUrl = item?.thumbnail_url
    ? absUrl(item.thumbnail_url)
    : null;

  return (
    <View style={{ height }} className="bg-black">
      {videoUrl ? (
        <Video
          source={{ uri: videoUrl }}
          posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
          usePoster={!!thumbnailUrl}
          style={{ width: "100%", height: "100%" }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={active}
          isLooping
          isMuted={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="videocam-off-outline" size={42} color="#888" />
          <Text className="text-white/60 mt-2">Video unavailable</Text>
        </View>
      )}

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-20"
        style={{ backgroundColor: "rgba(0,0,0,0.48)" }}>
        <View>
         <Text className="text-white font-bold text-[15px]">
          @{item?.creator?.username || profileUser?.username || "User"}
         </Text>

        {item?.is_repost && item?.reposted_by?.username ? (
         <Text className="text-white/60 text-[12px] mt-1">
          Reposted by @{item.reposted_by.username}
         </Text>
       ) : null}
      </View>

        {!!item?.caption && (
          <Text className="text-white text-[13px] mt-2" numberOfLines={4}>
            {item.caption}
          </Text>
        )}

        {!!item?.hashtags && (
          <Text className="text-[#9ec4ff] text-[12px] mt-1" numberOfLines={2}>
            {item.hashtags}
          </Text>
        )}

        {!!item?.category && (
          <Text className="text-white/60 text-[11px] mt-1">
            {item.category}
          </Text>
        )}
      </View>

      <View className="absolute right-3 bottom-36 items-center">
        <View className="items-center mb-5">
          <Ionicons name="eye-outline" size={25} color="#fff" />
          <Text className="text-white text-[11px] mt-1">
            {item?.views_count ?? item?.view_count ?? 0}
          </Text>
        </View>

        <View className="items-center mb-5">
          <Ionicons name="heart-outline" size={25} color="#fff" />
          <Text className="text-white text-[11px] mt-1">
            {item?.likes_count ?? item?.like_count ?? 0}
          </Text>
        </View>

        <View className="items-center mb-5">
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          <Text className="text-white text-[11px] mt-1">
            {item?.comment_count ?? 0}
          </Text>
        </View>

        <View className="items-center mb-5">
          <Ionicons name="thumbs-up-outline" size={24} color="#fff" />
          <Text className="text-white text-[11px] mt-1">
            {item?.interested_count ?? 0}
          </Text>
        </View>

        <View className="items-center">
          <Ionicons name="thumbs-down-outline" size={24} color="#fff" />
          <Text className="text-white text-[11px] mt-1">
            {item?.not_interested_count ?? 0}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ProfileReelsViewerScreen({ navigation, route }) {
  const { height } = useWindowDimensions();

  const initialReels = useMemo(
    () => Array.isArray(route.params?.reels) ? route.params.reels : [],
    [route.params?.reels]
  );

  const [reels, setReels] = useState(initialReels);
  const [activeIndex, setActiveIndex] = useState(() => {
    const id = route.params?.startReelId;
    const index = initialReels.findIndex((r) => String(r.id) === String(id));
    return index >= 0 ? index : 0;
  });
  const [deleting, setDeleting] = useState(false);
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

  const isOwner = !!route.params?.isOwner;
  const profileUser = route.params?.profileUser || {};
  const listRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const currentReel = reels[activeIndex];

  const deleteCurrentReel = useCallback(() => {
    if (!isOwner || !currentReel || deleting) return;

    Alert.alert(
      "Delete Reel?",
      "This Reel and its media will be permanently deleted. Its historical records will be preserved.",
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

              navigation.goBack();
            } catch (error) {
              Alert.alert("Delete failed", error.message || "Please try again.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [isOwner, currentReel, deleting, navigation]);

  if (!reels.length) {
    return (
      <SafeAreaView className="flex-1 bg-[#050b18] items-center justify-center">
        <Text className="text-white text-base">No Reels available.</Text>
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

      <SafeAreaView
        pointerEvents="box-none"
        className="absolute top-0 left-0 right-0"
      >
        <View className="h-14 flex-row items-center justify-between px-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-black/45 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={25} color="#fff" />
          </Pressable>

          <Text className="text-white font-bold text-[16px]">
            Reels
          </Text>

          {isOwner ? (
           <View className="flex-row items-center gap-3">
            <Pressable
             onPress={() =>
              navigation.navigate("MyReelEditor", {
               reel: currentReel,
              })
             }
             className="w-10 h-10 rounded-full bg-black/45 items-center justify-center"
            >
             <Ionicons name="create-outline" size={22} color="#1685ff" />
            </Pressable>

            <Pressable
             onPress={deleteCurrentReel}
             disabled={deleting}
             className="w-10 h-10 rounded-full bg-black/45 items-center justify-center"
            >
             <Ionicons name="trash-outline" size={21} color="#ff5b65" />
           </Pressable>
          </View>
         ) : (
           <View className="w-10 h-10" />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
