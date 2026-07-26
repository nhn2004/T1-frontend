import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import { a11yButton, a11yDecorative } from '../../../constants/a11y';

export default function Step1SignosVitales({
  formData,
  updateField,
  showTiempo = false,
  finEnabled = true,
  onHoraFinCapture,
  sintomas = [],
  onToggleSintoma,
}) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  function captureNow(field) {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    updateField(field, `${h}:${m}`);
    if (field === 'horaFin' && onHoraFinCapture) {
      setTimeout(onHoraFinCapture, 50);
    }
  }

  const inicioDisabled = !!formData.horaInicio;

  // La sección de síntomas solo se muestra si hay catálogo Y forma de alternarlos.
  // Antes se renderizaba el título "Registrar síntomas:" seguido de nada cuando el
  // llamador no pasaba estas props, y parecía que la función estaba rota.
  const canReportSymptoms = sintomas.length > 0 && typeof onToggleSintoma === 'function';

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.secTitle} accessibilityRole="header">Signos Vitales</Text>

      {showTiempo && (
        <View style={s.tiempoBox}>
          <Ionicons name="timer-outline" size={16} color={theme.status.warning.fg} {...a11yDecorative} />
          <View style={s.tiempoText}>
            <Text style={s.tiempoLabel}>Tiempo en quema</Text>
            <Text style={s.tiempoValue}>{formData.tiempoTranscurrido || '--:--'}</Text>
          </View>
        </View>
      )}

      {!showTiempo && (
        <View style={s.horaRow}>
          <TimeCapture
            label="Ahora Inicio"
            value={formData.horaInicio}
            onCapture={() => captureNow('horaInicio')}
            disabled={inicioDisabled}
            s={s}
            theme={theme}
          />
          <TimeCapture
            label="Ahora Fin"
            value={formData.horaFin}
            onCapture={() => captureNow('horaFin')}
            disabled={!finEnabled}
            s={s}
            theme={theme}
          />
        </View>
      )}

      <View style={s.fieldsGrid}>
        <VitalInput
          label="Temperatura (°C)" icon="thermometer-outline"
          value={formData.temperatura}
          onChange={(v) => updateField('temperatura', v)}
          keyboardType="decimal-pad" s={s} theme={theme}
        />
        <BloodPressureInput
          sistolica={formData.presionSistolica}
          diastolica={formData.presionDiastolica}
          onChangeSistolica={(v) => updateField('presionSistolica', v)}
          onChangeDiastolica={(v) => updateField('presionDiastolica', v)}
          s={s} theme={theme}
        />
        <VitalInput
          label="Pulso (lpm)" icon="heart-outline"
          value={formData.frecuenciaCardiaca}
          onChange={(v) => updateField('frecuenciaCardiaca', v)}
          s={s} theme={theme}
        />
        <VitalInput
          label="SpO₂ (%)" icon="fitness-outline"
          value={formData.nivelOxigeno}
          onChange={(v) => updateField('nivelOxigeno', v)}
          s={s} theme={theme}
        />
        <VitalInput
          label="CO (ppm)" icon="flame-outline"
          value={formData.nivelCO}
          onChange={(v) => updateField('nivelCO', v)}
          // El backend no almacena el CO por bombero; se avisa aquí para que el
          // médico sepa que este valor no queda registrado en el servidor.
          hint="No se guarda en el servidor todavía"
          s={s} theme={theme}
        />
      </View>

      {canReportSymptoms && (
        <>
          <View style={s.divider} {...a11yDecorative} />
          <Text style={s.secTitle} accessibilityRole="header">Registrar síntomas:</Text>
          <View style={s.chips}>
            {sintomas.map((sint) => {
              const sel = (formData.sintomasSeleccionados || []).includes(sint);
              return (
                <TouchableOpacity
                  key={sint}
                  style={[s.chip, sel && s.chipOn]}
                  onPress={() => onToggleSintoma(sint)}
                  activeOpacity={0.7}
                  accessible
                  accessibilityRole="checkbox"
                  accessibilityLabel={sint}
                  accessibilityState={{ checked: sel }}
                >
                  <Text style={[s.chipText, sel && s.chipTextOn]}>{sint}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function TimeCapture({ label, value, onCapture, disabled, s, theme }) {
  return (
    <View style={s.timeCapture}>
      <Text style={s.timeLabel} nativeID={`time-${label}`}>{label}</Text>
      <View style={s.timeInputRow}>
        <TextInput
          style={[s.timeInput, disabled && s.inputDisabled]}
          value={value}
          editable={false}
          placeholder="--:--"
          placeholderTextColor={theme.textPlaceholder}
          accessibilityLabel={label}
          accessibilityLabelledBy={`time-${label}`}
        />
        <TouchableOpacity
          style={[s.captureBtn, disabled && s.captureBtnDisabled]}
          onPress={disabled ? undefined : onCapture}
          activeOpacity={disabled ? 1 : 0.8}
          disabled={disabled}
          {...a11yButton(`Capturar ${label}`, { disabled })}
        >
          <Ionicons
            name="time-outline"
            size={13}
            color={disabled ? theme.textDisabled : theme.onPrimarySolid}
            {...a11yDecorative}
          />
          <Text style={[s.captureBtnText, disabled && s.captureBtnTextOff]}>Capturar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VitalInput({ label, icon, value, onChange, keyboardType = 'number-pad', hint, s, theme }) {
  return (
    <View style={s.vitalWrap}>
      <View style={s.vitalLabel}>
        <Ionicons name={icon} size={11} color={theme.icon} {...a11yDecorative} />
        <Text style={s.vitalLabelText} numberOfLines={1} nativeID={`vital-${label}`}>{label}</Text>
      </View>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder="—"
        placeholderTextColor={theme.textPlaceholder}
        accessibilityLabel={label}
        accessibilityLabelledBy={`vital-${label}`}
        accessibilityHint={hint}
      />
      {!!hint && <Text style={s.vitalHint}>{hint}</Text>}
    </View>
  );
}

function BloodPressureInput({ sistolica, diastolica, onChangeSistolica, onChangeDiastolica, s, theme }) {
  return (
    <View style={s.vitalWrap}>
      <View style={s.vitalLabel}>
        <Ionicons name="pulse-outline" size={11} color={theme.icon} {...a11yDecorative} />
        <Text style={s.vitalLabelText} numberOfLines={1}>Tensión Art. (mmHg)</Text>
      </View>
      <View style={s.bpRow}>
        <TextInput
          style={[s.input, s.bpInput]}
          value={sistolica}
          onChangeText={onChangeSistolica}
          keyboardType="number-pad"
          placeholder="120"
          placeholderTextColor={theme.textPlaceholder}
          accessibilityLabel="Presión sistólica, en milímetros de mercurio"
        />
        <Text style={s.bpSlash} {...a11yDecorative}>/</Text>
        <TextInput
          style={[s.input, s.bpInput]}
          value={diastolica}
          onChangeText={onChangeDiastolica}
          keyboardType="number-pad"
          placeholder="80"
          placeholderTextColor={theme.textPlaceholder}
          accessibilityLabel="Presión diastólica, en milímetros de mercurio"
        />
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    container: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      gap: 12,
      maxWidth: 660,
      alignSelf: 'center',
      width: '100%',
    },

    secTitle: { fontSize: 13, fontWeight: '700', color: t.textPrimary },

    tiempoBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: t.status.warning.bg, borderRadius: 10,
      borderWidth: 1, borderColor: t.status.warning.border, padding: 12,
    },
    tiempoText: { flex: 1 },
    tiempoLabel: { fontSize: 11, color: t.status.warning.fg, fontWeight: '600' },
    tiempoValue: { fontSize: 22, fontWeight: '800', color: t.primaryText, marginTop: 2 },

    horaRow: { flexDirection: 'row', gap: 20 },
    timeCapture: { flex: 1, gap: 5 },
    timeLabel: { fontSize: 12, fontWeight: '600', color: t.textSecondary },
    timeInputRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
    timeInput: {
      flex: 1, backgroundColor: t.cardAlt, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, color: t.textPrimary,
    },
    inputDisabled: { backgroundColor: t.disabledBg, color: t.textDisabled },
    captureBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 9,
      borderRadius: 8, backgroundColor: t.primarySolid,
    },
    captureBtnDisabled: { backgroundColor: t.disabledBg },
    captureBtnText: { fontSize: 12, fontWeight: '600', color: t.onPrimarySolid },
    captureBtnTextOff: { color: t.textDisabled },

    fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    vitalWrap: { width: '45%', minWidth: 140, flexGrow: 1, gap: 5 },
    vitalLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    vitalLabelText: { fontSize: 11, fontWeight: '600', color: t.textSecondary, flex: 1 },
    vitalHint: { fontSize: 10, color: t.textMuted, fontStyle: 'italic' },
    input: {
      backgroundColor: t.cardAlt, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 9,
      fontSize: 14, color: t.textPrimary,
    },

    bpRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bpInput: { flex: 1 },
    bpSlash: { fontSize: 18, fontWeight: '700', color: t.textSecondary },

    divider: { height: 1, backgroundColor: t.divider },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 8, borderWidth: 1,
      borderColor: t.borderStrong, backgroundColor: t.cardAlt,
    },
    chipOn: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    chipText: { fontSize: 12, fontWeight: '500', color: t.textSecondary },
    chipTextOn: { color: t.onPrimarySolid, fontWeight: '600' },
  });
