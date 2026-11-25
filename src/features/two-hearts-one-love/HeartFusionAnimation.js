
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
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 0.35,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 0.65,
        duration: 700,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onComplete?.();
      }
    });

    return () => animation.stop();
  }, [progress, onComplete]);

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
      {/* First partner's selected heart */}
      {/* First partner's selected heart */}
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

{/* Second partner's selected heart */}
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

      {/* Second partner's selected heart */}
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
      </Animated.View>

      {/* Fusion burst */}
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

      {/* Newly generated Surprise Crystal Heart */}
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
