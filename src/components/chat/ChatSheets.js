import React, { useMemo, useState } from "react";
import { View, Text, Modal, Pressable, FlatList, Image, Linking, Share, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { absUrl } from "../../api/client";
import { chatDateLabel, hhmm, seen, callUrl } from "./chatUtils";

const Sheet = ({ visible, onClose, title, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable className="flex-1 bg-black/60" onPress={onClose} />
    <View className="bg-[#0f1829] rounded-t-[28px] px-4 pt-2.5 pb-8 border-t border-white/5" style={{ maxHeight: "80%" }}>
      <View className="self-center w-9 h-1 rounded-full bg-white/20 mb-4" />
      <View className="flex-row items-center justify-between px-1 mb-4">
        <Text className="text-white text-[17px] font-bold">{title}</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={22} color="#e8eefc" />
        </Pressable>
      </View>
      {children}
    </View>
  </Modal>
);

const Row = ({ title, sub, onPress }) => (
  <Pressable onPress={onPress} className="flex-row items-center px-4 py-4 mb-2.5 rounded-2xl bg-[#18233a] active:opacity-80">
    <View className="flex-1">
      <Text className="text-white text-[15px] font-medium">{title}</Text>
      <Text className="text-[#8493ab] text-[12px] mt-0.5">{sub}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#c4d2ea" />
  </Pressable>
);

export const CallSheet = ({ visible, onClose, me, peer }) => {
  const start = (voice) => { onClose(); Linking.openURL(callUrl(me, peer, voice)).catch(() => Alert.alert("Could not open call", "No app available.")); };
  const share = async () => { onClose(); try { await Share.share({ message: `Join my call on UtaNexa: ${callUrl(me, peer, false)}` }); } catch {} };
  return (
    <Sheet visible={visible} onClose={onClose} title="Connect with this person">
      <Row title="Voice call" sub="Opens a private audio room" onPress={() => start(true)} />
      <Row title="Video call" sub="Opens a private video room" onPress={() => start(false)} />
      <Row title="Share call link" sub="Send a call URL to anyone" onPress={share} />
    </Sheet>
  );
};

export const PrivacySheet = ({ visible, onClose, shareTyping, setShareTyping, online, lastSeen, name }) => (
  <Sheet visible={visible} onClose={onClose} title="Privacy">
    <View className="flex-row items-center px-4 py-3.5 mb-2.5 rounded-2xl bg-[#18233a]">
      <View className="flex-1 pr-3">
        <Text className="text-white text-[15px] font-medium">Share typing status</Text>
        <Text className="text-[#8493ab] text-[12px] mt-0.5">Let {name} see when you are typing</Text>
      </View>
      <Switch value={shareTyping} onValueChange={setShareTyping} trackColor={{ true: "#43d9a3", false: "#33415c" }} />
    </View>
    <View className="px-4 py-3.5 rounded-2xl bg-[#18233a]">
      <Text className="text-white text-[15px] font-medium">Online & last seen</Text>
      <Text className="text-[#8493ab] text-[12px] mt-0.5">{online ? "Online now" : seen(lastSeen) || "Not available"}</Text>
    </View>
  </Sheet>
);

export const MediaSheet = ({ visible, onClose, messages }) => {
  const [tab, setTab] = useState("media");
  const mediaItems = useMemo(() => messages.filter((m) => m.media_url && (m.media_type === "image" || m.media_type === "video")), [messages]);
  const docItems = useMemo(() => messages.filter((m) => m.media_url && m.media_type !== "image" && m.media_type !== "video"), [messages]);
  const linkItems = useMemo(() => messages.flatMap((m) => ((m.content || "").match(/(https?:\/\/[^\s]+)/gi) || []).map((u, i) => ({ id: `${m.id}-${i}`, url: u }))), [messages]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Media, links & documents">
      <View className="flex-row mb-3 p-1 rounded-xl bg-[#18233a]">
        {[["media", `Media ${mediaItems.length}`], ["links", `Links ${linkItems.length}`], ["docs", `Docs ${docItems.length}`]].map(([k, l]) => (
          <Pressable key={k} onPress={() => setTab(k)} className={`flex-1 py-2 rounded-lg items-center ${tab === k ? "bg-[#2a4a80]" : ""}`}>
            <Text className={`text-[13px] font-semibold ${tab === k ? "text-white" : "text-[#8493ab]"}`}>{l}</Text>
          </Pressable>
        ))}
      </View>
      {tab === "media" ? (
        <FlatList key="grid" data={mediaItems} numColumns={3} keyExtractor={(m) => String(m.id)}
          ListEmptyComponent={<Text className="text-[#8493ab] text-center py-8">No photos or videos yet</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => Linking.openURL(absUrl(item.media_url))} className="w-1/3 aspect-square p-0.5">
              {item.media_type === "image"
                ? <Image source={{ uri: absUrl(item.media_url) }} className="flex-1 rounded-lg" resizeMode="cover" />
                : <View className="flex-1 rounded-lg bg-black items-center justify-center"><Ionicons name="play-circle" size={32} color="#fff" /></View>}
            </Pressable>
          )}
        />
      ) : tab === "links" ? (
        <FlatList key="links" data={linkItems} keyExtractor={(l) => l.id}
          ListEmptyComponent={<Text className="text-[#8493ab] text-center py-8">No links shared yet</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => Linking.openURL(item.url)} className="flex-row items-center px-3 py-3 mb-2 rounded-xl bg-[#18233a]">
              <Ionicons name="link-outline" size={18} color="#8bb8ff" />
              <Text className="text-[#8bb8ff] text-[13px] ml-3 flex-1" numberOfLines={1}>{item.url}</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList key="docs" data={docItems} keyExtractor={(m) => String(m.id)}
          ListEmptyComponent={<Text className="text-[#8493ab] text-center py-8">No documents or audio yet</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => Linking.openURL(absUrl(item.media_url))} className="flex-row items-center px-3 py-3 mb-2 rounded-xl bg-[#18233a]">
              <Ionicons name={item.media_type === "audio" ? "musical-notes" : "document-text"} size={18} color="#bcd4ff" />
              <View className="ml-3 flex-1">
                <Text className="text-white text-[13px] font-medium" numberOfLines={1}>
                  {item.media_type === "audio" ? "Audio" : "Document"} · {chatDateLabel(item.created_at)}
                </Text>
                <Text className="text-[#8493ab] text-[11px] mt-0.5">{hhmm(item.created_at)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Sheet>
  );
};

const MenuRow = ({ icon, title, sub, onPress }) => (
  <Pressable onPress={onPress} className="flex-row items-center px-5 py-3.5 active:bg-white/5">
    <Ionicons name={icon} size={19} color="#c4d2ea" />
    <View className="ml-4 flex-1">
      <Text className="text-[#f4f6fb] text-[15px] font-semibold">{title}</Text>
      {sub ? <Text className="text-[#8493ab] text-[11px] mt-0.5">{sub}</Text> : null}
    </View>
  </Pressable>
);

export const MenuList = ({ moreOpen, setMoreOpen, muted, setMuted, closeAll, navigation, peer, name, onPrivacy, onSearch, onMedia, onRefresh, listRef }) => (
  <View className="absolute right-3 rounded-2xl bg-[#101a2e] border border-white/8 overflow-hidden" style={{ top: 70, width: 270, elevation: 14 }}>
    {!moreOpen ? (
      <>
        <MenuRow icon="people-outline" title="Chat" sub="Connected, Friend, Family" onPress={() => { closeAll(); navigation.navigate("UserProfile", { userId: peer.user_id }); }} />
        <MenuRow icon="shield-outline" title="Privacy" sub="Online, last seen, typing" onPress={onPrivacy} />
        <MenuRow icon={muted ? "notifications-off-outline" : "notifications-outline"}
          title={muted ? "Unmute notifications" : "Mute notifications"} onPress={() => { setMuted((v) => !v); closeAll(); }} />
        <MenuRow icon="search-outline" title="Search" onPress={onSearch} />
        <MenuRow icon="images-outline" title="Media, links & documents" onPress={onMedia} />
        <MenuRow icon="ellipsis-horizontal" title="More" onPress={() => setMoreOpen(true)} />
      </>
    ) : (
      <>
        <MenuRow icon="chevron-back" title="Back" onPress={() => setMoreOpen(false)} />
        <MenuRow icon="person-outline" title="View profile" onPress={() => { closeAll(); navigation.navigate("UserProfile", { userId: peer.user_id }); }} />
        <MenuRow icon="share-social-outline" title="Share contact"
          onPress={async () => { closeAll(); try { await Share.share({ message: `${name}${peer.username ? " (@" + peer.username + ")" : ""} on UtaNexa` }); } catch {} }} />
        <MenuRow icon="refresh-outline" title="Refresh chat" onPress={() => { closeAll(); onRefresh(); }} />
        <MenuRow icon="arrow-down-outline" title="Jump to latest" onPress={() => { closeAll(); listRef.current?.scrollToEnd({ animated: true }); }} />
      </>
    )}
  </View>
);