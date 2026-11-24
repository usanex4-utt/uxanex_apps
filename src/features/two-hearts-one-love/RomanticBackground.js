
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HEARTS = [
  { left: '8%', delay: 0, size: 18 },
  { left: '25%', delay: 900, size: 14 },
  { left: '45%', delay: 400, size: 22 },
  { left: '65%', delay: 1300, size: 16 },
  { left: '85%', delay: 600, size: 20 },
];

const RAINDROPS = Array.from({ length: 35 }, (_, i) => ({
  left: Math.random() * width,
  delay: Math.random() * 2500,
  duration: 1800 + Math.random() * 1200,
}));

function FloatingHeart({ item }) {
  const position = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(item.delay),
        Animated.timing(position, {
          toValue: -100,
          duration: 6500,
          useNativeDriver: true,
        }),
        Animated.timing(position, {
          toValue: height,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingHeart,
        {
          left: item.left,
          fontSize: item.size,
          transform: [{ translateY: position }],
        },
      ]}
    >
      ❤️
    </Animated.Text>
  );
}

function RainDrop({ item }) {
  const position = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(item.delay),
        Animated.timing(position, {
          toValue: height + 30,
          duration: item.duration,
          useNativeDriver: true,
        }),
        Animated.timing(position, {
          toValue: -30,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.raindrop,
        {
          left: item.left,
          transform: [{ translateY: position }],
        },
      ]}
    />
  );
}

export default function RomanticBackground({ children }) {
  return (
    <View style={styles.container}>
      {RAINDROPS.map((item, index) => (
        <RainDrop key={`rain-${index}`} item={item} />
      ))}

      {HEARTS.map((item, index) => (
        <FloatingHeart key={`heart-${index}`} item={item} />
      ))}

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050611',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  floatingHeart: {
    position: 'absolute',
    color: '#ff5b9d',
    opacity: 0.65,
  },
  raindrop: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 24,
    backgroundColor: 'rgba(160, 195, 255, 0.35)',
  },
});
          
