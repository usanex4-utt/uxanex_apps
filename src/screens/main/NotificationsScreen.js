import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import { EP } from "../../api/endpoints";
import RequestCard from "../../components/notifications/RequestCard";
import ActivityCard from "../../components/notifications/ActivityCard";
import { normType, normSenderId } from "../../components/notifications/notificationUtils";

const SectionTitle = ({ title, count }) => (
  <View className="flex-row items-center mb-3 px-1">
    <Text className="text-white text-[17px] font-extrabold tracking-tight">{title}</Text>
    <View className="ml-2.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand/15 border border-brand/30 items-center justify-center">
      <Text className="text-brand text-[11px] font-bold">{count}</Text>
    </View>
  </View>
);

export default function NotificationsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [others, setOthers] = useState([]);
  const [busyIds, setBusyIds] = useState({});
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const flash = useCallback((t) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t); toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const load = useCallback(async () => {
    try {
      const [r, n] = await Promise.all([api(EP.connectionRequests), api(EP.connectionNotifications)]);
      const pending = r.requests || [];
      const pendingIds = new Set(pending.map((x) => x.request_id));
      setRequests(pending);
      setOthers((n.notifications || []).filter((x) => {
        const isReqType = normType(x) === "connection_request";
        const stillPending = isReqType && pendingIds.has(x.request_id);
        return !stillPending;
      }));
    } catch (e) { flash(e?.message || "Failed to load notifications"); }
    finally { setLoading(false); }
  }, [flash]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const respond = async (r, accept) => {
    if (busyIds[r.request_id]) return;
    setBusyIds((b) => ({ ...b, [r.request_id]: true }));
    const prev = requests;
    setRequests((l) => l.filter((x) => x.request_id !== r.request_id));
    try {
      await api(accept ? EP.connectionAccept(r.request_id) : EP.connectionReject(r.request_id), { method: "POST" });
      flash(accept ? "Connected ✅" : "Request removed"); load();
    } catch (e) {
      setRequests(prev); flash(e?.message || "Action failed");
    } finally {
      setBusyIds((b) => { const { [r.request_id]: _omit, ...rest } = b; return rest; });
    }
  };

  const openFromNotification = (n) => {
    if (!navigation) return;
    const uid = normSenderId(n); if (!uid) return;
    const t = normType(n);
    if (t.includes("message") || t.includes("chat")) {
      navigation.navigate("Chat", { user: { user_id: uid, name: n?.sender_name, username: n?.sender_username } });
    } else navigation.navigate("UserProfile", { userId: uid });
  };

  const markRead = async (n) => {
    if (n.is_read) return openFromNotification(n);
    setOthers((l) => l.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    try { await api(EP.connectionNotificationRead, { method: "POST", body: { notification_id: n.id } }); } catch {}
    openFromNotification(n);
  };

  const markAllRead = async () => {
    const unread = others.filter((n) => !n.is_read);
    if (!unread.length) return flash("Nothing to mark");
    setOthers((l) => l.map((x) => ({ ...x, is_read: true })));
    const results = await Promise.all(unread.map((n) =>
      api(EP.connectionNotificationRead, { method: "POST", body: { notification_id: n.id } })
        .then(() => true).catch(() => false)
    ));
    const okAll = results.every(Boolean);
    flash(okAll ? "All marked as read" : "Marked some — retrying");
    if (!okAll) load();
  };

  const empty = !loading && !requests.length && !others.length;
  const unreadCount = others.filter((n) => !n.is_read).length + requests.length;

  return (
    <SafeAreaView className="flex-1 bg-[#070b12]" edges={["top"]}>
      <View className="h-[68px] flex-row items-center justify-between px-5">
        <View>
          <Text className="text-white text-[26px] font-extrabold tracking-tight">Notifications</Text>
          <Text className="text-[#71809a] text-[12px] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} new ${unreadCount === 1 ? "update" : "updates"}` : "You're all caught up"}
          </Text>
        </View>
        <Pressable onPress={markAllRead} hitSlop={10}
          className="w-11 h-11 rounded-full bg-white/6 border border-white/10 items-center justify-center active:opacity-70">
          <Ionicons name="checkmark-done" size={20} color="#8fb4ff" />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-4 pt-2 pb-28" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor="#247cff"
          onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }} />}>
        {loading && <ActivityIndicator color="#247cff" className="mt-10" />}
        {empty && (
          <View className="items-center pt-20 px-10">
            <View className="w-24 h-24 rounded-full bg-brand/8 items-center justify-center">
              <View className="w-16 h-16 rounded-full bg-brand/15 border border-brand/30 items-center justify-center">
                <Ionicons name="notifications-outline" size={30} color="#6aa8ff" />
              </View>
            </View>
            <Text className="text-white text-[19px] font-extrabold mt-5">No notifications yet</Text>
            <Text className="text-[#71809a] text-[13px] text-center leading-5 mt-1.5">New connection requests and updates will appear here.</Text>
          </View>
        )}
        {requests.length > 0 && (
          <View className="mb-6">
            <SectionTitle title="Connection requests" count={requests.length} />
            {requests.map((r) => (
              <RequestCard key={r.request_id} request={r} busy={!!busyIds[r.request_id]}
                onAccept={() => respond(r, true)} onReject={() => respond(r, false)} />
            ))}
          </View>
        )}
        {others.length > 0 && (
          <View>
            <SectionTitle title="Activity" count={others.length} />
            {others.map((n) => <ActivityCard key={n.id} notification={n} onPress={() => markRead(n)} />)}
          </View>
        )}
      </ScrollView>

      {toast ? (
        <View pointerEvents="none" className="absolute bottom-8 self-center flex-row items-center px-4 py-3 rounded-full bg-[#111923] border border-white/12">
          <Ionicons name="information-circle" size={16} color="#6aa8ff" />
          <Text className="text-ink text-[13px] font-medium ml-2">{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}