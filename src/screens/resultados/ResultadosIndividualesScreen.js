import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import StepProgress       from './components/StepProgress';
import Step1SignosVitales from './components/Step1SignosVitales';
import Step2Sintomas      from './components/Step2Sintomas';
import Step3Nutricion     from './components/Step3Nutricion';
import Step4Certificados  from './components/Step4Certificados';
import { MOMENTOS_CONFIG } from './__mocks__/resultadosData';
import { vitalSignsService } from '../../services/vitalSignsService';

const TOTAL_STEPS = 4;

const INITIAL_FORM = {
  horaInicio:         '',
  horaFin:            '',
  temperatura:        '',
  presionSistolica:   '',
  presionDiastolica:  '',
  frecuenciaCardiaca: '',
  nivelOxigeno:       '',
  nivelCO:            '',
  tiempoTranscurrido: '',
  sintomasSeleccionados: [],
  severidad:          'Leve',
  comentarios:        '',
  peso:               '',
  grasaCorporal:      '',
  hidratacion:        '',
};

export default function ResultadosIndividualesScreen({ navigation, route }) {
  const momento          = route?.params?.momento          ?? 'T4';
  const participantId    = route?.params?.participantId    ?? null;
  const healthPersonnelId = route?.params?.healthPersonnelId ?? null;
  const momentoConfig    = MOMENTOS_CONFIG[momento] ?? MOMENTOS_CONFIG.T4;
  const isFullWizard     = momento === 'T4';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData]       = useState(INITIAL_FORM);

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleNext() {
    if (currentStep < TOTAL_STEPS) setCurrentStep(s => s + 1);
  }

  function handlePrev() {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  }

  async function handleSave() {
    if (participantId && healthPersonnelId) {
      try { await vitalSignsService.submit(participantId, healthPersonnelId, formData); } catch {}
    }
    navigation.goBack();
  }

  const stepProps = { formData, updateField };

  /* ── Medición rápida T1 / T2 / T3 ── */
  if (!isFullWizard) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

        <View style={[styles.momentoBar, { borderLeftColor: momentoConfig.color }]}>
          <View style={styles.momentoInfo}>
            <View style={[styles.momentoBadge, { backgroundColor: momentoConfig.color }]}>
              <Text style={styles.momentoBadgeText}>{momento}</Text>
            </View>
            <View style={styles.momentoTexts}>
              <Text style={styles.momentoLabel}>{momentoConfig.label}</Text>
              <Text style={styles.momentoSub}>{momentoConfig.sublabel}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.volverBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={15} color="#2E2E2E" />
            <Text style={styles.volverText}>Volver</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta única con signos vitales */}
        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.stepContent}>
              <Step1SignosVitales
                {...stepProps}
                showTiempo={momentoConfig.showTiempo}
                momento={momento}
              />
            </View>

            <View style={styles.bottomNav}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={[styles.guardarBtn, { backgroundColor: momentoConfig.color }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.guardarText}>{momentoConfig.btnLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </SafeAreaView>
    );
  }

  /* ── Wizard completo T4 ── */
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      <StepProgress currentStep={currentStep} />

      <View style={styles.body}>

        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.volverBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={15} color="#2E2E2E" />
            <Text style={styles.volverText}>Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.stepContent}>
            {currentStep === 1 && <Step1SignosVitales {...stepProps} momento="T4" />}
            {currentStep === 2 && <Step2Sintomas      {...stepProps} />}
            {currentStep === 3 && <Step3Nutricion     {...stepProps} />}
            {currentStep === 4 && <Step4Certificados  {...stepProps} />}
          </View>

          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={[styles.anteriorBtn, currentStep === 1 && styles.anteriorBtnDisabled]}
              onPress={handlePrev}
              disabled={currentStep === 1}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={14}
                color={currentStep === 1 ? '#C0C8D2' : '#2E2E2E'}
              />
              <Text style={[styles.anteriorText, currentStep === 1 && styles.anteriorTextDisabled]}>
                Anterior
              </Text>
            </TouchableOpacity>

            <Text style={styles.indicatorText}>Paso {currentStep} de {TOTAL_STEPS}</Text>

            {currentStep < TOTAL_STEPS ? (
              <TouchableOpacity style={styles.siguienteBtn} onPress={handleNext} activeOpacity={0.8}>
                <Text style={styles.siguienteText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.guardarBtn} onPress={handleSave} activeOpacity={0.8}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.guardarText}>Guardar Datos</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F2F5' },

  /* Header T1/T2/T3 */
  momentoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderLeftWidth: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  momentoInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  momentoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  momentoBadgeText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  momentoTexts: { gap: 2 },
  momentoLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  momentoSub:   { fontSize: 12, color: '#697282' },

  /* Body */
  body: { flex: 1, padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center' },

  volverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  volverText: { fontSize: 14, fontWeight: '600', color: '#2E2E2E' },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stepContent: { flex: 1 },

  /* Bottom nav */
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  anteriorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  anteriorBtnDisabled: { borderColor: '#F0F0F0', backgroundColor: '#FAFAFA' },
  anteriorText:         { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },
  anteriorTextDisabled: { color: '#C0C8D2' },
  indicatorText:        { fontSize: 13, color: '#697282' },
  siguienteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 8, backgroundColor: '#E85D27',
  },
  siguienteText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  guardarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 8, backgroundColor: '#2E7D32',
  },
  guardarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
