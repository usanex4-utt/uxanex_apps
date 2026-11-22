import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui";

const REPORT_REASONS = [
  "Spam", "Nudity", "Violence", "Hate or harassment", "False information", "Other",
];

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
};
const timeAgo = (value) => {
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return "";

  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;

  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const SheetHandle = () => (
  <View className="items-center pt-2.5 pb-1">
    <View className="w-10 h-1 rounded-full bg-white/20" />
  </View>
);
const MenuRow = ({ icon, label, onPress, danger, chevron }) => {
  const isDelete = icon === "trash-outline";

  return (
    <Pressable onPress={onPress} className="flex-row items-center h-14 active:opacity-60">
      <View className={`w-9 h-9 rounded-xl items-center justify-center ${isDelete ? "" : danger ? "bg-red-500/15" : "bg-white/8"}`}>
        <Ionicons name={icon} size={18} color={isDelete ? "#ffffff" : danger ? "#ff6b6b" : "#dbe4f3"} />
      </View>
      <Text className={`flex-1 ml-3 text-[15px] font-medium ${isDelete ? "text-white" : danger ? "text-danger" : "text-ink"}`}>
        {label}
      </Text>
      {chevron && <Ionicons name="chevron-forward" size={16} color="#5d6a80" />}
    </Pressable>
  );
};

export const ReelCommentsSheet = ({
  visible, sheet, openUser, likeComment, setReplyTo, replyTo, onClose, comments, cLoading, draft, setDraft,
  sendComment, deleteComment, user,
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
      <Pressable className="h-[72%] bg-[#0b1220] rounded-t-[28px] border-t border-white/10" onPress={() => {}}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          <SheetHandle />
          <View className="h-11 flex-row items-center justify-center border-b border-white/10">
            <Text className="text-white font-bold text-[15px]">Comments</Text>
            {sheet?.reel?.comment_count ? (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-white/10">
                <Text className="text-[#cfd8e6] text-[11px] font-semibold">
                  {fmt(sheet.reel.comment_count)}
                </Text>
              </View>
            ) : null}
          </View>
            
{cLoading ? (
  <ActivityIndicator color="#247cff" className="mt-8" />
) : (
  <FlatList
    data={comments.filter((c) => !c.parent_comment_id)}
    keyExtractor={(c) => String(c.id)}
    keyboardShouldPersistTaps="handled"
    contentContainerClassName="px-4 py-4 gap-4"
    ListEmptyComponent={
      <View className="items-center pt-10">
        <Ionicons name="chatbubbles-outline" size={34} color="#5d6a80" />
        <Text className="text-[#9aa7bb] text-[13px] mt-3">
          No comments yet. Start the conversation.
        </Text>
      </View>
    }
    renderItem={({ item: c }) => (
      <View className="flex-row items-start">
        <Pressable onPress={() => openUser?.(c.user?.user_id)}>
          <Avatar
            uri={c.user?.profile_photo}
            name={c.user?.name || c.user?.username}
            size={36}
          />
        </Pressable>

        <View className="flex-1 ml-3">
          <View className="self-start max-w-full bg-[#121b2e] rounded-2xl rounded-tl-md px-3.5 py-2.5">
            <View className="flex-row items-center gap-2 mb-0.5">
  <Pressable onPress={() => openUser?.(c.user?.user_id)}>
    <Text className="text-[#8fb4ff] text-[12px] font-semibold">
      @{c.user?.username}
    </Text>
  </Pressable>

  <Text className="text-[#71809a] text-[11px]">
    {timeAgo(c.created_at)}
  </Text>
</View>

            <Text className="text-white text-[14px] leading-5">
              {c.content}
            </Text>

            <View className="flex-row items-center mt-2 gap-4">
              <Pressable onPress={() => likeComment?.(c)}>
                <Text className="text-[#9aa7bb] text-[12px] font-semibold">
                  {c.liked ? "♥ Liked" : "♡ Like"} · {fmt(c.likes_count)}
                </Text>
              </Pressable>

              <Pressable onPress={() => setReplyTo?.(c)}>
                <Text className="text-[#8fb4ff] text-[12px] font-semibold">
                  Reply
                </Text>
              </Pressable>
            </View>
          </View>

                  {comments
  .filter((reply) => String(reply.parent_comment_id) === String(c.id))
  .map((reply) => (
    <View key={reply.id} className="flex-row items-start mt-3 ml-2">
      <Pressable onPress={() => openUser?.(reply.user?.user_id)}>
        <Avatar
          uri={reply.user?.profile_photo}
          name={reply.user?.name || reply.user?.username}
          size={28}
        />
      </Pressable>

      <View className="flex-1 ml-2">
        <View className="bg-[#121b2e] rounded-xl px-3 py-2">
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => openUser?.(reply.user?.user_id)}>
              <Text className="text-[#8fb4ff] text-[12px] font-semibold">
                @{reply.user?.username}
              </Text>
            </Pressable>
            <Text className="text-[#71809a] text-[11px]">
              {timeAgo(reply.created_at)}
            </Text>
          </View>

          <Text className="text-white text-[13px] leading-5">
            {reply.content}
          </Text>

          <Pressable
            onPress={() => likeComment?.(reply)}
            className="mt-2 self-start"
          >
            <Text className="text-[#9aa7bb] text-[12px]">
              {reply.liked ? "♥ Liked" : "♡ Like"} · {fmt(reply.likes_count)}
            </Text>
          </Pressable>
              <Pressable
  onPress={() => setReplyTo?.(c)}
  className="mt-2 ml-3 self-start"
>
  <Text className="text-[#8fb4ff] text-[12px] font-semibold">
    Reply
  </Text>
</Pressable>
        </View>
      </View>

      {reply.user_id === user?.id && (
        <Pressable onPress={() => deleteComment(reply)} hitSlop={10}>
          <Ionicons name="trash-outline" size={16} color="#7f8b9b" />
        </Pressable>
      )}
    </View>
  ))}
        </View>

         {c.user_id === user?.id && (
          <Pressable
            onPress={() => deleteComment(c)}
            hitSlop={10}
            className="ml-2 mt-2 active:opacity-60"
          >
            <Ionicons name="trash-outline" size={17} color="#7f8b9b" />
          </Pressable>
        )}
      </View>
    )}
  />
)}
{replyTo && (
  <View className="flex-row items-center justify-between px-4 py-2 bg-[#121b2e]">
    <View className="flex-row items-center gap-2">
      <Avatar
        uri={replyTo.user?.profile_photo}
        name={replyTo.user?.name || replyTo.user?.username}
        size={30}
      />
      <Text className="text-[#8fb4ff] text-[12px]">
        Replying to @{replyTo.user?.username}
      </Text>
    </View>

    <Pressable onPress={() => setReplyTo(null)}>
      <Ionicons name="close" size={18} color="#9aa7bb" />
    </Pressable>
  </View>
)}

            
            

          

          <View className="flex-row items-center gap-2.5 px-3.5 pt-2.5 pb-6 border-t border-white/10 bg-[#0b1220]">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              maxLength={2000}
              placeholder="Add a comment…"
              placeholderTextColor="#71809a"
              className="flex-1 h-11 px-4 rounded-full bg-[#121b2e] border border-white/10 text-white text-[14px]"
              onSubmitEditing={sendComment}
              returnKeyType="send"
            />
            <Pressable
              onPress={sendComment}
              disabled={!draft.trim()}
              className={`w-11 h-11 rounded-full items-center justify-center ${
                draft.trim() ? "bg-brand active:opacity-80" : "bg-white/10"
              }`}
            >
              <Ionicons name="arrow-up" size={20} color={draft.trim() ? "#fff" : "#5d6a80"} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Pressable>
  </Modal>
);

export const ReelMenuSheet = ({
  visible, sheet, setSheet, onClose, notInterested, report, remove, download, user,
}) => {
  const reel = sheet?.reel;
  const isOwner = reel?.user_id === user?.id;
  const canDownload = typeof download === "function";
  const canReport = typeof report === "function";
  const canRemove = typeof remove === "function";
  const canNotInterested = typeof notInterested === "function";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-[#0b1220] rounded-t-[28px] border-t border-white/10 px-5 pb-9" onPress={() => {}}>
          <SheetHandle />

          {sheet?.type === "report" ? (
            <>
              <View className="flex-row items-center pt-3 pb-2">
                <Pressable
                  onPress={() => setSheet({ type: "menu", reel: sheet.reel })}
                  hitSlop={10}
                  className="mr-3 active:opacity-60"
                >
                  <Ionicons name="chevron-back" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-[17px] font-bold">Why are you reporting this?</Text>
              </View>
              <Text className="text-[#9aa7bb] text-[12px] mb-2">Your report is anonymous.</Text>
              {REPORT_REASONS.map((r) => (
                <MenuRow
                  key={r}
                  icon="flag-outline"
                  label={r}
                  chevron
                  onPress={() => report?.(sheet.reel, r)}
                />
              ))}
            </>
          ) : (
            <>
              <View className="pt-2">
                {canDownload && (
                  <MenuRow
                    icon="download-outline"
                    label="Download"
                    onPress={() => {
                      onClose?.();
                      download(reel);
                    }}
                  />
                )}

                {isOwner ? (
                  canRemove && (
                    <MenuRow
                      icon="trash-outline"
                      label="Delete reel"
                      danger
                      onPress={() => {
                        onClose?.();
                        remove(reel);
                      }}
                    />
                  )
                ) : (
                  <>
                    {canNotInterested && (
                      <MenuRow
                        icon="eye-off-outline"
                        label="Not interested"
                        onPress={() => {
                          onClose?.();
                          notInterested(reel);
                        }}
                      />
                    )}
                    {canReport && (
                      <MenuRow
                        icon="flag-outline"
                        label="Report"
                        danger
                        onPress={() => setSheet({ type: "report", reel })}
                      />
                    )}
                  </>
                )}
              </View>

              <Pressable
                onPress={onClose}
                className="h-12 mt-3 rounded-2xl bg-white/8 items-center justify-center active:opacity-70"
              >
                <Text className="text-white text-[15px] font-semibold">Cancel</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
