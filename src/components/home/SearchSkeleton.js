import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

const SkeletonBox = ({ w, h, style, animatedValue }) => (
  <Animated.View
    style={[
      {
        width: w,
        height: h,
        backgroundColor: "#17212c", // matches tailwind `line`
        borderRadius: 6,
        opacity: animatedValue,
      },
      style,
    ]}
  />
);

export default function SearchSkeleton() {
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
    <View className="mb-3.5 rounded-[26px] bg-[#04070b] pb-1.5 shadow-xl shadow-black/80">
      <View className="flex-row items-center p-3.5 rounded-[26px] bg-[#0f1621] border border-white/6 border-t-white/15">
        
        {/* Avatar Skeleton */}
        <SkeletonBox 
          w={50} 
          h={50} 
          style={{ borderRadius: 25 }} 
          animatedValue={pulse} 
        />

        {/* Text Skeleton */}
        <View className="flex-1 mx-3.5">
          <SkeletonBox w="65%" h={15} animatedValue={pulse} />
          <SkeletonBox w="45%" h={11} style={{ marginTop: 8 }} animatedValue={pulse} />
        </View>

        {/* Action Button Skeleton */}
        <SkeletonBox 
          w={90} 
          h={36} 
          style={{ borderRadius: 16 }} 
          animatedValue={pulse} 
        />
      </View>
    </View>
  );
}