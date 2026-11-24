import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function HeartFusionAnimation({ onComplete }) {
  const progress = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && onComplete) onComplete();
    });
  }, []);

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1.3, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.heart, { transform: [{ scale }] }]}>
        💎❤️
      </Animated.Text>
      <Text style={styles.label}>Two Hearts, One Love</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heart: {
    fontSize: 90,
  },
  label: {
    color: '#ff8db5',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
});
