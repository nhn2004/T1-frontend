import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Step1SignosVitales({ formData, updateField, showTiempo = false, momento = 'T4' }) {
  function captureTime(field) {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    updateField(field, `${h}:${m}`);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Signos Vitales</Text>

      {/* Tiempo transcurrido — solo T2 y T3 */}
      {showTiempo && (
        <View style={styles.tiempoBox}>
          <Ionicons name="timer-outline" size={18} color="#E85D27" />
          <View style={styles.tiempoTexts}>
            <Text style={styles.tiempoLabel}>Tiempo transcurrido en la quema (min)</Text>
            <TextInput
              style={styles.tiempoInput}
              value={formData.tiempoTranscurrido}
              onChangeText={v => updateField('tiempoTranscurrido', v)}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#B0B7C3"
            />
          </View>
        </View>
      )}

      {/* Hora de Inicio / Fin — solo T1 y T4 */}
      {!showTiempo && (
        <View style={styles.row}>
          <View style={styles.col}>
            <FormLabel label="Hora de Inicio" />
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={formData.horaInicio}
                onChangeText={v => updateField('horaInicio', v)}
                placeholder="00:00"
                placeholderTextColor="#B0B7C3"
              />
              <TouchableOpacity style={styles.captureBtn} onPress={() => captureTime('horaInicio')}>
                <Ionicons name="time-outline" size={14} color="#fff" />
                <Text style={styles.captureBtnText}>Capturar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.col}>
            <FormLabel label="Hora de Fin" />
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={formData.horaFin}
                onChangeText={v => updateField('horaFin', v)}
                placeholder="00:00"
                placeholderTextColor="#B0B7C3"
              />
              <TouchableOpacity style={styles.captureBtn} onPress={() => captureTime('horaFin')}>
                <Ionicons name="time-outline" size={14} color="#fff" />
                <Text style={styles.captureBtnText}>Capturar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.col}>
          <FormLabel label="Temperatura (°C)" icon="thermometer-outline" />
          <TextInput
            style={styles.input}
            value={formData.temperatura}
            onChangeText={v => updateField('temperatura', v)}
            keyboardType="decimal-pad"
            placeholder="36.5"
            placeholderTextColor="#B0B7C3"
          />
        </View>
        <View style={styles.col}>
          <FormLabel label="Tensión Arterial (mmHg)" icon="pulse-outline" />
          <TextInput
            style={styles.input}
            value={formData.presionArterial}
            onChangeText={v => updateField('presionArterial', v)}
            placeholder="120/80"
            placeholderTextColor="#B0B7C3"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <FormLabel label="Pulso (lpm)" icon="heart-outline" />
          <TextInput
            style={styles.input}
            value={formData.frecuenciaCardiaca}
            onChangeText={v => updateField('frecuenciaCardiaca', v)}
            keyboardType="number-pad"
            placeholder="75"
            placeholderTextColor="#B0B7C3"
          />
        </View>
        <View style={styles.col}>
          <FormLabel label="Saturación de O₂ - SpO2 (%)" icon="fitness-outline" />
          <TextInput
            style={styles.input}
            value={formData.nivelOxigeno}
            onChangeText={v => updateField('nivelOxigeno', v)}
            keyboardType="number-pad"
            placeholder="98"
            placeholderTextColor="#B0B7C3"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <FormLabel label="Medición de CO (ppm)" icon="flame-outline" />
          <TextInput
            style={styles.input}
            value={formData.nivelCO}
            onChangeText={v => updateField('nivelCO', v)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#B0B7C3"
          />
        </View>
        <View style={styles.col} />
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
  content: { padding: 24, gap: 18 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },

  /* Tiempo transcurrido (T2/T3) */
  tiempoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
    padding: 14,
  },
  tiempoTexts: { flex: 1, gap: 8 },
  tiempoLabel: { fontSize: 13, fontWeight: '600', color: '#E65100' },
  tiempoInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#E85D27',
    width: 120,
  },

  /* Form grid */
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
  timeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  captureBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 8, backgroundColor: '#E85D27',
  },
  captureBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
