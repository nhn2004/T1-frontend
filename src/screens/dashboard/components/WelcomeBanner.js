import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import useTranslation from '../../../hooks/useTranslation';
import { a11yDecorative } from '../../../constants/a11y';

const BANNER_IMAGE = {
  uri: 'https://images.unsplash.com/photo-1578736641330-3155e606cd40?w=900&q=80',
};

function getGreeting(greetings) {
  const hour = new Date().getHours();
  if (hour < 12) return greetings.morning;
  if (hour < 18) return greetings.afternoon;
  return greetings.evening;
}

export default function WelcomeBanner({ name, title }) {
  const { t } = useTranslation();

  const greeting = getGreeting(t.greeting);
  const who = [title, name].filter(Boolean).join(' – ');

  return (
    <ImageBackground
      source={BANNER_IMAGE}
      style={styles.container}
      imageStyle={styles.image}
      resizeMode="cover"
      // La imagen es decorativa; el contenido informativo es el texto de encima.
      accessible={false}
      accessibilityRole="none"
    >
      {/* Velo oscuro: garantiza contraste del texto blanco sobre cualquier foto.
          Por eso los colores de este bloque son fijos y no dependen del tema. */}
      <View style={styles.overlay} {...a11yDecorative} />

      <Text style={styles.greeting} accessibilityRole="header">{greeting}</Text>
      <Text style={styles.name}>{who.toUpperCase()}</Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 110,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  image: { borderRadius: 14 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 14,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
