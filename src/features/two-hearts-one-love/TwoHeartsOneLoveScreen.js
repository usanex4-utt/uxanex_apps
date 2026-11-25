import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import CrystalHeart from './CrystalHeart';
import HeartFusionAnimation from './HeartFusionAnimation';
import RatingScreen from './RatingScreen';
import generateSurpriseHeart from './SurpriseHeartGenerator';

export default function TwoHeartsOneLoveScreen({
  phase = 'waiting',
  myStarted = false,
  partnerStarted = false,
  countdown = null,
  onStart,
  onRatingSubmit,
  heartData = null,
  fusionSeed = null,
  firstHeart,
  secondHeart,
  onFusionComplete,
}) {
  const [muted, setMuted] = useState(false);
  const generatedHeart = useMemo(() => {
  if (phase !== 'fusion') return null;

  return heartData || generateSurpriseHeart({
    fusionSeed: 'demo-fusion-001',
    firstHeart: 'Ruby Love',
    secondHeart: 'Ocean Love',
  });
}, [phase, heartData]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Two Hearts, One Love</Text>
      <Text style={styles.subtitle}>
        दो दिल, एक नया एहसास ❤️
      </Text>

      {phase !== 'rating' && phase !== 'completed' && (
        <>
          <View style={styles.hearts}>
            <View style={styles.heartBox}>
              <CrystalHeart color="#ff75ad" size={100} />
              <Text style={styles.name}>Your Heart</Text>
            </View>

            <Text style={styles.plus}>+</Text>

            <View style={styles.heartBox}>
              <CrystalHeart color="#75caff" size={100} />
              <Text style={styles.name}>Partner's Heart</Text>
            </View>
          </View>

          {phase === 'waiting' && (
            <>
              <Text style={styles.message}>
                जब दोनों तैयार हों, तभी शुरुआत होगी।
              </Text>

              <Text style={styles.status}>
                आपकी तैयारी: {myStarted ? 'Ready ✓' : 'Pending'}
              </Text>
              <Text style={styles.status}>
                Partner: {partnerStarted ? 'Ready ✓' : 'Waiting'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.button,
                  myStarted && styles.disabled,
                ]}
                disabled={myStarted}
                onPress={onStart}
              >
                <Text style={styles.buttonText}>
                  {myStarted ? 'You are Ready ✓' : 'Start ❤️'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'countdown' && (
            <Text style={styles.countdown}>
              {countdown ?? '3'}
            </Text>
          )}

          {phase === 'fusion' && (
           <HeartFusionAnimation
            heartData={generatedHeart}
            onComplete={onFusionComplete}
           />
          )}
        </>
      )}

      {phase === 'rating' && (
        <RatingScreen onSubmit={onRatingSubmit} />
      )}

      {phase === 'completed' && (
        <Text style={styles.message}>
          अब आगे बातें करो ❤️
        </Text>
      )}

      <TouchableOpacity
        style={styles.soundButton}
        onPress={() => setMuted(!muted)}
      >
        <Text style={styles.soundText}>
          {muted ? '🔇 Sound Off' : '🔊 Sound On'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d1b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#ff8db5',
    fontSize: 16,
    marginTop: 8,
  },
  hearts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 35,
  },
  heartBox: {
    alignItems: 'center',
  },
  name: {
    color: '#ffffff',
    marginTop: 10,
  },
  plus: {
    color: '#ffffff',
    fontSize: 30,
    marginHorizontal: 12,
  },
  message: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  status: {
    color: '#c8d2ee',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#e84383',
    paddingVertical: 14,
    paddingHorizontal: 45,
    borderRadius: 30,
    marginTop: 25,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  countdown: {
    color: '#ff75ad',
    fontSize: 75,
    fontWeight: 'bold',
  },
  soundButton: {
    marginTop: 30,
    padding: 10,
  },
  soundText: {
    color: '#c8d2ee',
  },
});
