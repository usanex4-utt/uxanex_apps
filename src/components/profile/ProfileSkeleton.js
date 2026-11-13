import React, { useEffect, useRef } from "react";
import { View, Animated, useWindowDimensions } from "react-native";

const Box = ({ w, h, r = 8, style, anim }) => (
  <Animated.View
    style={[
      {
        width: w,
        height: h,
        borderRadius: r,
        backgroundColor: "#151c28",
        opacity: anim,
      },
      style,
    ]}
  />
);

const TILE_RATIO = 1.33;
const GRID_COLS = 3;
const TILE_GAP = 2;

/**
 * Full profile loading skeleton — hero + stats + 3-col reel grid
 * (matches Search explore grid proportions).
 */
export default function ProfileSkeleton() {
  const { width } = useWindowDimensions();
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

  const tileW = Math.floor(width / GRID_COLS);
  const tileH = Math.floor(tileW * TILE_RATIO);

  return (
    <View className="flex-1">
      {/* Hero */}
      <View className="items-center pt-4 pb-3 px-4">
        <Box w={96} h={96} r={48} anim={pulse} />
        <Box w={140} h={18} r={6} anim={pulse} style={{ marginTop: 14 }} />
        <Box w={90} h={12} r={5} anim={pulse} style={{ marginTop: 8 }} />
        <Box w={200} h={12} r={5} anim={pulse} style={{ marginTop: 14 }} />
        <Box w={160} h={12} r={5} anim={pulse} style={{ marginTop: 6 }} />

        <View className="flex-row mt-4" style={{ gap: 10 }}>
          <Box w={120} h={40} r={20} anim={pulse} />
          <Box w={120} h={40} r={20} anim={pulse} />
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row justify-around mx-4 mt-3 mb-2 py-3 rounded-2xl bg-[#0a1424] border border-white/8">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className="items-center">
            <Box w={36} h={16} r={4} anim={pulse} />
            <Box w={48} h={10} r={4} anim={pulse} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View className="mx-4 mt-4 flex-row p-1 rounded-full bg-[#0a1424] border border-white/10">
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            w={null}
            h={36}
            r={18}
            anim={pulse}
            style={{ flex: 1, marginHorizontal: 3 }}
          />
        ))}
      </View>

      {/* 3-col grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <View
            key={i}
            style={{ width: tileW, height: tileH, padding: TILE_GAP / 2 }}
          >
            <Animated.View
              style={{
                flex: 1,
                backgroundColor: "#151c28",
                borderRadius: 2,
                opacity: pulse,
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}