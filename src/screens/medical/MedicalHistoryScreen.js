import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { a11yButton, a11yDecorative, a11yHeader } from '../../constants/a11y';
import { useAuth } from '../../hooks';
import { useAuditOnMount } from '../../hooks/useAuditTrail';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import Toast from '../../components/Toast';
import { healthPersonnelService, medicalHistoryService } from '../../services';
import { safeGoBack } from '../../utils/safeGoBack';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';

const EMPTY_FORM = {
  allergies: '', preexistingConditions: '', currentMedication: '', generalObservations: '',
};

export default function MedicalHistoryScreen({ navigation, route }) {
  const traineeId = route?.params?.traineeId ?? null;
  const traineeName = route?.params?.traineeName ?? '';

  const { user, can } = useAuth();
  // Ver el historial tiene sentido para Admin/System Admin (readMedicalRecord), pero
  // crearlo/editarlo es un acto médico — antes Admin podía "guardar" cambios sobre un
  // historial ya existente sin tener ficha de personal de salud (quedaban sin atribuir
  // a ningún profesional), y al intentar crear uno nuevo el guardado simplemente fallaba
  // con un error. Ahora el formulario se muestra de solo lectura para quien no puede
  // editar, en vez de dejar una acción a medias.
  const canEdit = can('createMedicalRecord');
  const theme = useTheme();
  const { t: tAll } = useTranslation();
  const t = tAll.medicalHistory;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useAuditOnMount('MEDICAL_HISTORY', traineeId);

  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [healthPersonnelId, setHealthPersonnelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!traineeId) { setLoading(false); return undefined; }
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [existing, hp] = await Promise.all([
          medicalHistoryService.getByTrainee(traineeId),
          healthPersonnelService.findByUserId(user?.userId),
        ]);
        if (cancelled) return;
        setHealthPersonnelId(hp?.id ?? null);
        if (existing) {
          setRecord(existing);
          setForm({
            allergies: existing.allergies,
            preexistingConditions: existing.preexistingConditions,
            currentMedication: existing.currentMedication,
            generalObservations: existing.generalObservations,
          });
        } else {
          setRecord(null);
          setForm(EMPTY_FORM);
        }
      } catch {
        if (!cancelled) setLoadError(t.loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [traineeId, user?.userId, t.loadError]);

  const setField = (field) => (v) => setForm((f) => ({ ...f, [field]: v }));

  const handleSave = useCallback(async () => {
    if (!record && !healthPersonnelId) {
      setToast({ message: t.missingProfileError, tone: 'error' });
      return;
    }
    setSaving(true);
    try {
      const saved = record
        ? await medicalHistoryService.update(record.id, form)
        : await medicalHistoryService.create({
            traineeFirefighterId: traineeId,
            createdByHealthPersonnelId: healthPersonnelId,
            ...form,
          });
      setRecord(saved);
      setToast({ message: t.savedToast, tone: 'success' });
    } catch (e) {
      if (!e.response) {
        // Encolado offline — se sincroniza solo cuando vuelva la señal. No se puede
        // actualizar `record` con el resultado del servidor todavía, pero no hay
        // razón para tratarlo como un error.
        setToast({ message: 'Sin conexión: se guardó localmente y se sincronizará cuando vuelva la señal.', tone: 'warning' });
        setSaving(false);
        return;
      }
      setToast({ message: e?.response?.data?.message ?? t.saveError, tone: 'error' });
    } finally {
      setSaving(false);
    }
  }, [record, healthPersonnelId, form, traineeId, t]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topTitleRow}>
            <Ionicons name="medkit-outline" size={20} color={theme.primaryText} {...a11yDecorative} />
            <View>
              <Text style={styles.pageTitle} {...a11yHeader(t.pageTitle)}>{t.pageTitle}</Text>
              {!!traineeName && <Text style={styles.subtitle}>{traineeName}</Text>}
            </View>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => safeGoBack(navigation)}
            activeOpacity={0.8}
            {...a11yButton(t.back)}
          >
            <Ionicons name="arrow-back" size={16} color={theme.textPrimary} {...a11yDecorative} />
            <Text style={styles.backBtnText}>{t.back}</Text>
          </TouchableOpacity>
        </View>

        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : loadError ? (
          <Toast message={loadError} tone="error" />
        ) : (
          <View style={styles.card}>
            {!record && (
              <View style={styles.noRecordBanner}>
                <Ionicons name="information-circle-outline" size={18} color={theme.status.info.fg} {...a11yDecorative} />
                <View style={styles.noRecordTextWrap}>
                  <Text style={styles.noRecordTitle}>{t.noRecordTitle}</Text>
                  <Text style={styles.noRecordBody}>
                    {canEdit ? t.noRecordBody : t.noRecordBodyReadOnly}
                  </Text>
                </View>
              </View>
            )}

            {/* Sin permiso de edición y sin historial todavía: no hay nada que leer ni
                que se pueda guardar — mostrar el formulario vacío solo invitaría a
                llenarlo para nada. */}
            {(canEdit || record) && (
              <>
                <Field label={t.allergiesLabel} value={form.allergies} onChangeText={setField('allergies')} styles={styles} editable={canEdit} />
                <Field label={t.preexistingLabel} value={form.preexistingConditions} onChangeText={setField('preexistingConditions')} styles={styles} editable={canEdit} />
                <Field label={t.medicationLabel} value={form.currentMedication} onChangeText={setField('currentMedication')} styles={styles} editable={canEdit} />
                <Field label={t.observationsLabel} value={form.generalObservations} onChangeText={setField('generalObservations')} styles={styles} multiline editable={canEdit} />
              </>
            )}

            {!!record?.updatedAt && (
              <Text style={styles.updatedText}>
                {t.lastUpdated}: {new Date(record.updatedAt).toLocaleString()}
              </Text>
            )}

            {canEdit && (
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={saving}
                {...a11yButton(record ? t.saveButton : t.createButton, { disabled: saving, busy: saving })}
              >
                {saving
                  ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                  : <Ionicons name="save-outline" size={16} color={theme.onPrimarySolid} {...a11yDecorative} />}
                <Text style={styles.saveBtnText}>{record ? t.saveButton : t.createButton}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, styles, multiline, editable = true }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel} nativeID={`mh-${label}`}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        editable={editable}
        accessibilityLabel={label}
        accessibilityLabelledBy={`mh-${label}`}
        accessibilityState={{ disabled: !editable }}
      />
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1 },
    content: { padding: 16, gap: 14, maxWidth: 760, width: '100%', alignSelf: 'center' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
    topTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pageTitle: { ...TEXT_STYLES.screenTitle, color: t.textPrimary },
    subtitle: { fontSize: FONT_SIZE.md, color: t.textSecondary, marginTop: 2 },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, minHeight: 40, borderRadius: 10,
      backgroundColor: t.card, borderWidth: 1.5, borderColor: t.border,
    },
    backBtnText: { ...TEXT_STYLES.bodyBold, color: t.textPrimary },
    loadingBox: { paddingVertical: 40, alignItems: 'center' },

    card: {
      backgroundColor: t.card, borderRadius: 16, padding: 20, gap: 16,
      borderWidth: 1, borderColor: t.border,
    },
    noRecordBanner: {
      flexDirection: 'row', gap: 10, padding: 12, borderRadius: 10,
      backgroundColor: t.status.info.bg,
    },
    noRecordTextWrap: { flex: 1, gap: 3 },
    noRecordTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: t.status.info.fg },
    noRecordBody: { fontSize: FONT_SIZE.base, color: t.status.info.fg, lineHeight: 17 },

    field: { gap: 6 },
    fieldLabel: { fontSize: FONT_SIZE.md, color: t.textSecondary, fontWeight: FONT_WEIGHT.semibold },
    input: {
      borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
      fontSize: FONT_SIZE.lg, backgroundColor: t.cardAlt, borderColor: t.borderStrong, color: t.textPrimary,
    },
    inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
    inputDisabled: { opacity: 0.6 },
    updatedText: { fontSize: FONT_SIZE.base, color: t.textMuted },

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 8, paddingVertical: 12, backgroundColor: t.primarySolid,
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.onPrimarySolid },
  });
