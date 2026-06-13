import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Step3Nutricion({ formData, updateField }) {
  function calcularHidratacion() {
    const peso = parseFloat(formData.peso);
    if (!isNaN(peso) && peso > 0) {
      updateField('hidratacion', (peso * 0.035).toFixed(1));
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Datos Nutricionales</Text>
        <Text style={styles.asterisk}> *</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <FormLabel label="Peso (kg)" icon="scale-outline" />
          <TextInput
            style={styles.input}
            value={formData.peso}
            onChangeText={v => updateField('peso', v)}
            keyboardType="decimal-pad"
            placeholder="75.0"
            placeholderTextColor="#B0B7C3"
          />
        </View>
        <View style={styles.col}>
          <FormLabel label="Grasa Corporal (%)" icon="pulse-outline" />
          <TextInput
            style={styles.input}
            value={formData.grasaCorporal}
            onChangeText={v => updateField('grasaCorporal', v)}
            keyboardType="decimal-pad"
            placeholder="18.5"
            placeholderTextColor="#B0B7C3"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <FormLabel label="Hidratación Recomendada (L/día)" icon="water-outline" />
          <View style={styles.hidRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.hidratacion}
              onChangeText={v => updateField('hidratacion', v)}
              keyboardType="decimal-pad"
              placeholder="2.5"
              placeholderTextColor="#B0B7C3"
            />
            <TouchableOpacity style={styles.calcBtn} onPress={calcularHidratacion}>
              <Text style={styles.calcBtnText}>Calcular</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.col} />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Cálculo de Hidratación</Text>
        <Text style={styles.infoText}>
          La hidratación recomendada se calcula automáticamente basándose en el peso corporal
          (35ml por kg). Este valor puede ajustarse manualmente según las necesidades
          específicas del bombero durante operaciones.
        </Text>
      </View>
    </ScrollView>
  );
}

function FormLabel({ label, icon }) {
  return (
    <View style={styles.labelRow}>
      {icon && <Ionicons name={icon} size={13} color="#697282" />}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, gap: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  asterisk: { fontSize: 22, fontWeight: '700', color: '#C62828' },
  row: { flexDirection: 'row', gap: 20 },
  col: { flex: 1, gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#495565' },
  input: {
    backgroundColor: '#F3F3F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2E2E2E',
  },
  hidRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  calcBtn: {
    backgroundColor: '#E85D27',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  calcBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  infoBox: {
    backgroundColor: '#E85D27',
    borderRadius: 12,
    padding: 18,
    gap: 8,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
});
