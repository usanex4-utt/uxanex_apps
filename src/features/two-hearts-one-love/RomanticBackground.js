
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const BACKGROUNDS = [
  {
    name: 'Rose Rain',
    color: '#160817',
    rain: 'rgba(255, 120, 180, 0.4)',
    heart: '#ff5b9d',
    symbol: '❤️',
  },
  {
    name: 'Ocean Love',
    color: '#061321',
    rain: 'rgba(100, 190, 255, 0.4)',
    heart: '#60caff',
    symbol: '💙',
  },
  {
    name: 'Golden Night',
    color: '#171207',
    rain: 'rgba(255, 210, 100, 0.4)',
    heart: '#ffd166',
    symbol: '💛',
  },
  {
    name: 'Purple Galaxy',
    color: '#10071e',
    rain: 'rgba(190, 130, 255, 0.4)',
    heart: '#c084fc',
    symbol: '💜',
  },
  {
    name: 'Emerald Dream',
    color: '#041710',
    rain: 'rgba(100, 255, 180, 0.4)',
    heart: '#69f0ae',
    symbol: '💚',
  },
];

function FloatingHeart({ item, color, symbol }) {
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
          color,
          transform: [{ translateY: position }],
        },
      ]}
    >
      {symbol}
    </Animated.Text>
  );
}

function RainDrop({ item, color }) {
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
          backgroundColor: color,
          transform: [{ translateY: position }],
        },
      ]}
    />
  );
}

export default function RomanticBackground({
  children,
  backgroundSeed = null,
}) {
  const background = useMemo(() => {
  if (backgroundSeed === null || backgroundSeed === undefined) {
    return BACKGROUNDS[
      Math.floor(Math.random() * BACKGROUNDS.length)
    ];
  }

  const seedText = String(backgroundSeed);
  let hash = 0;

  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }

  return BACKGROUNDS[hash % BACKGROUNDS.length];
}, [backgroundSeed]);

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        left: Math.random() * width,
        delay: Math.random() * 2500,
        duration: 1800 + Math.random() * 1200,
      })),
    [backgroundSeed]
  );

  const hearts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        left: `${8 + i * 12}%`,
        delay: Math.random() * 1500,
        size: 14 + Math.random() * 12,
      })),
    [backgroundSeed]
  );

  return (
    <View style={[styles.container, { backgroundColor: background.color }]}>
      {rainDrops.map((item, index) => (
        <RainDrop
          key={`rain-${index}`}
          item={item}
          color={background.rain}
        />
      ))}

      {hearts.map((item, index) => (
        <FloatingHeart
          key={`heart-${index}`}
          item={item}
          color={background.heart}
          symbol={background.symbol}
        />
      ))}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  floatingHeart: {
    position: 'absolute',
    opacity: 0.7,
  },
  raindrop: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 24,
  },
});
