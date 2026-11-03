import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MomentsAPI } from "../../api/moments";

const ROWS = [
  ["comments_enabled", "Comments", "Allow others to comment on your moments"],
  ["reactions_enabled", "Reactions", "Allow others to react to your moments"],
  ["viewers_visible", "Viewer list", "Let you see who viewed your moments"],
  ["notifications_enabled", "Notifications", "Notify me about moment reactions & comments"],
];

export default function MomentSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await MomentsAPI.getSettings();
      setSettings(d.settings);
    } catch { setSettings(null); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      await MomentsAPI.saveSettings(settings);
      Alert.alert("Saved", "Settings updated.");
    } catch (e) { Alert.alert("Failed", e.message); }
    setSaving(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#05070b]">
      <View className="h-14 flex-row items-center px-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}
          className="w-10 h-10 rounded-full bg-white/8 items-center justify-center">
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-center text-white text-[16px] font-bold">Moments</Text>
        <Pressable onPress={save} disabled={!settings || saving}
          className="w-10 h-10 rounded-full bg-[#247cff] items-center justify-center
                     active:opacity-80">
          {saving ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="checkmark" size={20} color="#fff" />}
        </Pressable>
      </View>

      {loading || !settings
        ? <ActivityIndicator color="#247cff" className="mt-10" />
        : <ScrollView contentContainerClassName="px-4 pt-2 pb-12 gap-2">
            <View className="mb-2">
              <Text className="text-white text-[18px] font-extrabold mb-1">Permissions</Text>
              <Text className="text-[#71809a] text-[12px]">
                Control how others interact with your moments.
              </Text>
            </View>
            {ROWS.map(([k, label, sub]) => (
              <View key={k} className="flex-row items-center p-4 rounded-2xl
                                       bg-white/4 border border-white/8">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-[14px] font-semibold">{label}</Text>
                  <Text className="text-[#71809a] text-[11px] mt-0.5">{sub}</Text>
                </View>
                <Switch value={!!settings[k]} onValueChange={(v) => update({ [k]: v })}
                  trackColor={{ true: "#247cff", false: "#33415c" }} />
              </View>
            ))}
            <Pressable onPress={() => navigation.navigate("MomentArchive")}
              className="flex-row items-center p-4 rounded-2xl bg-white/4
                         border border-white/8 active:opacity-80">
              <Ionicons name="archive-outline" size={20} color="#8fb4ff" />
              <Text className="flex-1 ml-3 text-white text-[14px] font-semibold">
                Archive
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#8493ab" />
            </Pressable>
          </ScrollView>}
    </SafeAreaView>
  );
}