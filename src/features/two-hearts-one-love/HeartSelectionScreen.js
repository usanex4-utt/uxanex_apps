
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import CrystalHeart from './CrystalHeart';

const HEARTS = [
  { id: 'ruby', name: 'Ruby Love', color: '#ff1744' },
  { id: 'pink', name: 'Pink Crystal', color: '#ff69b4' },
  { id: 'blue', name: 'Ocean Love', color: '#35b6ff' },
  { id: 'purple', name: 'Purple Dream', color: '#b56cff' },
  { id: 'gold', name: 'Golden Heart', color: '#ffd700' },
  { id: 'rainbow', name: 'Rainbow Love', color: '#ff8c42' },
  { id: 'rose', name: 'Rose Crystal', color: '#ff4f81' },
  { id: 'ice', name: 'Ice Heart', color: '#9deaff' },
  { id: 'emerald', name: 'Emerald Love', color: '#36d399' },
  { id: 'diamond', name: 'Diamond Soul', color: '#d8e8ff' },
  { id: 'violet', name: 'Violet Magic', color: '#9b59ff' },
  { id: 'crimson', name: 'Crimson Passion', color: '#dc143c' },
];

export default function HeartSelectionScreen({
  onSelect,
  title = 'Choose Your Crystal Heart ❤️',
}) {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        अपने प्यार का एक खास दिल चुनें।
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {HEARTS.map((heart) => {
          const active = selected?.id === heart.id;

          return (
            <TouchableOpacity
              key={heart.id}
              style={[
                styles.heartCard,
                active && styles.selectedCard,
              ]}
              onPress={() => setSelected(heart)}
            >
              <CrystalHeart
                color={heart.color}
                size={65}
              />

              <Text style={styles.heartName}>
                {heart.name}
              </Text>

              {active && (
                <Text style={styles.check}>✓ Selected</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.sendButton,
          !selected && styles.disabled,
        ]}
        disabled={!selected}
        onPress={() => onSelect?.(selected)}
      >
        <Text style={styles.sendText}>
          Send This Heart ❤️
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d1b',
    padding: 18,
  },
  title: {
    color: '#fff',
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    color: '#ff8db5',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  heartCard: {
    width: '47%',
    backgroundColor: '#151b30',
    borderWidth: 1,
    borderColor: '#29324d',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 14,
  },
  selectedCard: {
    borderColor: '#ff69b4',
    backgroundColor: '#292039',
    borderWidth: 2,
  },
  heartName: {
    color: '#fff',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  check: {
    color: '#ff8db5',
    fontSize: 12,
    marginTop: 6,
  },
  sendButton: {
    backgroundColor: '#e84383',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabled: {
    opacity: 0.4,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
                  
