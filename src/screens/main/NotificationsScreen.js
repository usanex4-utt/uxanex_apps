import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import RequestCard from "../../components/notifications/RequestCard";
import ActivityCard from "../../components/notifications/ActivityCard";
import { normType, normSenderId } from "../../components/notifications/notificationUtils";
import {
  fetchNotifications, respondToRequest, markNotificationRead, markAllRead,
} from "../../store/slices/notificationsSlice";
import {
  selectRequests, selectActivity, selectBusyIds, selectUnreadCount,
} from "../../store/selectors";

const SectionTitle = ({ title, count }) => (
  <View className="flex-row items-center mb-3 px-1">
    <Text className="text-white text-[17px] font-extrabold tracking-tight">{title}</Text>
    <View className="ml-2.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand/15 border border-brand/30 items-center justify-center">
      <Text className="text-brand text-[11px] font-bold">{count}</Text>
    </View>
  </View>
);

export default function NotificationsScreen({ navigation }) {
  const dispatch = useDispatch();

  const requests    = useSelector(selectRequests);
  const others      = useSelector(selectActivity);
  const busyIds     = useSelector(selectBusyIds);
  const unreadCount = useSelector(selectUnreadCount);
  const loading     = useSelector((s) => s.notifications.status === "loading");

  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const flash = useCallback((t) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const load = useCallback(async () => {
    try { await dispatch(fetchNotifications()).unwrap(); }
    catch (e) { flash(e?.message || "Failed to load notifications"); }
  }, [dispatch, flash]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const respond = async (r, accept) => {
    if (busyIds[r.request_id]) return;
    try {
      await dispatch(respondToRequest({ request: r, accept })).unwrap();
      flash(accept ? "Connected ✅" : "Request removed");
      load();
    } catch (e) { flash(e?.message || "Action failed"); }
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
    dispatch(markNotificationRead(n.id));
    openFromNotification(n);
  };

  const markAll = async () => {
    const unread = others.filter((n) => !n.is_read);
    if (!unread.length) return flash("Nothing to mark");
    try {
      await dispatch(markAllRead()).unwrap();
      flash("All marked as read");
    } catch { flash("Marked some — retrying"); load(); }
  };

  const empty = !loading && !requests.length && !others.length;

  return (
    <SafeAreaView className="flex-1 bg-[#070b12]" edges={["top"]}>
      <View className="h-[68px] flex-row items-center justify-between px-5">
        <View>
          <Text className="text-white text-[26px] font-extrabold tracking-tight">Notifications</Text>
          <Text className="text-[#71809a] text-[12px] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} new ${unreadCount === 1 ? "update" : "updates"}` : "You're all caught up"}
          </Text>
        </View>
        <Pressable onPress={markAll} hitSlop={10}
          className="w-11 h-11 rounded-full bg-white/6 border border-white/10 items-center justify-center active:opacity-70">
          <Ionicons name="checkmark-done" size={20} color="#8fb4ff" />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-4 pt-2 pb-28" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor="#247cff"
          onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }} />}>
        {loading && requests.length === 0 && others.length === 0 && (
          <ActivityIndicator color="#247cff" className="mt-10" />
        )}
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