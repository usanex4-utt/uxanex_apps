import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, Modal,
  Share, Alert, Platform, FlatList,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { ProfileHero, ProfileStats } from "../../components/profile/ProfileHero";
import ProfileGrid from "../../components/profile/ProfileGrid";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ReelPlayerModal from "../../components/profile/ReelPlayerModal";
import { MenuItem } from "../../components/profile/ProfileMenu";
import { Avatar } from "../../components/ui";
import ConfirmDialog from "../../components/moments/ConfirmDialog";

/* ──────────────────────────────────────────────────────────
   User List Modal — Followers / Following / Connected
   ────────────────────────────────────────────────────────── */
const UserListModal = ({
  visible, title, users, loading, onClose, navigation, onFollow, onUnfollow,
}) => {
  const [menuFor, setMenuFor] = useState(null); // user_id for ⋯ menu

  const isFollowers = title === "Followers";
  const isFollowing = title === "Following";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-[#0b1220] rounded-t-[28px] border-t border-white/10 pt-2 pb-8 h-[70%]"
          onPress={() => setMenuFor(null)}
        >
          <View className="self-center w-9 h-1 rounded-full bg-white/20 my-3" />
          <View className="flex-row items-center justify-between px-5 mb-4">
            <Text className="text-white text-[18px] font-bold">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color="#247cff" className="mt-10" />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(u) => String(u.user_id)}
              contentContainerClassName="px-5 pb-10"
              ListEmptyComponent={
                <Text className="text-[#71809a] text-center mt-10">No users found.</Text>
              }
              renderItem={({ item: u }) => (
                <View className="flex-row items-center py-3 border-b border-white/5">
                  {/* Avatar + name → open profile */}
                  <Pressable
                    onPress={() => {
                      onClose();
                      navigation.navigate("UserProfile", { userId: u.user_id });
                    }}
                    className="flex-row items-center flex-1 active:opacity-70"
                  >
                    <Avatar uri={u.profile_photo} name={u.name || u.username} size={44} />
                    <View className="ml-3 flex-1">
                      <Text className="text-white text-[15px] font-bold" numberOfLines={1}>
                        {u.name}
                      </Text>
                      <Text className="text-[#8493ab] text-[12px]" numberOfLines={1}>
                        @{u.username}
                      </Text>
                    </View>
                  </Pressable>

                  {/* ── Followers: Follow back button ── */}
                  {isFollowers && !u.is_following && (
                    <Pressable
                      onPress={() => onFollow?.(u)}
                      className="ml-2 h-8 px-3.5 rounded-full bg-[#1685ff] items-center justify-center active:opacity-80"
                    >
                      <Text className="text-white text-[12px] font-bold">Follow back</Text>
                    </Pressable>
                  )}

                  {/* ── Following: three-dot → Unfollow ── */}
                  {isFollowing && (
                    <View className="ml-2 relative">
                      <Pressable
                        onPress={() => setMenuFor(menuFor === u.user_id ? null : u.user_id)}
                        hitSlop={8}
                        className="w-9 h-9 rounded-full bg-white/6 border border-white/10 items-center justify-center active:opacity-70"
                      >
                        <Ionicons name="ellipsis-horizontal" size={16} color="#9aa7bb" />
                      </Pressable>

                      {menuFor === u.user_id && (
                        <View className="absolute right-0 top-10 z-50 w-[140px] p-1.5 rounded-2xl bg-[#0f1a2e] border border-white/12 shadow-lg">
                          <Pressable
                            onPress={() => {
                              setMenuFor(null);
                              onUnfollow?.(u);
                            }}
                            className="flex-row items-center px-3 py-2.5 rounded-xl active:bg-white/5"
                          >
                            <Ionicons name="person-remove-outline" size={16} color="#ff6b6b" />
                            <Text className="text-[#ff6b6b] text-[13px] font-semibold ml-2">
                              Unfollow
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/* ──────────────────────────────────────────────────────────
   Profile Screen
   ────────────────────────────────────────────────────────── */
export default function ProfileScreen({ navigation, route }) {
  const { user: me, signOut, patchUser } = useAuth();
  const insets = useSafeAreaInsets();
  const isMe = !!route.params?.me || route.params?.userId === me?.user_id;
  const uid = isMe ? me?.user_id : route.params?.userId;

  const [p, setP] = useState(null);
  const [tab, setTab] = useState("reels");
  const [reels, setReels] = useState([]);
  const [saved, setSaved] = useState([]);
  const [err, setErr] = useState("");
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [player, setPlayer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "", bio: "", website: "", instagram: "", social_link: "",
  });
  const [saving, setSaving] = useState(false);
  const [videoFocused, setVideoFocused] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [listModal, setListModal] = useState({
    visible: false, title: "", users: [], loading: false,
  });

  const load = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    try {
      const d = await api(isMe ? EP.myProfile : EP.profile(uid));
      setP(d); setErr("");
      if (!isMe) {
        try {
          const f = await api(EP.followStatus(uid));
          setFollowing(!!f.is_following);
        } catch {}
      }
    } catch (e) {
      setErr(e.message || "Failed to load profile");
    }
    setLoading(false);
  }, [uid, isMe]);

  const loadTab = useCallback(async () => {
    if (!uid) return;
    try {
      if (tab === "reels") {
        const d = await api(isMe ? EP.reelsMine : EP.reelsOfUser(uid));
        setReels(d.reels || []);
      } else if (tab === "saved" && isMe) {
        const d = await api(EP.reelsSaved);
        setSaved(d.reels || []);
      }
    } catch {
      if (tab === "reels") setReels([]);
      else setSaved([]);
    }
  }, [uid, tab, isMe]);

  useFocusEffect(
    useCallback(() => {
      setVideoFocused(true);
      load();
      loadTab();
      return () => { setVideoFocused(false); setPlayer(null); };
    }, [load, loadTab])
  );

  const openEdit = useCallback(() => {
    const x = p?.user || me || {};
    setForm({
      name: x.name || "",
      bio: x.bio || "",
      website: x.website || "",
      instagram: x.instagram || "",
      social_link: x.social_link || "",
    });
    setEditing(true);
  }, [p, me]);

  useEffect(() => {
    if (isMe && route.params?.edit && p) openEdit();
  }, [route.params?.edit, p, isMe, openEdit]);

  const u = p?.user;
  const stats = p?.stats || {};
  const posts = (p?.content || []).filter((x) => x.media_url);

  const saveProfile = async () => {
    if (!form.name.trim()) {
      const msg = "Please enter your name.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Name required", msg);
      return;
    }
    setSaving(true);
    try {
      const d = await api(EP.myProfile, {
        method: "PUT",
        body: { ...form, name: form.name.trim() },
      });
      patchUser({ name: d.user.name });
      setEditing(false);
      setToast({ type: "success", msg: "Profile updated!" });
      setTimeout(() => setToast(null), 1500);
      load();
    } catch (e) {
      const msg = e.message || "Could not save";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Could not save", msg);
    }
    setSaving(false);
  };

  const changePhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permission needed", "Allow photo library access.");
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (r.canceled) return;
      const a = r.assets[0];
      const ext = ((a.uri.split("?")[0].split(".").pop()) || "jpg").toLowerCase();
      const filename =
        a.fileName && /\.\w+$/.test(a.fileName) ? a.fileName : `photo_${Date.now()}.${ext}`;
      const mimeType =
        a.mimeType && a.mimeType.startsWith("image/")
          ? a.mimeType
          : ext === "png"
          ? "image/png"
          : "image/jpeg";
      const fd = new FormData();
      if (Platform.OS === "web") {
        let blob;
        if (a.file) blob = a.file;
        else {
          const resp = await fetch(a.uri);
          blob = await resp.blob();
        }
        const fileObj = new File([blob], filename, { type: mimeType });
        fd.append("photo", fileObj, filename);
      } else {
        fd.append("photo", { uri: a.uri, name: filename, type: mimeType });
      }
      const d = await api(EP.myPhoto, { method: "POST", form: fd });
      patchUser({ profile_photo: d.profile_photo });
      load();
      setToast({ type: "success", msg: "Photo updated!" });
      setTimeout(() => setToast(null), 1500);
    } catch (e) {
      Alert.alert("Upload failed", e.message || "Please try again.");
    }
  };

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);
    try {
      await api(next ? EP.follow : EP.unfollow, {
        method: "POST",
        body: { user_id: uid },
      });
      load();
    } catch (e) {
      setFollowing(!next);
      Alert.alert("Failed", e.message);
    }
  };

  const sharePro = () =>
    Share.share({
      message: `Connect with ${u?.username || "me"} on UtaNexa (${u?.user_id})`,
    });

  const openList = async (type) => {
    setListModal({ visible: true, title: type, users: [], loading: true });
    try {
      let endpoint = "";
      if (type === "Followers") endpoint = EP.userFollowers(uid);
      else if (type === "Following") endpoint = EP.userFollowing(uid);
      else if (type === "Connected") endpoint = EP.connections;

      const d = await api(endpoint);
      setListModal((prev) => ({
        ...prev,
        users: d.users || d.connections || [],
        loading: false,
      }));
    } catch {
      setListModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* Follow back from Followers list */
  const handleFollowBack = async (user) => {
    try {
      await api(EP.follow, { method: "POST", body: { user_id: user.user_id } });
      setListModal((prev) => ({
        ...prev,
        users: prev.users.map((x) =>
          x.user_id === user.user_id ? { ...x, is_following: true } : x
        ),
      }));
      load(); // stats update
    } catch (e) {
      Alert.alert("Failed", e.message || "Could not follow");
    }
  };

  /* Unfollow from Following list */
  const handleUnfollow = async (user) => {
    try {
      await api(EP.unfollow, { method: "POST", body: { user_id: user.user_id } });
      setListModal((prev) => ({
        ...prev,
        users: prev.users.filter((x) => x.user_id !== user.user_id),
      }));
      load();
    } catch (e) {
      Alert.alert("Failed", e.message || "Could not unfollow");
    }
  };

  const askDeleteReel = (reel) => setDeleteTarget(reel);

  const executeDeleteReel = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api(EP.reelDelete(deleteTarget.id), { method: "DELETE" });
      setReels((l) => l.filter((r) => r.id !== deleteTarget.id));
      setSaved((l) => l.filter((r) => r.id !== deleteTarget.id));
      setPlayer(null);
      setDeleteTarget(null);
      setToast({ type: "success", msg: "Reel deleted!" });
      setTimeout(() => setToast(null), 1500);
      load();
    } catch (e) {
      setToast({ type: "error", msg: e.message || "Delete failed" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const tabs = isMe ? ["reels", "saved", "posts"] : ["reels", "posts"];
  const grid = tab === "reels" ? reels : tab === "saved" ? saved : posts;

  return (
    <SafeAreaView className="flex-1 bg-[#050b18]" edges={["top"]}>
      {/* ── Header ── */}
      <View className="h-16 flex-row items-center justify-between px-4">
        {/* LEFT: + (own profile) OR back (other profile) */}
        {isMe ? (
          <Pressable
            onPress={() => navigation.navigate("ReelUpload")}
            className="w-10 h-10 rounded-full bg-[#1685ff] items-center justify-center active:opacity-80"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/6 border border-white/10 items-center justify-center active:opacity-70"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
        )}

        <Text
          className="flex-1 text-center text-white text-[17px] font-extrabold tracking-tight"
          numberOfLines={1}
        >
          {u ? (u.username ? `@${u.username}` : u.name) : "Profile"}
        </Text>

        <Pressable
          onPress={() => setMenu(true)}
          className="w-10 h-10 rounded-full bg-white/6 border border-white/10 items-center justify-center active:opacity-70"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#1685ff" className="mt-10" />
      ) : err ? (
        <View className="m-6 p-8 rounded-[28px] border border-white/10 bg-[#0a1424] items-center">
          <View className="w-16 h-16 rounded-full bg-danger/10 items-center justify-center mb-4">
            <Ionicons name="lock-closed-outline" size={28} color="#ff6b6b" />
          </View>
          <Text className="text-white text-lg font-extrabold mb-2">Unable to open profile</Text>
          <Text className="text-[#71809a] text-[13px] mb-5 text-center leading-5">{err}</Text>
          <Pressable
            onPress={() => (isMe ? load() : navigation.goBack())}
            className="h-11 px-6 rounded-full bg-[#1685ff] items-center justify-center active:opacity-80"
          >
            <Text className="text-white font-bold text-[14px]">
              {isMe ? "Retry" : "Go back"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="pb-24" showsVerticalScrollIndicator={false}>
          <ProfileHero
            u={u}
            isMe={isMe}
            following={following}
            onEdit={openEdit}
            onShare={sharePro}
            onFollow={toggleFollow}
            onChangePhoto={changePhoto}
            onMessage={() => navigation.navigate("Chat", { user: u })}
          />

          <ProfileStats
            stats={stats}
            onPressFollowers={() => openList("Followers")}
            onPressFollowing={() => openList("Following")}
            onPressConnected={() => openList("Connected")}
            onPressPosts={() => setTab("posts")}
          />

          <ProfileGrid
            tabs={tabs}
            tab={tab}
            setTab={setTab}
            grid={grid}
            setPlayer={setPlayer}
          />
        </ScrollView>
      )}

      {/* Bottom FAB removed — + is now top-left */}

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable className="flex-1" onPress={() => setMenu(false)}>
          <View
            style={{ top: insets.top + 60 }}
            className="absolute right-4 w-[190px] p-1.5 rounded-3xl bg-[#0b1424] border border-white/12"
          >
            {isMe && (
              <MenuItem
                icon="create-outline"
                label="Edit profile"
                onPress={() => {
                  setMenu(false);
                  openEdit();
                }}
              />
            )}
            <MenuItem
              icon="share-outline"
              label="Share"
              onPress={() => {
                setMenu(false);
                sharePro();
              }}
            />
            {isMe && (
              <>
                <View className="h-px bg-white/8 mx-2 my-1" />
                <MenuItem
                  icon="log-out-outline"
                  label="Logout"
                  danger
                  onPress={() => {
                    setMenu(false);
                    signOut?.();
                  }}
                />
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      <EditProfileModal
        visible={editing}
        onClose={() => setEditing(false)}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={saveProfile}
        onChangePhoto={changePhoto}
        u={u}
      />

      <ReelPlayerModal
        player={player}
        onClose={() => setPlayer(null)}
        videoFocused={videoFocused}
        insets={insets}
        isOwner={isMe}
        onDelete={askDeleteReel}
      />

      <UserListModal
        visible={listModal.visible}
        title={listModal.title}
        users={listModal.users}
        loading={listModal.loading}
        onClose={() => setListModal((p) => ({ ...p, visible: false }))}
        navigation={navigation}
        onFollow={handleFollowBack}
        onUnfollow={handleUnfollow}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title={deleting ? "Deleting…" : "Delete Reel?"}
        message="This reel will be permanently removed. This cannot be undone."
        confirmText={deleting ? "…" : "Delete"}
        cancelText="Cancel"
        danger
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={executeDeleteReel}
      />

      {toast && (
        <View className="absolute bottom-24 self-center px-5 py-3 rounded-2xl bg-[#0b1424] border border-white/15">
          <Text
            className={`text-[13px] font-semibold ${
              toast.type === "error" ? "text-[#ff6b6b]" : "text-white"
            }`}
          >
            {toast.msg}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}