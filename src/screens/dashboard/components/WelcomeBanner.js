import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';
import useTranslation from '../../../hooks/useTranslation';

// Firefighter banner image — replace with a local asset when available:
// import bannerImg from '../../../../assets/banner-fire.jpg';
// and use source={bannerImg} below.
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

  return (
    <ImageBackground
      source={BANNER_IMAGE}
      style={styles.container}
      imageStyle={styles.image}
      resizeMode="cover"
    >
      {/* Black overlay at 40% opacity */}
      <View style={styles.overlay} />

      <Text style={styles.greeting}>{getGreeting(t.greeting)}</Text>
      <Text style={styles.name}>
        {title.toUpperCase()} – {name.toUpperCase()}
      </Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 110,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 14,
  },
  // 40% black over the image so text is always readable
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    borderRadius: 14,
  },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
