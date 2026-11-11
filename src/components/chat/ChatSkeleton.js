import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

const SkeletonBox = ({ w, h, style, animatedValue, br = 16 }) => (
  <Animated.View
    style={[
      {
        width: w,
        height: h,
        backgroundColor: "#17212c",
        borderRadius: br,
        opacity: animatedValue,
      },
      style,
    ]}
  />
);

export default function ChatSkeleton({ isCouple = false }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Couple chat me background light hota hai, isliye skeleton color adjust kiya hai
  const bgColor = isCouple ? "#E8E1E8" : "#17212c";

  return (
    <View className="flex-1 px-3.5 pt-4 gap-4">
      {/* Left Message */}
      <View className="flex-row items-end self-start max-w-[80%]">
        <SkeletonBox w={28} h={28} br={14} style={{ backgroundColor: bgColor }} animatedValue={pulse} />
        <View className="ml-2">
          <SkeletonBox w={200} h={44} br={20} style={{ backgroundColor: bgColor }} animatedValue={pulse} />
        </View>
      </View>

      {/* Right Message */}
      <View className="self-end max-w-[80%]">
        <SkeletonBox w={140} h={40} br={20} style={{ backgroundColor: bgColor }} animatedValue={pulse} />
      </View>

      {/* Left Message */}
      <View className="flex-row items-end self-start max-w-[80%]">
        <SkeletonBox w={28} h={28} br={14} style={{ backgroundColor: bgColor }} animatedValue={pulse} />
        <View className="ml-2">
          <SkeletonBox w={160} h={60} br={20} style={{ backgroundColor: bgColor }} animatedValue={pulse} />
        </View>
      </View>

      {/* Right Message */}
      <View className="self-end max-w-[80%]">
        <SkeletonBox w={220} h={50} br={20} style={{ backgroundColor: bgColor }} animatedValue={pulse} />
      </View>
      
      {/* Left Message */}
      <View className="flex-row items-end self-start max-w-[80%]">
        <SkeletonBox w={28} h={28} br={14} style={{ backgroundColor: bgColor }} animatedValue={pulse} />
        <View className="ml-2">
          <SkeletonBox w={120} h={40} br={20} style={{ backgroundColor: bgColor }} animatedValue={pulse} />
        </View>
      </View>
    </View>
  );
}