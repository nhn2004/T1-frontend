import React, { useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SINTOMAS_LIST, SEVERIDAD_OPTIONS } from '../__mocks__/resultadosData';
import useTheme from '../../../hooks/useTheme';
import { MIN_TOUCH_SIZE } from '../../../constants/a11y';

export default function Step2Sintomas({ formData, updateField }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const seleccionados = formData.sintomasSeleccionados ?? [];

  function toggleSintoma(sintoma) {
    const next = seleccionados.includes(sintoma)
      ? seleccionados.filter((s) => s !== sintoma)
      : [...seleccionados, sintoma];
    updateField('sintomasSeleccionados', next);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title} accessibilityRole="header">Síntomas Reportados</Text>

      {/* Los síntomas se capturan pero el backend todavía no tiene endpoint para
          persistirlos (la tabla SymptomReport existe, sin controlador). Se avisa aquí
          para que el médico no asume que quedaron registrados. */}
      <Text style={styles.notice}>
        Los síntomas y comentarios aún no se guardan en el servidor.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} accessibilityRole="header">
          Selecciona los síntomas presentes
        </Text>
        <View style={styles.chips}>
          {SINTOMAS_LIST.map((sintoma) => {
            const selected = seleccionados.includes(sintoma);
            return (
              <TouchableOpacity
                key={sintoma}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => toggleSintoma(sintoma)}
                activeOpacity={0.7}
                accessible
                accessibilityRole="checkbox"
                accessibilityLabel={sintoma}
                accessibilityState={{ checked: selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {sintoma}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.severityBox}>
        <Text style={styles.sectionLabel} accessibilityRole="header">Nivel de Severidad</Text>
        <View style={styles.severityRow} accessibilityRole="radiogroup">
          {SEVERIDAD_OPTIONS.map((opt) => {
            const isSelected = formData.severidad === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.severityBtn, isSelected && styles.severityBtnActive]}
                onPress={() => updateField('severidad', opt)}
                activeOpacity={0.7}
                accessible
                accessibilityRole="radio"
                accessibilityLabel={`Severidad ${opt}`}
                accessibilityState={{ checked: isSelected }}
              >
                <Text style={[styles.severityText, isSelected && styles.severityTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} nativeID="comentariosLabel">
          Comentarios Adicionales
        </Text>
        <TextInput
          style={styles.textArea}
          value={formData.comentarios}
          onChangeText={(v) => updateField('comentarios', v)}
          placeholder="Describe cualquier detalle adicional sobre los síntomas…"
          placeholderTextColor={theme.textPlaceholder}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          accessibilityLabel="Comentarios adicionales"
          accessibilityLabelledBy="comentariosLabel"
        />
      </View>
    </ScrollView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 24, gap: 20, maxWidth: 720, width: '100%', alignSelf: 'center' },
    title: { fontSize: 22, fontWeight: '700', color: t.textPrimary, marginBottom: 4 },
    notice: {
      fontSize: 12, color: t.status.warning.fg,
      backgroundColor: t.status.warning.bg,
      borderWidth: 1, borderColor: t.status.warning.border,
      borderRadius: 8, padding: 10, lineHeight: 17,
    },
    section: { gap: 10 },
    sectionLabel: { fontSize: 13, fontWeight: '600', color: t.textSecondary },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.borderStrong,
      backgroundColor: t.cardAlt,
    },
    chipActive: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    chipText: { fontSize: 13, fontWeight: '500', color: t.textSecondary },
    chipTextActive: { color: t.onPrimarySolid, fontWeight: '600' },

    severityBox: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    severityRow: { flexDirection: 'row', gap: 12 },
    severityBtn: {
      flex: 1,
      minHeight: MIN_TOUCH_SIZE,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.card,
    },
    severityBtnActive: {
      backgroundColor: t.status.success.solid,
      borderColor: t.status.success.solid,
    },
    severityText: { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    severityTextActive: { color: t.status.success.onSolid },

    textArea: {
      backgroundColor: t.cardAlt,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 14,
      color: t.textPrimary,
      minHeight: 120,
    },
  });
