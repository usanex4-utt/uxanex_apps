import React, { useEffect, useRef } from "react";
import { View, Animated, useWindowDimensions } from "react-native";

const Box = ({ w, h, style, anim, br = 8 }) => (
  <Animated.View
    style={[
      {
        width: w,
        height: h,
        borderRadius: br,
        backgroundColor: "#1a2230",
        opacity: anim,
      },
      style,
    ]}
  />
);

/**
 * Full-screen skeleton for the Reels feed while the first page loads.
 */
export default function ReelSkeleton({ height }) {
  const { height: winH } = useWindowDimensions();
  const h = height || winH;
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.75,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ height: h }} className="bg-black">
      <View className="flex-1 bg-[#0a0e14]" />

      <View className="absolute left-3 right-20 bottom-8">
        <View className="flex-row items-center mb-3">
          <Box w={40} h={40} br={20} anim={pulse} />
          <View className="ml-2.5">
            <Box w={110} h={14} anim={pulse} style={{ marginBottom: 6 }} />
            <Box w={70} h={10} anim={pulse} />
          </View>
          <Box w={72} h={28} br={14} anim={pulse} style={{ marginLeft: 12 }} />
        </View>
        <Box w="90%" h={12} anim={pulse} style={{ marginBottom: 8 }} />
        <Box w="55%" h={12} anim={pulse} />
      </View>

      <View className="absolute right-3 bottom-10 items-center" style={{ gap: 18 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="items-center">
            <Box w={44} h={44} br={22} anim={pulse} />
            <Box w={22} h={9} anim={pulse} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      <View className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10" />
    </View>
  );
}