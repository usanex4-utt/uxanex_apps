import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CrystalHeart({ color = '#ff4d8d', size = 120 }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.heart, { color, fontSize: size }]}>
        💎
      </Text>
      <Text style={[styles.heartSymbol, { fontSize: size * 0.65 }]}>
        ❤️
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    textAlign: 'center',
  },
  heartSymbol: {
    position: 'absolute',
    textAlign: 'center',
  },
});
