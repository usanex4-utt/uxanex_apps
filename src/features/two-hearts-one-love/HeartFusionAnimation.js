
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
  firstHeart,
  secondHeart,
  fusionStartedAt,
  serverOffset = 0,
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;

    const startedAt = new Date(fusionStartedAt).getTime();

    const elapsed = Number.isFinite(startedAt)
      ? Math.max(0, Date.now() + serverOffset - startedAt)
      : 0;

    const totalDuration = 3000;
    const remaining = Math.max(0, totalDuration - elapsed);

    progress.setValue(Math.min(elapsed / totalDuration, 1));

    if (remaining === 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    });

    return () => animation.stop();
  }, [progress, onComplete, fusionStartedAt, serverOffset]);

  const topY = progress.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [-150, 0, 0],
  });

  const bottomY = progress.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [150, 0, 0],
  });

  const sourceOpacity = progress.interpolate({
    inputRange: [0, 0.65, 0.8, 1],
    outputRange: [1, 1, 0, 0],
  });

  const burstScale = progress.interpolate({
    inputRange: [0, 0.55, 0.7, 1],
    outputRange: [0, 0, 1.8, 0],
  });

  const burstOpacity = progress.interpolate({
    inputRange: [0, 0.55, 0.7, 1],
    outputRange: [0, 0, 1, 0],
  });

  const finalOpacity = progress.interpolate({
    inputRange: [0, 0.65, 0.78, 1],
    outputRange: [0, 0, 1, 1],
  });

  const finalScale = progress.interpolate({
    inputRange: [0, 0.65, 0.82, 1],
    outputRange: [0.1, 0.1, 1.25, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.heart,
          {
            opacity: sourceOpacity,
            transform: [{ translateY: topY }],
          },
        ]}
      >
        <CrystalHeart
          color={firstHeart?.color || '#ff75ad'}
          size={105}
        />
        <Text style={styles.heartName}>
          {firstHeart?.name || 'Your Heart'}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.heart,
          {
            opacity: sourceOpacity,
            transform: [{ translateY: bottomY }],
          },
        ]}
      >
        <CrystalHeart
          color={secondHeart?.color || '#75caff'}
          size={105}
        />
        <Text style={styles.heartName}>
          {secondHeart?.name || "Partner's Heart"}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.burst,
          {
            opacity: burstOpacity,
            transform: [{ scale: burstScale }],
          },
        ]}
      >
        <Text style={styles.burstText}>✨💥✨</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.finalHeart,
          {
            opacity: finalOpacity,
            transform: [{ scale: finalScale }],
          },
        ]}
      >
        <CrystalHeart size={155} heartData={heartData} />
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
    minHeight: 430,
    padding: 20,
  },
  heart: {
    position: 'absolute',
    alignItems: 'center',
  },
  heartName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  burst: {
    position: 'absolute',
    zIndex: 2,
  },
  burstText: {
    fontSize: 45,
  },
  finalHeart: {
    position: 'absolute',
    zIndex: 3,
  },
  title: {
    color: '#ff8db5',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 245,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 10,
  },
});
