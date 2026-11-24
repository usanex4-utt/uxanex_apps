
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CrystalHeart({
  color = '#ff4d8d',
  size = 120,
  heartData = null,
}) {
  const colors = heartData?.colors || [color, '#ff80ab', '#880e4f'];
  const glow = heartData?.glow || color;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.glow,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: size,
            backgroundColor: glow,
            opacity: 0.22,
          },
        ]}
      />

      <Text
        style={[
          styles.heart,
          {
            fontSize: size,
            textShadowColor: glow,
            textShadowRadius: size * 0.22,
          },
        ]}
      >
        💎
      </Text>

      <Text
        style={[
          styles.heartSymbol,
          {
            fontSize: size * 0.58,
            color: colors[0],
          },
        ]}
      >
        ❤️
      </Text>

      {heartData?.pattern === 'sparkle' && (
        <Text style={[styles.sparkle, { fontSize: size * 0.25 }]}>
          ✨
        </Text>
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
  heart: {
    textAlign: 'center',
  },
  heartSymbol: {
    position: 'absolute',
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
