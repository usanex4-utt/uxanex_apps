import React from "react";
import { Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const MenuItem = ({ icon, label, danger, onPress }) => (
  <Pressable onPress={onPress} className="h-11 flex-row items-center px-2.5 rounded-xl active:opacity-60">
    <Ionicons name={icon} size={18} color={danger ? "#ff6b6b" : "#c9d3e3"} />
    <Text className={`ml-3 text-[14px] font-medium ${danger ? "text-danger" : "text-[#e8edf5]"}`}>{label}</Text>
  </Pressable>
);