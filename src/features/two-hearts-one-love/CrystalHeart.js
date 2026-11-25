
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CrystalHeart({
  color = '#ff4d8d',
  size = 120,
  heartData = null,
}) {
  const colors = heartData?.colors || [color, '#ff80ab', '#880e4f'];
  const glow = heartData?.glow || color;
  const pattern = heartData?.pattern || 'sparkle';
  const shape = heartData?.shape || 'classic';

  const shapeSymbol = {
    classic: '❤️',
    royal: '💗',
    double: '💕',
    infinity: '💞',
    crystal: '💎',
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.glow,
          {
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: size,
            backgroundColor: glow,
            opacity: 0.25,
          },
        ]}
      />

      <Text
        style={[
          styles.diamond,
          {
            fontSize: size,
            color: colors[1] || color,
            textShadowColor: glow,
            textShadowRadius: size * 0.3,
          },
        ]}
      >
        💎
      </Text>

      <Text
        style={[
          styles.heart,
          {
            fontSize: size * 0.62,
            color: colors[0],
          },
        ]}
      >
        {shapeSymbol[shape] || '❤️'}
      </Text>

      {pattern === 'sparkle' && (
        <Text style={styles.sparkle}>✨</Text>
      )}

      {pattern === 'galaxy' && (
        <Text style={styles.pattern}>🌌</Text>
      )}

      {pattern === 'diamond' && (
        <Text style={styles.pattern}>💠</Text>
      )}

      {pattern === 'stardust' && (
        <Text style={styles.pattern}>🌟</Text>
      )}

      {pattern === 'aurora' && (
        <Text style={styles.pattern}>🌈</Text>
      )}

      {pattern === 'crystal' && (
        <Text style={styles.pattern}>🔷</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  diamond: {
    textAlign: 'center',
  },
  heart: {
    position: 'absolute',
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 25,
  },
  pattern: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: 22,
  },
});
