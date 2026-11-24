import React, { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export default function HeartbeatSound({ enabled = true }) {
  const soundRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function setupSound() {
      if (!enabled) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/heartbeat.mp3'),
          { shouldPlay: true, isLooping: true, volume: 0.5 }
        );

        if (active) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn('Heartbeat sound unavailable:', error);
      }
    }

    setupSound();

    return () => {
      active = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [enabled]);

  return null;
}
