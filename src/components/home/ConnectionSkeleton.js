import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

const SkeletonBox = ({ w, h, style, animatedValue }) => (
  <Animated.View
    style={[
      {
        width: w,
        height: h,
        backgroundColor: "#17212c", // matches tailwind `line` color
        borderRadius: 6,
        opacity: animatedValue,
      },
      style,
    ]}
  />
);

export default function ConnectionSkeleton() {
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

  return (
    <View className="flex-row items-center mx-4 mb-3 p-3.5 rounded-3xl border border-white/8 bg-surface">
      {/* Avatar Skeleton */}
      <SkeletonBox 
        w={50} 
        h={50} 
        style={{ borderRadius: 25 }} 
        animatedValue={pulse} 
      />

      {/* Text Info Skeleton */}
      <View className="flex-1 ml-3.5">
        <SkeletonBox w="60%" h={15} animatedValue={pulse} />
        <SkeletonBox w="40%" h={11} style={{ marginTop: 8 }} animatedValue={pulse} />
      </View>

      {/* Actions Skeleton */}
      <View className="flex-row items-center">
        <SkeletonBox 
          w={40} 
          h={40} 
          style={{ borderRadius: 20, marginRight: 8 }} 
          animatedValue={pulse} 
        />
        <SkeletonBox 
          w={40} 
          h={40} 
          style={{ borderRadius: 20 }} 
          animatedValue={pulse} 
        />
      </View>
    </View>
  );
}