import React, { useEffect, useRef } from "react";
import { View, Animated, ScrollView } from "react-native";

const SkeletonBox = ({ w, h, style, animatedValue, br = 6 }) => (
  <Animated.View
    style={[
      {
        width: w,
        height: h,
        backgroundColor: "#17212c", // matches tailwind `line`
        borderRadius: br,
        opacity: animatedValue,
      },
      style,
    ]}
  />
);

export default function MomentSkeleton() {
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
    <View className="py-2">
      {/* Header Skeleton */}
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View className="flex-row items-center">
          <SkeletonBox w={13} h={13} br={6.5} animatedValue={pulse} />
          <SkeletonBox w={60} h={13} style={{ marginLeft: 8 }} animatedValue={pulse} />
        </View>
        <SkeletonBox w={20} h={11} animatedValue={pulse} />
      </View>

      {/* Ring List Skeleton */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        scrollEnabled={false} // Scroll disable rakha hai taaki user skeleton pe swipe na kare
      >
        {[...Array(5)].map((_, i) => (
          <View key={i} className="items-center">
            {/* Ring + Avatar */}
            <View style={{ width: 74, height: 74 }} className="items-center justify-center">
              <SkeletonBox
                w={70}
                h={70}
                br={35}
                animatedValue={pulse}
              />
            </View>
            {/* Username text below */}
            <SkeletonBox
              w={40}
              h={11}
              style={{ marginTop: 8 }}
              animatedValue={pulse}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}