import React, { useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import { a11yButton, a11yDecorative, MIN_TOUCH_SIZE } from '../../../constants/a11y';

const ML_PER_KG = 0.035;

export default function Step3Nutricion({ formData, updateField }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const peso = parseFloat(formData.peso);
  const canCalc = Number.isFinite(peso) && peso > 0;

  function calcularHidratacion() {
    if (!canCalc) return;
    updateField('hidratacion', (peso * ML_PER_KG).toFixed(1));
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">Datos Nutricionales</Text>
        <Text style={styles.asterisk} accessibilityLabel="obligatorio"> *</Text>
      </View>

      {/* La bioimpedancia (peso/grasa) tiene tabla en el esquema pero no endpoint,
          así que estos valores no llegan al servidor todavía. */}
      <Text style={styles.notice}>
        Los datos nutricionales aún no se guardan en el servidor.
      </Text>

      <View style={styles.row}>
        <View style={styles.col}>
          <FormLabel label="Peso (kg)" icon="scale-outline" id="peso" styles={styles} theme={theme} />
          <TextInput
            style={styles.input}
            value={formData.peso}
            onChangeText={(v) => updateField('peso', v)}
            keyboardType="decimal-pad"
            placeholder="75.0"
            placeholderTextColor={theme.textPlaceholder}
            accessibilityLabel="Peso en kilogramos"
            accessibilityLabelledBy="peso"
          />
        </View>
        <View style={styles.col}>
          <FormLabel label="Grasa Corporal (%)" icon="pulse-outline" id="grasa" styles={styles} theme={theme} />
          <TextInput
            style={styles.input}
            value={formData.grasaCorporal}
            onChangeText={(v) => updateField('grasaCorporal', v)}
            keyboardType="decimal-pad"
            placeholder="18.5"
            placeholderTextColor={theme.textPlaceholder}
            accessibilityLabel="Grasa corporal en porcentaje"
            accessibilityLabelledBy="grasa"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <FormLabel
            label="Hidratación Recomendada (L/día)"
            icon="water-outline"
            id="hidratacion"
            styles={styles}
            theme={theme}
          />
          <View style={styles.hidRow}>
            <TextInput
              style={[styles.input, styles.hidInput]}
              value={formData.hidratacion}
              onChangeText={(v) => updateField('hidratacion', v)}
              keyboardType="decimal-pad"
              placeholder="2.5"
              placeholderTextColor={theme.textPlaceholder}
              accessibilityLabel="Hidratación recomendada en litros por día"
              accessibilityLabelledBy="hidratacion"
            />
            <TouchableOpacity
              style={[styles.calcBtn, !canCalc && styles.calcBtnDisabled]}
              onPress={calcularHidratacion}
              disabled={!canCalc}
              {...a11yButton('Calcular hidratación', {
                disabled: !canCalc,
                hint: canCalc ? undefined : 'Ingresa primero el peso',
              })}
            >
              <Text style={[styles.calcBtnText, !canCalc && styles.calcBtnTextDisabled]}>
                Calcular
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.col} />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle} accessibilityRole="header">Cálculo de Hidratación</Text>
        <Text style={styles.infoText}>
          La hidratación recomendada se calcula automáticamente basándose en el peso
          corporal (35 ml por kg). Este valor puede ajustarse manualmente según las
          necesidades específicas del bombero durante operaciones.
        </Text>
      </View>
    </ScrollView>
  );
}

function FormLabel({ label, icon, id, styles, theme }) {
  return (
    <View style={styles.labelRow}>
      {icon && <Ionicons name={icon} size={13} color={theme.icon} {...a11yDecorative} />}
      <Text style={styles.label} nativeID={id}>{label}</Text>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 24, gap: 20, maxWidth: 720, width: '100%', alignSelf: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    title: { fontSize: 22, fontWeight: '700', color: t.textPrimary },
    asterisk: { fontSize: 22, fontWeight: '700', color: t.status.danger.fg },
    notice: {
      fontSize: 12, color: t.status.warning.fg,
      backgroundColor: t.status.warning.bg,
      borderWidth: 1, borderColor: t.status.warning.border,
      borderRadius: 8, padding: 10, lineHeight: 17,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    col: { flex: 1, minWidth: 180, gap: 6 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    label: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    input: {
      backgroundColor: t.cardAlt,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: t.textPrimary,
    },
    hidRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    hidInput: { flex: 1 },
    calcBtn: {
      backgroundColor: t.primarySolid,
      borderRadius: 8,
      paddingHorizontal: 18,
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center',
    },
    calcBtnDisabled: { backgroundColor: t.disabledBg },
    calcBtnText: { fontSize: 13, fontWeight: '700', color: t.onPrimarySolid },
    calcBtnTextDisabled: { color: t.textDisabled },
    // Panel informativo con relleno naranja de marca: el texto va en blanco y en
    // peso alto para mantenerse legible sobre ese fondo.
    infoBox: { backgroundColor: t.primarySolid, borderRadius: 12, padding: 18, gap: 8 },
    infoTitle: { fontSize: 15, fontWeight: '700', color: t.onPrimarySolid },
    infoText: { fontSize: 13, color: t.onPrimarySolid, lineHeight: 20, opacity: 0.95 },
  });
