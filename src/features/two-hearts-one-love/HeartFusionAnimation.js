
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

import CrystalHeart from './CrystalHeart';

export default function HeartFusionAnimation({
  onComplete,
  heartData,
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 0.5,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && onComplete) {
        onComplete();
      }
    });

    return () => animation.stop();
  }, [progress, onComplete]);

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: [0.3, 1.35, 0.85, 1.15],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 1],
  });

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity,
          transform: [{ scale }, { rotate }],
        }}
      >
        <CrystalHeart
          size={150}
          heartData={heartData}
        />
      </Animated.View>

      <Text style={styles.title}>Two Hearts, One Love</Text>

      <Text style={styles.subtitle}>
        A new love story is born ❤️
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#ff8db5',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 10,
  },
});
