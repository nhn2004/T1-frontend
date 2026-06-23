import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Step1SignosVitales({
  formData,
  updateField,
  showTiempo = false,
  finEnabled = true,
  onHoraFinCapture,
  sintomas = [],
  onToggleSintoma,
}) {
  function captureNow(field) {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    updateField(field, `${h}:${m}`);
    if (field === 'horaFin' && onHoraFinCapture) {
      setTimeout(onHoraFinCapture, 50);
    }
  }

  return (
    <View style={s.container}>

      {/* ── Left: vital signs ─────────────────────────── */}
      <View style={s.leftCol}>
        <Text style={s.secTitle}>Signos Vitales</Text>

        {/* Tiempo transcurrido — solo T2/T3 (auto-filled, read-only) */}
        {showTiempo && (
          <View style={s.tiempoBox}>
            <Ionicons name="timer-outline" size={16} color="#E85D27" />
            <View style={{ flex: 1 }}>
              <Text style={s.tiempoLabel}>Tiempo en quema</Text>
              <Text style={s.tiempoValue}>{formData.tiempoTranscurrido || '--:--'}</Text>
            </View>
          </View>
        )}

        {/* Ahora Inicio / Ahora Fin — solo pre-prueba */}
        {!showTiempo && (
          <View style={s.horaRow}>
            <TimeCapture
              label="Ahora Inicio"
              value={formData.horaInicio}
              onCapture={() => captureNow('horaInicio')}
              disabled={false}
            />
            <TimeCapture
              label="Ahora Fin"
              value={formData.horaFin}
              onCapture={() => captureNow('horaFin')}
              disabled={!finEnabled}
            />
          </View>
        )}

        {/* Fields — 2 per row */}
        <View style={s.fieldsGrid}>
          <VitalInput label="Temperatura (°C)"        icon="thermometer-outline" value={formData.temperatura}         onChange={v => updateField('temperatura', v)}         keyboardType="decimal-pad" />
          <VitalInput label="Tensión Arterial (mmHg)" icon="pulse-outline"       value={formData.presionArterial}     onChange={v => updateField('presionArterial', v)}     />
          <VitalInput label="Pulso (lpm)"             icon="heart-outline"       value={formData.frecuenciaCardiaca}  onChange={v => updateField('frecuenciaCardiaca', v)}  keyboardType="number-pad" />
          <VitalInput label="SpO₂ (%)"                icon="fitness-outline"     value={formData.nivelOxigeno}        onChange={v => updateField('nivelOxigeno', v)}        keyboardType="number-pad" />
          <VitalInput label="CO (ppm)"                icon="flame-outline"       value={formData.nivelCO}             onChange={v => updateField('nivelCO', v)}             keyboardType="number-pad" />
        </View>
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* ── Right: symptoms ───────────────────────────── */}
      <View style={s.rightCol}>
        <Text style={s.secTitle}>Registrar síntomas:</Text>
        <View style={s.chips}>
          {sintomas.map(sint => {
            const sel = (formData.sintomasSeleccionados || []).includes(sint);
            return (
              <TouchableOpacity
                key={sint}
                style={[s.chip, sel && s.chipOn]}
                onPress={() => onToggleSintoma && onToggleSintoma(sint)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, sel && s.chipTextOn]}>{sint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

    </View>
  );
}

function TimeCapture({ label, value, onCapture, disabled }) {
  return (
    <View style={s.timeCapture}>
      <Text style={s.timeLabel}>{label}</Text>
      <View style={s.timeInputRow}>
        <TextInput
          style={[s.timeInput, disabled && s.inputDisabled]}
          value={value}
          editable={false}
          placeholder="--:--"
          placeholderTextColor="#B0B7C3"
        />
        <TouchableOpacity
          style={[s.captureBtn, disabled && s.captureBtnDisabled]}
          onPress={disabled ? undefined : onCapture}
          activeOpacity={disabled ? 1 : 0.8}
        >
          <Ionicons name="time-outline" size={13} color={disabled ? '#B0B7C3' : '#fff'} />
          <Text style={[s.captureBtnText, disabled && s.captureBtnTextOff]}>Capturar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VitalInput({ label, icon, value, onChange, keyboardType = 'default' }) {
  return (
    <View style={s.vitalWrap}>
      <View style={s.vitalLabel}>
        <Ionicons name={icon} size={11} color="#697282" />
        <Text style={s.vitalLabelText} numberOfLines={1}>{label}</Text>
      </View>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder="—"
        placeholderTextColor="#B0B7C3"
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  leftCol:  { flex: 1, gap: 12 },
  divider:  { width: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16, alignSelf: 'stretch' },
  rightCol: { flex: 1, gap: 12 },
  secTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },

  tiempoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF3E0', borderRadius: 10,
    borderWidth: 1, borderColor: '#FFB74D', padding: 12,
  },
  tiempoLabel: { fontSize: 11, color: '#E65100', fontWeight: '600' },
  tiempoValue: { fontSize: 22, fontWeight: '800', color: '#E85D27', marginTop: 2 },

  horaRow:    { flexDirection: 'row', gap: 12 },
  timeCapture: { flex: 1, gap: 5 },
  timeLabel:  { fontSize: 12, fontWeight: '600', color: '#495565' },
  timeInputRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  timeInput: {
    flex: 1, backgroundColor: '#F3F3F5', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, color: '#2E2E2E',
  },
  inputDisabled: { backgroundColor: '#EFEFEF', color: '#B0B7C3' },
  captureBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 9,
    borderRadius: 8, backgroundColor: '#E85D27',
  },
  captureBtnDisabled: { backgroundColor: '#E8E8E8' },
  captureBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  captureBtnTextOff: { color: '#B0B7C3' },

  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vitalWrap:  { width: '47%', gap: 5 },
  vitalLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vitalLabelText: { fontSize: 11, fontWeight: '600', color: '#495565', flex: 1 },
  input: {
    backgroundColor: '#F3F3F5', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 14, color: '#2E2E2E',
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1,
    borderColor: '#D0D5DD', backgroundColor: '#F9FAFB',
  },
  chipOn:     { backgroundColor: '#E85D27', borderColor: '#E85D27' },
  chipText:   { fontSize: 12, fontWeight: '500', color: '#495565' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
});
