
import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Share,
  Platform,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { absUrl } from "../../api/client";

export default function ReelPlayerModal({
  player,
  onClose,
  videoFocused,
  insets,
  isOwner,
  onDelete,
}) {
  // SHARE REEL
  const onShare = async () => {
    try {
      if (!player?.video_url) return;

      const url = absUrl(player.video_url);
      const text = `Check out this reel on UtaNexa: ${url}`;

      if (Platform.OS === "web" && navigator.share) {
        await navigator.share({
          title: "UtaNexa",
          text,
          url,
        });
      } else if (Platform.OS === "web") {
        await Clipboard.setStringAsync(text);
        alert("Reel link copied!");
      } else {
        await Share.share({
          message: text,
        });
      }
    } catch (error) {
      console.log("Reel share error:", error);
    }
  };

  return (
    <Modal
      visible={!!player}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">

        {/* REEL VIDEO */}
        {player && (
          <Video
            key={`vp-${player.id}`}
            source={{
              uri: absUrl(player.video_url),
            }}
            style={{ flex: 1 }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={videoFocused}
            isLooping
            useNativeControls
          />
        )}

        {/* REEL CAPTION */}
        {player?.caption ? (
          <View
            pointerEvents="none"
            className="absolute left-4 right-4 bottom-12 px-4 py-3 rounded-2xl bg-black/55 border border-white/10"
          >
            <Text
              className="text-white text-[14px] leading-5"
              numberOfLines={4}
            >
              {player.caption}
            </Text>
          </View>
        ) : null}

        {/* CLOSE BUTTON */}
        <Pressable
          onPress={onClose}
          style={{ top: (insets?.top || 0) + 8 }}
          className="absolute right-4 w-10 h-10 rounded-full bg-black/55 border border-white/20 items-center justify-center active:opacity-70"
        >
          <Ionicons
            name="close"
            size={22}
            color="#fff"
          />
        </Pressable>

        {/* SHARE BUTTON */}
        <Pressable
          onPress={onShare}
          style={{
            top: (insets?.top || 0) + 8,
            right: 64,
          }}
          className="absolute left-4 w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <Ionicons
            name="share-outline"
            size={20}
            color="#fff"
          />
        </Pressable>

        {/* DELETE BUTTON */}
        {isOwner && onDelete && (
          <Pressable
            onPress={() => onDelete(player)}
            style={{
              top: (insets?.top || 0) + 8,
            }}
            className="absolute left-4 w-10 h-10 rounded-full bg-red-500/80 border border-red-400 items-center justify-center active:opacity-70"
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color="#fff"
            />
          </Pressable>
        )}

      </View>
    </Modal>
  );
}
