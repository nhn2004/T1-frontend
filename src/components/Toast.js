import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { a11yDecorative, a11yLiveRegion } from '../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

// Banner de feedback embebido. Alert.alert() es un no-op en web (react-native-web
// entrega un stub vacío), así que cualquier mensaje que deba verse en todas las
// plataformas se renderiza a través de este componente.

const ICONS = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

// Mapea el tono a la paleta semántica del tema (ver useTheme.status).
const TONE_TO_STATUS = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

export default function Toast({ message, tone = 'success' }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (!message) return null;

  const status = theme.status[TONE_TO_STATUS[tone] ?? 'success'];
  const iconName = ICONS[tone] ?? ICONS.success;

  return (
    <View
      style={[styles.toast, { backgroundColor: status.bg, borderColor: status.border }]}
      // Los errores interrumpen al lector de pantalla; el resto se anuncia al terminar
      // la locución en curso, para no cortar lo que el usuario esté escuchando.
      {...a11yLiveRegion(tone === 'error' ? 'assertive' : 'polite')}
      accessible
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLabel={message}
    >
      <Ionicons name={iconName} size={18} color={status.fg} {...a11yDecorative} />
      <Text style={[styles.text, { color: status.fg }]}>{message}</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    text: {
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.semibold,
      flex: 1,
    },
  });
