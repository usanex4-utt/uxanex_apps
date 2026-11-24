import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RatingScreen({ onSubmit }) {
  const [rating, setRating] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>हमारे प्यार को Rating दो ❤️</Text>

      <View style={styles.stars}>
        {[1, 2, 3].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
          >
            <Text style={styles.star}>
              {rating >= star ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !rating && styles.disabled]}
        disabled={!rating}
        onPress={() => onSubmit?.(rating)}
      >
        <Text style={styles.buttonText}>Submit Rating</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stars: {
    flexDirection: 'row',
    marginVertical: 24,
  },
  star: {
    fontSize: 42,
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: '#e84383',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
