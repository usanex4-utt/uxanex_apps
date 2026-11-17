

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api, absUrl } from "../../api/client";
import { EP } from "../../api/endpoints";

function EditorField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: "#cbd5e1", fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          backgroundColor: "#101a2b",
          borderWidth: 1,
          borderColor: "#26364e",
          borderRadius: 12,
          color: "#ffffff",
          paddingHorizontal: 14,
          paddingVertical: 13,
          minHeight: multiline ? 105 : 48,
          fontSize: 14,
        }}
      />
    </View>
  );
}

export default function MyReelEditorScreen({ navigation, route }) {
  const reel = route.params?.reel || {};

  const [caption, setCaption] = useState(reel.caption || "");
  const [hashtags, setHashtags] = useState(reel.hashtags || "");
  const [category, setCategory] = useState(reel.category || "");
  const [language, setLanguage] = useState(reel.language || "");
  const [saving, setSaving] = useState(false);

  const thumbnail = reel.thumbnail_url
    ? absUrl(reel.thumbnail_url)
    : null;

  const saveChanges = async () => {
    if (!reel.id) {
      Alert.alert("Error", "Reel ID is missing.");
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const result = await api(EP.reelUpdate(reel.id), {
        method: "PATCH",
        body: {
          caption: caption.trim(),
          hashtags: hashtags.trim(),
          category: category.trim(),
          language: language.trim(),
        },
      });

      if (result?.success === false) {
        throw new Error(result.message || "Could not update Reel.");
      }

      Alert.alert(
       "Success",
       "Your Reel has been updated.",
       [
        {
         text: "OK",
         onPress: () =>
          navigation.navigate("ProfileReelsViewer", {
           updatedReel: result.reel,
          }),
        },
       ]
      );
    } catch (error) {
      Alert.alert(
        "Update failed",
        error.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#050b18" }}>
      <View
        style={{
          height: 58,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#18263b",
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>

        <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold", marginLeft: 12 }}>
          My Reels Editor
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 35 }}
      >
        <View
          style={{
            backgroundColor: "#0c1628",
            borderWidth: 1,
            borderColor: "#20334e",
            borderRadius: 16,
            padding: 12,
            flexDirection: "row",
            marginBottom: 24,
          }}
        >
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={{
                width: 100,
                height: 130,
                borderRadius: 10,
                backgroundColor: "#101a2b",
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 100,
                height: 130,
                borderRadius: 10,
                backgroundColor: "#101a2b",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="videocam-outline" size={34} color="#1685ff" />
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 13, justifyContent: "center" }}>
            <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold" }}>
              {caption || "Your Reel"}
            </Text>

            <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 9 }}>
              Views: {reel.views_count ?? reel.view_count ?? 0}
            </Text>

            <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 5 }}>
              Likes: {reel.likes_count ?? reel.like_count ?? 0}
            </Text>

            <View
              style={{
                backgroundColor: "#123d32",
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                marginTop: 12,
              }}
            >
              <Text style={{ color: "#55e6a5", fontSize: 11, fontWeight: "bold" }}>
                {reel.status === "published" ? "Published" : reel.status || "Reel"}
              </Text>
            </View>
          </View>
        </View>

        <EditorField
          label="Caption"
          value={caption}
          onChangeText={setCaption}
          placeholder="Write your Reel caption..."
          multiline
        />

        <EditorField
          label="Hashtags"
          value={hashtags}
          onChangeText={setHashtags}
          placeholder="#UtaNexa #Reels"
          multiline
        />

        <EditorField
          label="Category"
          value={category}
          onChangeText={setCategory}
          placeholder="Enter category"
        />

        <EditorField
          label="Language"
          value={language}
          onChangeText={setLanguage}
          placeholder="Enter language"
        />

        <Pressable
          onPress={saveChanges}
          disabled={saving}
          style={{
            backgroundColor: saving ? "#315b91" : "#1677f8",
            borderRadius: 13,
            minHeight: 52,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            marginTop: 8,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={19} color="#ffffff" />
              <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold", marginLeft: 9 }}>
                Save Changes
              </Text>
            </>
          )}
        </Pressable>

        <Text
          style={{
            color: "#718096",
            fontSize: 11,
            textAlign: "center",
            marginTop: 15,
          }}
        >
          Editing metadata will not change your original video or thumbnail.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
