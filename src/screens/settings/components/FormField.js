import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import useTheme from '../../../hooks/useTheme';

// Etiqueta + campo de texto — usado por la tarjeta Perfil de Usuario.
// `editable={false}` produce el aspecto atenuado de solo lectura (Rol, ID de Bombero).

export default function FormField({
  label, value, onChangeText, editable = true, keyboardType, autoComplete,
  secureTextEntry = false, textContentType,
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.field}>
      <Text style={styles.label} nativeID={`field-${label}`}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        placeholderTextColor={theme.textPlaceholder}
        autoCapitalize="none"
        accessibilityLabel={label}
        accessibilityLabelledBy={`field-${label}`}
        // Un campo de solo lectura debe anunciarse como tal: si no, el lector
        // invita a editarlo y el usuario no entiende por qué no responde.
        accessibilityState={{ disabled: !editable }}
      />
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    field: { flex: 1, gap: 6 },
    label: { fontSize: 13, color: t.textSecondary },
    input: {
      borderWidth: 1.5,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 14,
      backgroundColor: t.cardAlt,
      borderColor: t.borderStrong,
      color: t.textPrimary,
    },
    inputDisabled: { opacity: 0.6 },
  });
