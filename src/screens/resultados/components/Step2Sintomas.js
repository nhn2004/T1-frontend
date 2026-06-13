import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SINTOMAS_LIST, SEVERIDAD_OPTIONS } from '../__mocks__/resultadosData';

export default function Step2Sintomas({ formData, updateField }) {
  function toggleSintoma(sintoma) {
    const prev = formData.sintomasSeleccionados;
    const next = prev.includes(sintoma)
      ? prev.filter(s => s !== sintoma)
      : [...prev, sintoma];
    updateField('sintomasSeleccionados', next);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Síntomas Reportados</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Selecciona los síntomas presentes</Text>
        <View style={styles.chips}>
          {SINTOMAS_LIST.map(sintoma => {
            const selected = formData.sintomasSeleccionados.includes(sintoma);
            return (
              <TouchableOpacity
                key={sintoma}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => toggleSintoma(sintoma)}
                activeOpacity={0.7}
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
        <Text style={styles.sectionLabel}>Nivel de Severidad</Text>
        <View style={styles.severityRow}>
          {SEVERIDAD_OPTIONS.map(opt => {
            const isSelected = formData.severidad === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.severityBtn, isSelected && styles.severityBtnActive]}
                onPress={() => updateField('severidad', opt)}
                activeOpacity={0.7}
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
        <Text style={styles.sectionLabel}>Comentarios Adicionales</Text>
        <TextInput
          style={styles.textArea}
          value={formData.comentarios}
          onChangeText={v => updateField('comentarios', v)}
          placeholder="Describe cualquier detalle adicional sobre los síntomas..."
          placeholderTextColor="#B0B7C3"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#495565' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#F9FAFB',
  },
  chipActive: {
    backgroundColor: '#E85D27',
    borderColor: '#E85D27',
  },
  chipText: { fontSize: 13, fontWeight: '500', color: '#495565' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  severityBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  severityRow: { flexDirection: 'row', gap: 12 },
  severityBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  severityBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  severityText: { fontSize: 14, fontWeight: '600', color: '#495565' },
  severityTextActive: { color: '#fff' },

  textArea: {
    backgroundColor: '#F3F3F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: '#2E2E2E',
    minHeight: 120,
  },
});
