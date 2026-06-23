import React from 'react';
import SessionsScreen from '../sessions/SessionsScreen';

export default function TraineeDashboard({ navigation }) {
  // Cuando el bombero hace clic en 'Ver Resultados' en una capacitación,
  // va directamente a su vista de resultados individuales.
  const handleViewDetails = (sessionId) => {
    navigation.navigate('ResultadosBombero', { bomberoId: 'firefighter-002', bomberoName: 'Mi Perfil' });
  };

  return (
    <SessionsScreen
      navigation={navigation}
      onViewDetails={handleViewDetails}
    />
  );
}

