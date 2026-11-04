
import React, { memo } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Linking,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";

import { absUrl } from "../../api/client";
import { Avatar } from "../ui";
import { hhmm } from "./chatUtils";

// =====================================================
// CHAT HEADER
// =====================================================

const Header = ({ peer, name }) => (
  <View className="items-center pt-8 pb-5">

    <View className="p-1 rounded-full border border-white/10 bg-white/4">
      <Avatar
        uri={peer?.profile_photo}
        name={name}
        size={72}
      />
    </View>

    <Text className="text-white text-[18px] font-extrabold mt-3">
      {name}
    </Text>

    {peer?.username ? (
      <Text className="text-[#8493ab] text-[12px] mt-0.5">
        @{peer.username}
      </Text>
    ) : null}

    <View className="flex-row items-center mt-4 px-3.5 py-1.5 rounded-full bg-[#151e2f] border border-white/5">

      <Ionicons
        name="lock-closed"
        size={11}
        color="#8bb8ff"
      />

      <Text className="text-[#9fb0c9] text-[11px] ml-1.5">
        Your private conversation starts here
      </Text>

    </View>
  </View>
);

// =====================================================
// DATE SEPARATOR
// =====================================================

const DateSeparator = ({ label }) => (
  <View className="items-center py-3">

    <Text className="text-[#9fb0c9] text-[11px] font-medium bg-[#121b2d] border border-white/5 px-4 py-1 rounded-full overflow-hidden">
      {label}
    </Text>

  </View>
);

// =====================================================
// TYPING INDICATOR
// =====================================================

const TypingIndicator = () => (
  <View className="px-4 pb-1.5">

    <View className="self-start flex-row items-center px-3 py-1.5 rounded-full bg-[#121b2d] border border-white/5">

      <View className="flex-row gap-1">

        <View className="w-1.5 h-1.5 rounded-full bg-[#8bb8ff]" />

        <View className="w-1.5 h-1.5 rounded-full bg-[#8bb8ff]/70" />

        <View className="w-1.5 h-1.5 rounded-full bg-[#8bb8ff]/40" />

      </View>

      <Text className="text-[#8493ab] text-[11px] ml-2">
        typing
      </Text>

    </View>

  </View>
);

// =====================================================
// EMOJI PICKER
// =====================================================

const EmojiPicker = ({ emojis = [], onPick }) => (
  <View
    className="bg-[#0c1322] border-t border-white/5 px-2 py-2 flex-row flex-wrap"
    style={{ maxHeight: 200 }}
  >

    {emojis.map((emoji, index) => (
      <Pressable
        key={`${emoji}-${index}`}
        onPress={() => onPick?.(emoji)}
        className="w-[12.5%] items-center py-1.5 active:opacity-60"
      >
        <Text style={{ fontSize: 24 }}>
          {emoji}
        </Text>
      </Pressable>
    ))}

  </View>
);

// =====================================================
// MESSAGE COMPONENT
// =====================================================

const Message = memo(
  function Message({ message: m, me, onDelete }) {

    if (!m) return null;

    const mine = m.sender_id === me?.id;

    const url = m.media_url
      ? absUrl(m.media_url)
      : null;

    const hasMedia =
      !!m.media_url &&
      (m.media_type === "image" || m.media_type === "video");

    const openMedia = () => {
      if (url) {
        Linking.openURL(url).catch((error) => {
          console.warn("Unable to open media:", error);
        });
      }
    };

    return (
      <Pressable
        onLongPress={() => onDelete?.(m)}
        delayLongPress={400}
        className={`max-w-[80%] rounded-[18px] overflow-hidden ${
          hasMedia && !m.content
            ? "p-1"
            : "px-3.5 pt-2.5 pb-2"
        } ${
          mine
            ? "self-end bg-[#16355f] border border-[#2a5a9a]/40 rounded-br-md"
            : "self-start bg-[#121b2d] border border-white/6 rounded-bl-md"
        } ${
          m.pending ? "opacity-60" : ""
        }`}
      >

        {/* IMAGE MESSAGE */}

        {m.media_url && m.media_type === "image" ? (
          <Pressable onPress={openMedia}>
            <Image
              source={{ uri: url }}
              className="w-[230px] h-[230px] rounded-2xl mb-1"
              resizeMode="cover"
            />
          </Pressable>
        ) : null}

        {/* VIDEO MESSAGE */}

        {m.media_url && m.media_type === "video" ? (
          <Video
            source={{ uri: url }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            style={{
              width: 230,
              height: 230,
              borderRadius: 16,
              marginBottom: 4,
              backgroundColor: "#000",
            }}
          />
        ) : null}

        {/* AUDIO / DOCUMENT MESSAGE */}

        {m.media_url &&
        m.media_type !== "image" &&
        m.media_type !== "video" ? (

          <Pressable
            onPress={openMedia}
            className="flex-row items-center mb-1.5 pr-3 py-2 pl-2 rounded-xl bg-black/20 active:opacity-70"
          >

            <View className="w-9 h-9 rounded-lg bg-white/10 items-center justify-center">

              <Ionicons
                name={
                  m.media_type === "audio"
                    ? "musical-notes"
                    : "document-text"
                }
                size={18}
                color="#bcd4ff"
              />

            </View>

            <Text className="text-[#dbe8ff] text-[13px] font-semibold ml-2.5">
              {m.media_type === "audio"
                ? "Play audio"
                : "Open file"}
            </Text>

          </Pressable>

        ) : null}

        {/* MESSAGE TEXT */}

        {m.content ? (
          <Text className="text-[#f4f6fb] text-[15px] leading-[21px]">
            {m.content}
          </Text>
        ) : null}

        {/* MESSAGE TIME + STATUS */}

        <View
          className={`flex-row justify-end items-center mt-0.5 gap-1 ${
            hasMedia && !m.content
              ? "pr-2 pb-1"
              : ""
          }`}
        >

          <Text
            className={`text-[10px] ${
              mine
                ? "text-white/60"
                : "text-[#8493ab]"
            }`}
          >
            {hhmm(m.created_at)}
          </Text>

          {/* PENDING STATUS */}

          {mine && m.pending ? (
            <Ionicons
              name="time-outline"
              size={12}
              color="#ffffff99"
            />
          ) : null}

          {/* SENT / READ STATUS */}

          {mine && !m.pending ? (
            <Ionicons
              name={
                m.is_read
                  ? "checkmark-done"
                  : "checkmark"
              }
              size={14}
              color={
                m.is_read
                  ? "#7ff0c8"
                  : "#ffffff99"
              }
            />
          ) : null}

        </View>

      </Pressable>
    );
  },

  // ===================================================
  // MEMO COMPARISON
  // ===================================================

  (prev, next) =>
    prev.message === next.message &&
    prev.me?.id === next.me?.id &&
    prev.onDelete === next.onDelete
);

// =====================================================
// ATTACH SUB COMPONENTS
// =====================================================

Message.Header = Header;
Message.DateSeparator = DateSeparator;
Message.TypingIndicator = TypingIndicator;
Message.EmojiPicker = EmojiPicker;

// =====================================================
// EXPORT
// =====================================================

export default Message;
