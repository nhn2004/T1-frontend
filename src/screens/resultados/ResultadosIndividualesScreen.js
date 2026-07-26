import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import StepProgress       from './components/StepProgress';
import Step1SignosVitales from './components/Step1SignosVitales';
import Step2Sintomas      from './components/Step2Sintomas';
import Step3Nutricion     from './components/Step3Nutricion';
import Step4Certificados  from './components/Step4Certificados';
import { MOMENTOS_CONFIG, SINTOMAS_LIST } from './__mocks__/resultadosData';
import { vitalSignsService } from '../../services/vitalSignsService';
import { useAuditOnMount } from '../../hooks/useAuditTrail';
import { a11yButton, a11yDecorative, MIN_TOUCH_SIZE } from '../../constants/a11y';
import useTheme from '../../hooks/useTheme';
import Toast from '../../components/Toast';

const TOTAL_STEPS = 4;

// Campos obligatorios del paso 1 (coinciden con los que el backend persiste).
const VITAL_FIELDS = [
  'temperatura', 'presionSistolica', 'presionDiastolica',
  'frecuenciaCardiaca', 'nivelOxigeno',
];

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

  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Requisito de auditoría: la pantalla escribe la ficha médica de un participante.
  useAuditOnMount('MEDICAL_RECORD', participantId, 'WRITE');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData]       = useState(INITIAL_FORM);
  const [showErrors, setShowErrors]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [notice, setNotice]           = useState(null);

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setShowErrors(false);
  }

  /** Alterna un síntoma seleccionado. Faltaba, y por eso los chips no se renderizaban. */
  function toggleSintoma(sintoma) {
    setFormData((prev) => {
      const list = prev.sintomasSeleccionados;
      return {
        ...prev,
        sintomasSeleccionados: list.includes(sintoma)
          ? list.filter((s) => s !== sintoma)
          : [...list, sintoma],
      };
    });
  }

  /** Los signos vitales son obligatorios antes de avanzar o guardar. */
  function vitalsComplete() {
    return VITAL_FIELDS.every((f) => String(formData[f] ?? '').trim() !== '');
  }

  function handleNext() {
    // El paso 1 (signos vitales) está marcado como obligatorio en STEPS_CONFIG; antes
    // se podía atravesar todo el wizard sin escribir un solo valor.
    if (currentStep === 1 && !vitalsComplete()) {
      setShowErrors(true);
      setNotice({ tone: 'error', message: 'Completa todos los signos vitales para continuar.' });
      return;
    }
    setNotice(null);
    if (currentStep < TOTAL_STEPS) setCurrentStep(s => s + 1);
  }

  function handlePrev() {
    setNotice(null);
    if (currentStep > 1) setCurrentStep(s => s - 1);
  }

  async function handleSave() {
    if (!vitalsComplete()) {
      setShowErrors(true);
      setCurrentStep(1);
      setNotice({ tone: 'error', message: 'Completa todos los signos vitales antes de guardar.' });
      return;
    }
    if (!participantId || !healthPersonnelId) {
      setNotice({
        tone: 'error',
        message: 'Falta el participante o el profesional que registra: no se puede guardar.',
      });
      return;
    }

    setSaving(true);
    try {
      const { unsupported } = await vitalSignsService.submit(participantId, healthPersonnelId, formData);
      if (unsupported.length) {
        // No se cierra la pantalla en silencio: el médico debe enterarse de qué
        // campos no quedaron almacenados.
        setNotice({
          tone: 'warning',
          message: `Guardado. Sin soporte en el servidor: ${unsupported.join(', ')}.`,
        });
        return;
      }
      navigation.goBack();
    } catch (error) {
      const detail = error?.response?.data?.message ?? error?.message ?? 'Error desconocido.';
      setNotice({ tone: 'error', message: `No se pudo guardar: ${detail}` });
    } finally {
      setSaving(false);
    }
  }

  // `sintomas` (el catálogo de opciones) y `onToggleSintoma` faltaban aquí: en las
  // mediciones rápidas T1/T2/T3 el título "Registrar síntomas" aparecía sin ningún
  // chip debajo, porque el componente recibía la lista vacía por defecto.
  const stepProps = {
    formData,
    updateField,
    showErrors,
    sintomas: SINTOMAS_LIST,
    onToggleSintoma: toggleSintoma,
  };

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
          <TouchableOpacity
            style={styles.volverBtn}
            onPress={() => navigation.goBack()}
            {...a11yButton('Volver')}
          >
            <Ionicons name="arrow-back" size={15} color={theme.textPrimary} {...a11yDecorative} />
            <Text style={styles.volverText}>Volver</Text>
          </TouchableOpacity>
        </View>

        {!!notice && (
          <View style={styles.noticeWrap}>
            <Toast message={notice.message} tone={notice.tone} />
          </View>
        )}

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
              <View style={styles.navSpacer} />
              <TouchableOpacity
                style={[
                  styles.guardarBtn,
                  { backgroundColor: saving ? theme.disabledBg : momentoConfig.color },
                ]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving}
                {...a11yButton(momentoConfig.btnLabel, { disabled: saving, busy: saving })}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={saving ? theme.textDisabled : '#FFFFFF'}
                  {...a11yDecorative}
                />
                <Text style={styles.guardarText}>
                  {saving ? 'Guardando…' : momentoConfig.btnLabel}
                </Text>
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
          <View style={styles.navSpacer} />
          <TouchableOpacity
            style={styles.volverBtn}
            onPress={() => navigation.goBack()}
            {...a11yButton('Volver')}
          >
            <Ionicons name="arrow-back" size={15} color={theme.textPrimary} {...a11yDecorative} />
            <Text style={styles.volverText}>Volver</Text>
          </TouchableOpacity>
        </View>

        {!!notice && (
          <View style={styles.noticeWrap}>
            <Toast message={notice.message} tone={notice.tone} />
          </View>
        )}

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
              {...a11yButton('Paso anterior', { disabled: currentStep === 1 })}
            >
              <Ionicons
                name="arrow-back"
                size={14}
                color={currentStep === 1 ? theme.textDisabled : theme.textPrimary}
                {...a11yDecorative}
              />
              <Text style={[styles.anteriorText, currentStep === 1 && styles.anteriorTextDisabled]}>
                Anterior
              </Text>
            </TouchableOpacity>

            <Text style={styles.indicatorText}>Paso {currentStep} de {TOTAL_STEPS}</Text>

            {currentStep < TOTAL_STEPS ? (
              <TouchableOpacity
                style={styles.siguienteBtn}
                onPress={handleNext}
                activeOpacity={0.8}
                {...a11yButton('Siguiente paso')}
              >
                <Text style={styles.siguienteText}>Siguiente</Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={theme.onPrimarySolid}
                  {...a11yDecorative}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.guardarBtn, saving && styles.guardarBtnDisabled]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving}
                {...a11yButton('Guardar datos', { disabled: saving, busy: saving })}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={theme.status.success.onSolid}
                  {...a11yDecorative}
                />
                <Text style={styles.guardarText}>{saving ? 'Guardando…' : 'Guardar Datos'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

    </SafeAreaView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    noticeWrap: { paddingHorizontal: 20, paddingBottom: 8 },
    navSpacer: { flex: 1 },
    guardarBtnDisabled: { backgroundColor: t.disabledBg },

    /* Header T1/T2/T3 */
    momentoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
      backgroundColor: t.card,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderLeftWidth: 5,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      elevation: 3,
      shadowColor: t.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity,
      shadowRadius: 4,
    },
    momentoInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
    momentoBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    // El badge lleva el color del momento (T1..T4), que siempre es un tono saturado:
    // el texto blanco es legible sobre todos ellos.
    momentoBadgeText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    momentoTexts: { gap: 2, flexShrink: 1 },
    momentoLabel: { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    momentoSub:   { fontSize: 12, color: t.textMuted },

    /* Body */
    body: { flex: 1, padding: 14, gap: 10 },
    topRow: { flexDirection: 'row', alignItems: 'center' },

    volverBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: t.card, borderRadius: 8,
      paddingHorizontal: 14, minHeight: MIN_TOUCH_SIZE - 8,
      justifyContent: 'center',
      borderWidth: 1, borderColor: t.border,
    },
    volverText: { fontSize: 14, fontWeight: '600', color: t.textPrimary },

    card: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden',
      shadowColor: t.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity,
      shadowRadius: 8,
      elevation: 3,
    },
    stepContent: { flex: 1 },

    /* Bottom nav */
    bottomNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: t.divider,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    anteriorBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 16, minHeight: MIN_TOUCH_SIZE - 6,
      justifyContent: 'center',
      borderRadius: 8, borderWidth: 1, borderColor: t.border,
      backgroundColor: t.card,
    },
    anteriorBtnDisabled: { borderColor: t.divider, backgroundColor: t.cardAlt },
    anteriorText:         { fontSize: 13, fontWeight: '600', color: t.textPrimary },
    anteriorTextDisabled: { color: t.textDisabled },
    indicatorText:        { fontSize: 13, color: t.textMuted },
    siguienteBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 18, minHeight: MIN_TOUCH_SIZE - 6,
      justifyContent: 'center',
      borderRadius: 8, backgroundColor: t.primarySolid,
    },
    siguienteText: { fontSize: 13, fontWeight: '700', color: t.onPrimarySolid },
    guardarBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 18, minHeight: MIN_TOUCH_SIZE - 6,
      justifyContent: 'center',
      borderRadius: 8, backgroundColor: t.status.success.solid,
    },
    guardarText: { fontSize: 13, fontWeight: '700', color: t.status.success.onSolid },
  });
