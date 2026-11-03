import React from "react";
import { View, Text, Pressable, Modal, Image } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";
import { Avatar } from "../ui";

export default function StatusViewer({ visible, onClose, viewerData, viewerOwner, currentIndex, progress, videoRef, finishedRef, nextStatus, prevStatus, setProgress }) {
  const cur = viewerData[currentIndex];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <View className="absolute left-0 right-0 z-10 flex-row px-2 gap-1" style={{ top: 52 }}>
          {viewerData.map((s, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            return (
              <View key={s.id ?? i} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
                {done ? <View className="flex-1 bg-white" />
                  : current ? <View className="h-full bg-white" style={{ width: `${Math.min(100, Math.round((progress || 0) * 100))}%` }} /> : null}
              </View>
            );
          })}
        </View>

        <View className="absolute left-4 right-4 z-10 flex-row items-center justify-between" style={{ top: 68 }}>
          <View className="flex-row items-center">
            <Avatar uri={viewerOwner?.profile_photo} name={viewerOwner?.username} size={36} />
            <Text className="text-white font-bold ml-3">{viewerOwner?.username || "Status"}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        <View className="flex-1 justify-center">
          {cur?.media_type === "video" ? (
            <Video key={`v-${cur?.id}`} ref={videoRef} source={{ uri: absUrl(cur?.media_url) }}
              style={{ width: "100%", height: "100%" }} resizeMode={ResizeMode.CONTAIN} shouldPlay isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (!status.isLoaded) return;
                const dur = status.durationMillis || 0;
                if (dur > 0) setProgress(Math.min(1, (status.positionMillis || 0) / dur));
                if (status.didJustFinish && !finishedRef.current) { finishedRef.current = true; nextStatus(); }
              }} />
          ) : (
            <Image key={`i-${cur?.id}`} source={{ uri: absUrl(cur?.media_url) }}
              style={{ width: "100%", height: "100%" }} resizeMode="contain" />
          )}
        </View>

        {cur?.caption ? (
          <View className="absolute left-0 right-0 p-4 bg-black/50" style={{ bottom: 64 }}>
            <Text className="text-white text-center">{cur.caption}</Text>
          </View>
        ) : null}

        <Pressable className="absolute top-24 bottom-16 left-0 w-1/3" onPress={prevStatus} />
        <Pressable className="absolute top-24 bottom-16 right-0 w-2/3" onPress={nextStatus} />
      </View>
    </Modal>
  );
}