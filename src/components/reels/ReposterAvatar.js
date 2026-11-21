
import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { Avatar } from "../ui";

export default function ReposterAvatar({ uri, name, size = 38 }) {
  const glow = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.35,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [glow]);

  const sides = ["left", "right"];

  return (
    <View
      style={{
        width: size + 26,
        height: size + 10,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {sides.map((side) => {
        const left = side === "left";

        return (
          <View
            key={side}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 5,
              bottom: 5,
              width: 13,
              [left ? "left" : "right"]: 0,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <Animated.View
                key={i}
                style={{
                  position: "absolute",
                  top: 3 + i * 10,
                  [left ? "left" : "right"]: i % 2 ? 2 : 0,
                  width: i % 2 ? 9 : 12,
                  height: 2,
                  borderRadius: 4,
                  backgroundColor: i % 2 ? "#bfdbfe" : "#38bdf8",
                  shadowColor: "#1685ff",
                  shadowOpacity: 1,
                  shadowRadius: 6,
                  elevation: 6,
                  opacity: glow,
                  transform: [
                    { rotate: left ? "-25deg" : "25deg" },
                  ],
                }}
              />
            ))}
          </View>
        );
      })}

      <Avatar uri={uri} name={name} size={size} />
    </View>
  );
}
