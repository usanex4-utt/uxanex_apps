
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import heartFusionApi from './heartFusionApi';
import HeartSelectionScreen from './HeartSelectionScreen';
import TwoHeartsOneLoveScreen from './TwoHeartsOneLoveScreen';

export default function HeartFusionController({
  partner,
  currentUserId,
  onClose,
}) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const fuseRequested = useRef(false);
  const completeRequested = useRef(false);
  const mounted = useRef(true);

  const partnerId = Number(partner?.id);
  const myId = Number(currentUserId);

  const refreshSession = useCallback(async (sessionId) => {
    const response = await heartFusionApi.getSession(sessionId);

    if (mounted.current && response?.session) {
      setSession(response.session);
      setError('');
    }

    return response?.session || null;
  }, []);

  const loadActiveSession = useCallback(async () => {
    if (!partnerId || !myId) {
      setError('Partner या user ID नहीं मिली।');
      setLoading(false);
      return;
    }

    try {
      setError('');

      const active = await heartFusionApi.active(partnerId);

      if (active?.session_id) {
        await refreshSession(active.session_id);
      } else if (mounted.current) {
        setSession(null);
      }
    } catch (e) {
      if (mounted.current) {
        setError(e.message || 'Session load नहीं हुआ।');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [partnerId, myId, refreshSession]);

  useEffect(() => {
    mounted.current = true;
    loadActiveSession();

    return () => {
      mounted.current = false;
    };
  }, [loadActiveSession]);

  // Waiting session में दोनों phones को latest state मिलती रहेगी।
  useEffect(() => {
    if (!session?.id || session.status === 'completed') return;

    const timer = setInterval(() => {
      refreshSession(session.id).catch(() => {});
    }, 2000);

    return () => clearInterval(timer);
  }, [session?.id, session?.status, refreshSession]);

  // Countdown display और server-authoritative fusion request.
  useEffect(() => {
    if (session?.status !== 'countdown') {
      fuseRequested.current = false;
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, [session?.status]);

  const countdownStartedAt = session?.countdown_started_at
    ? new Date(session.countdown_started_at).getTime()
    : null;

  const elapsedSeconds = countdownStartedAt
    ? Math.max(0, (now - countdownStartedAt) / 1000)
    : 0;

  const countdown = Math.max(
    1,
    3 - Math.floor(elapsedSeconds)
  );

  useEffect(() => {
    if (
      session?.status !== 'countdown' ||
      !countdownStartedAt ||
      elapsedSeconds < 3 ||
      fuseRequested.current
    ) {
      return;
    }

    fuseRequested.current = true;

    heartFusionApi.fuse(session.id)
      .then(() => refreshSession(session.id))
      .catch((e) => {
        // Server countdown पूरा न होने पर थोड़ी देर बाद retry.
        if (e.status === 409) {
          fuseRequested.current = false;
          return;
        }

        if (mounted.current) {
          setError(e.message || 'Heart fusion नहीं हो पाया।');
        }
        fuseRequested.current = false;
      });
  }, [
    session?.id,
    session?.status,
    countdownStartedAt,
    elapsedSeconds,
    refreshSession,
  ]);

  const handleCreate = async (firstHeart) => {
    try {
      setBusy(true);
      setError('');

      const response = await heartFusionApi.create(
        partnerId,
        firstHeart
      );

      const sessionId = response?.session?.id;

      if (!sessionId) {
        throw new Error('Session ID नहीं मिली।');
      }

      await refreshSession(sessionId);
    } catch (e) {
      setError(e.message || 'Heart भेजने में समस्या हुई।');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitSecondHeart = async (secondHeart) => {
    try {
      setBusy(true);
      setError('');

      await heartFusionApi.submitHeart(session.id, secondHeart);
      await refreshSession(session.id);
    } catch (e) {
      setError(e.message || 'Partner को Heart नहीं भेज पाया।');
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    try {
      setBusy(true);
      setError('');

      await heartFusionApi.start(session.id);
      await refreshSession(session.id);
    } catch (e) {
      setError(e.message || 'Start नहीं हो पाया।');
    } finally {
      setBusy(false);
    }
  };

  const handleFusionComplete = useCallback(async () => {
  if (completeRequested.current || !session?.id) return;

  completeRequested.current = true;

  try {
    await heartFusionApi.complete(session.id);
    await refreshSession(session.id);
  } catch (e) {
    completeRequested.current = false;
    setError(e.message || 'Fusion completion save नहीं हुआ।');
  }
}, [session?.id, refreshSession]);

  const handleRating = async (rating) => {
    try {
      setBusy(true);
      setError('');

      await heartFusionApi.submitRating(session.id, rating);
      await refreshSession(session.id);
    } catch (e) {
      setError(e.message || 'Rating submit नहीं हुई।');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff69b4" />
        <Text style={styles.text}>Love session loading...</Text>
      </View>
    );
  }

  if (error && !session) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.text} onPress={loadActiveSession}>
          Tap to Retry
        </Text>
      </View>
    );
  }

  // अभी कोई active session नहीं है: पहला Heart चुनें।
  if (!session) {
    return (
      <View style={{ flex: 1 }}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <HeartSelectionScreen
          title="Choose Your First Crystal Heart ❤️"
          onSelect={handleCreate}
        />
        {busy ? <ActivityIndicator color="#ff69b4" /> : null}
      </View>
    );
  }

  const isUserOne = myId === Number(session.user_one_id);

  const myStarted = isUserOne
    ? session.user_one_started
    : session.user_two_started;

  const partnerStarted = isUserOne
    ? session.user_two_started
    : session.user_one_started;

  const myFusionCompleted = isUserOne
    ? session.user_one_fusion_completed
    : session.user_two_fusion_completed;

  const myRating = isUserOne
    ? session.user_one_rating
    : session.user_two_rating;

  // Partner ने अभी दूसरा Heart नहीं भेजा है।
  if (!session.second_heart) {
    if (myId !== Number(session.created_by_user_id)) {
      return (
        <View style={{ flex: 1 }}>
          <HeartSelectionScreen
            title="Choose Your Crystal Heart ❤️"
            onSelect={handleSubmitSecondHeart}
          />
          {busy ? <ActivityIndicator color="#ff69b4" /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.title}>Two Hearts, One Love ❤️</Text>
        <Text style={styles.text}>
          आपका Heart भेज दिया गया है।
        </Text>
        <Text style={styles.text}>
          अब Partner के Heart का इंतज़ार करें...
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (session.status === 'fusing' && myFusionCompleted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Two Hearts, One Love ❤️</Text>
        <Text style={styles.text}>
          आपका Surprise Crystal Heart तैयार है।
        </Text>
        <Text style={styles.text}>
          Partner की animation पूरी होने का इंतज़ार करें...
        </Text>
      </View>
    );
  }

  if (session.status === 'rating' && myRating !== null) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Rating Submitted ⭐</Text>
        <Text style={styles.text}>
          आपकी Rating save हो गई है।
        </Text>
        <Text style={styles.text}>
          Partner की Rating का इंतज़ार करें...
        </Text>
      </View>
    );
  }

  const phase =
    session.status === 'countdown' ? 'countdown' :
    session.status === 'fusing' ? 'fusion' :
    session.status === 'rating' ? 'rating' :
    session.status === 'completed' ? 'completed' :
    'waiting';

  return (
    <View style={{ flex: 1 }}>
      <TwoHeartsOneLoveScreen
        phase={phase}
        myStarted={myStarted}
        partnerStarted={partnerStarted}
        countdown={countdown}
        onStart={handleStart}
        onRatingSubmit={handleRating}
        heartData={session.surprise_heart}
        fusionSeed={session.fusion_seed}
        backgroundSeed={session.background_seed}
        firstHeart={session.first_heart}
        secondHeart={session.second_heart}
        onFusionComplete={handleFusionComplete}
      />

      {busy ? (
        <ActivityIndicator
          style={styles.loader}
          color="#ff69b4"
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {session.status === 'completed' && onClose ? (
        <Text style={styles.close} onPress={onClose}>
          वापस Couple Chat में जाएँ
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#090d1b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  text: {
    color: '#d9dff0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    padding: 10,
  },
  loader: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  close: {
    color: '#ff8db5',
    textAlign: 'center',
    padding: 14,
    fontWeight: 'bold',
  },
});
