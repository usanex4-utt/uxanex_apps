
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

const TILE_GAP = 2;
const SKELETON_COUNT = 12;
const GRID_COLS = 3;

export default function ReelGridSkeleton({ tileWidth, tileHeight }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        paddingTop: 10,
      }}
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <View
          key={index}
          style={{
            width: tileWidth,
            height: tileHeight,
            padding: TILE_GAP / 2,
          }}
        >
          <Animated.View
            style={{
              flex: 1,
              width: "100%",
              backgroundColor: "#151c28",
              borderRadius: 4,
              opacity,
            }}
          />
        </View>
      ))}
    </View>
  );
}
