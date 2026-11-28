
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import HeartFusionController from '../../features/two-hearts-one-love/HeartFusionController';

export default function HeartFusionScreen({ navigation, route }) {
  const { user } = useAuth();

  return (
    <HeartFusionController
      partner={route.params?.partner}
      currentUserId={user?.id}
      onClose={() => navigation.goBack()}
    />
  );
}
