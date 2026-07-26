import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, Pressable, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { a11yAlert, a11yButton, a11yDecorative, a11yModal, ICON_HIT_SLOP, MIN_TOUCH_SIZE } from '../../constants/a11y';
import AgendaTimeline from './components/AgendaTimeline';
import TrainingCenterSidebar from './components/TrainingCenterSidebar';
import { STATUS_DISPLAY, TRAINEE_STATUS_DISPLAY } from './sessionDisplay';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import Toast from '../../components/Toast';
import { sessionService } from '../../services';
import { traineeService } from '../../services/traineeService';
import api from '../../services/api';

const EMPTY_SESSION = {
  id: null,
  title: '',
  description: '',
  date: '—',
  time: '—',
  capacityCount: 0,
  status: 'PLANNED',
  note: '',
  agenda: null,
  trainingCenter: null,
  instructors: [],
  instructorsLoaded: false,
};

const EMPTY_AMBIENTAL = {
  presionAtmosferica: '',
  temperaturaAmbiente: '',
  humedadRelativa: '',
};

const AMBIENTAL_FIELDS = [
  { key: 'presionAtmosferica',  label: 'Presión atmosférica (hPa)', placeholder: 'ej. 1013' },
  { key: 'temperaturaAmbiente', label: 'Temperatura ambiente (°C)', placeholder: 'ej. 24' },
  { key: 'humedadRelativa',     label: 'Humedad relativa (%)',      placeholder: 'ej. 65' },
];

export default function SessionDetailScreen({ navigation, route, sessionId, onBack }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { roles, user, canAccessRoute } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 980;
  const isTrainee = roles.includes(ROLES.FIREFIGHTER_TRAINEE);

  const styles = useMemo(() => makeStyles(theme, isCompact), [theme, isCompact]);

  const id = sessionId ?? route?.params?.id;
  const [session, setSession] = useState({ ...EMPTY_SESSION });
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const myParticipantIdRef = useRef(null);

  const [showAmbientalModal, setShowAmbientalModal] = useState(false);
  const [ambiental, setAmbiental] = useState(EMPTY_AMBIENTAL);
  const [ambErrors, setAmbErrors] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let alive = true;

    setSyncing(true);
    setLoadError(null);
    sessionService.getById(id)
      .then((data) => { if (alive) setSession({ ...EMPTY_SESSION, ...data }); })
      .catch(() => {
        if (alive) setLoadError('No se pudo cargar el detalle de la capacitación.');
      })
      .finally(() => { if (alive) setSyncing(false); });

    return () => { alive = false; };
  }, [id]);

  // Resuelve el sessionParticipantId del aspirante logueado para esta sesión.
  useEffect(() => {
    if (!isTrainee || !id || !user?.userId) return undefined;
    let alive = true;

    (async () => {
      try {
        const trainees = await traineeService.getAll();
        const me = trainees.find((x) => x.userId === user.userId);
        if (!me || !alive) return;

        const { data: wrapper } = await api.get('/session-participants');
        const mine = (wrapper.data ?? []).find(
          (p) => p.trainingSessionId === id && p.traineeFirefighterId === me.id,
        );
        if (mine && alive) myParticipantIdRef.current = mine.sessionParticipantId;
      } catch {
        // Sin participante resuelto el botón de resultados avisará al pulsarse.
      }
    })();

    return () => { alive = false; };
  }, [isTrainee, id, user]);

  const display = isTrainee
    ? (TRAINEE_STATUS_DISPLAY[session.status] ?? TRAINEE_STATUS_DISPLAY.PLANNED)
    : (STATUS_DISPLAY[session.status] ?? STATUS_DISPLAY.PLANNED);

  const updateAmb = useCallback(
    (field, val) => setAmbiental((prev) => ({ ...prev, [field]: val })),
    [],
  );

  // Solo se navega a la gestión de asistentes si el rol tiene esa pantalla montada:
  // antes cualquier rol no-aspirante lo intentaba y la navegación fallaba en silencio.
  const navigateToPersonas = useCallback(() => {
    if (!canAccessRoute(ROUTES.PEOPLE_SESSIONS)) {
      setLoadError('Tu rol no tiene acceso a la gestión de asistentes.');
      return;
    }
    navigation?.navigate(ROUTES.PEOPLE_SESSIONS, {
      sessionId: session.id,
      sessionName: session.title,
      ambiental,
    });
  }, [canAccessRoute, navigation, session.id, session.title, ambiental]);

  const handleAction = useCallback(() => {
    if (display.btnDisabled) return;

    if (isTrainee) {
      if (!myParticipantIdRef.current) {
        setLoadError('No encontramos tu participación en esta capacitación.');
        return;
      }
      navigation?.navigate(ROUTES.RESULTS_TRAINEE, {
        bomberoId: myParticipantIdRef.current,
        bomberoName: user?.name,
      });
      return;
    }

    if (session.status === 'PLANNED') {
      setAmbErrors(false);
      setAmbiental(EMPTY_AMBIENTAL);
      setShowAmbientalModal(true);
    } else {
      navigateToPersonas();
    }
  }, [display, isTrainee, navigation, session.status, user, navigateToPersonas]);

  const handleConfirmarAmbiental = useCallback(() => {
    const missing = AMBIENTAL_FIELDS.some((f) => !ambiental[f.key]);
    if (missing) {
      setAmbErrors(true);
      return;
    }
    setShowAmbientalModal(false);
    navigateToPersonas();
  }, [ambiental, navigateToPersonas]);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else navigation?.goBack();
  }, [onBack, navigation]);

  const BodyContainer = isCompact ? ScrollView : View;

  const btnBackground = display.btnDisabled
    ? theme.disabledBg
    : display.btnTone === 'primary'
      ? theme.primarySolid
      : theme.status[display.btnTone]?.solid ?? theme.primarySolid;

  const btnTextColor = display.btnDisabled
    ? theme.textDisabled
    : display.btnTone === 'primary'
      ? theme.onPrimarySolid
      : theme.status[display.btnTone]?.onSolid ?? theme.onPrimarySolid;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topTitleRow}>
            <Ionicons name="calendar" size={20} color={theme.primaryText} {...a11yDecorative} />
            <Text style={styles.topTitle} accessibilityRole="header">
              {t.sessionDetail.pageTitle}
            </Text>
            {syncing && <ActivityIndicator size="small" color={theme.primary} />}
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.8}
            {...a11yButton(t.sessionDetail.back)}
          >
            <Ionicons name="arrow-back" size={16} color={theme.textPrimary} {...a11yDecorative} />
            <Text style={styles.backBtnText}>{t.sessionDetail.back}</Text>
          </TouchableOpacity>
        </View>

        {!!loadError && (
          <View {...a11yAlert(loadError)}>
            <Toast message={loadError} tone="error" />
          </View>
        )}

        {/* En tablet/escritorio ocupa toda la altura sin scroll de página (solo la
            agenda scrollea). En teléfono se apila y todo el cuerpo scrollea. */}
        <BodyContainer
          style={styles.body}
          {...(isCompact
            ? { contentContainerStyle: styles.bodyCompactContent, showsVerticalScrollIndicator: false }
            : {})}
        >
          <View style={styles.leftPanel}>
            {/* Resumen */}
            <View style={styles.card}>
              <Text style={styles.sessionTitle} accessibilityRole="header">{session.title}</Text>
              {!!session.description && (
                <Text style={styles.sessionDesc}>{session.description}</Text>
              )}
              <View style={styles.statsRow}>
                <StatItem icon="calendar-outline" label={t.sessionDetail.date} value={session.date} styles={styles} theme={theme} />
                <StatItem icon="time-outline" label={t.sessionDetail.time} value={session.time} styles={styles} theme={theme} />
                <StatItem
                  icon="people-outline"
                  label={t.sessionDetail.capacity}
                  value={`${session.capacityCount} ${t.sessions.applicants}`}
                  styles={styles}
                  theme={theme}
                />
              </View>
            </View>

            {/* Descripción general + agenda */}
            <View style={[styles.card, !isCompact && styles.overviewCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="layers-outline" size={18} color={theme.icon} {...a11yDecorative} />
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  {t.sessionDetail.overview}
                </Text>
              </View>

              <ScrollView
                style={!isCompact && styles.overviewScroll}
                scrollEnabled={!isCompact}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.overviewScrollContent}
              >
                {!!session.note && (
                  <Text style={styles.note}>
                    <Text style={styles.noteBold}>{t.sessionDetail.note} </Text>
                    {session.note}
                  </Text>
                )}
                <AgendaTimeline items={session.agenda} />
              </ScrollView>
            </View>

            {/* Estado + acción */}
            <View style={styles.statusCard}>
              <View style={styles.watermark} pointerEvents="none" {...a11yDecorative}>
                <Ionicons name="flame" size={90} color={theme.primary} style={styles.watermarkIcon} />
              </View>

              <View style={styles.statusRow}>
                <Ionicons name="layers-outline" size={16} color={theme.icon} {...a11yDecorative} />
                <Text style={styles.statusLabel}>{t.sessionDetail.status}</Text>
                {(display.badges || []).map((b) => {
                  const tone = theme.status[b.tone] ?? theme.status.neutral;
                  return (
                    <View key={b.labelKey} style={[styles.badge, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.badgeText, { color: tone.fg }]}>
                        {t.common.status[b.labelKey]}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: btnBackground }]}
                onPress={handleAction}
                activeOpacity={display.btnDisabled ? 1 : 0.85}
                disabled={display.btnDisabled}
                {...a11yButton(t.sessionDetail[display.btnLabelKey], {
                  disabled: display.btnDisabled,
                })}
              >
                <Text style={[styles.actionBtnText, { color: btnTextColor }]}>
                  {t.sessionDetail[display.btnLabelKey]}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TrainingCenterSidebar
            trainingCenter={session.trainingCenter}
            instructors={session.instructors}
            instructorsLoaded={session.instructorsLoaded}
            fullWidth={isCompact}
          />
        </BodyContainer>
      </View>

      {/* ── Modal de datos ambientales ── */}
      <Modal
        visible={showAmbientalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAmbientalModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowAmbientalModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()} {...a11yModal('Datos ambientales')}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIcon} {...a11yDecorative}>
                <Ionicons name="partly-sunny-outline" size={22} color={theme.primaryText} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle} accessibilityRole="header">Datos Ambientales</Text>
                <Text style={styles.sheetSub}>
                  Registra las condiciones del entorno antes de iniciar la práctica.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAmbientalModal(false)}
                hitSlop={ICON_HIT_SLOP}
                {...a11yButton('Cerrar')}
              >
                <Ionicons name="close" size={22} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.fields}>
              {AMBIENTAL_FIELDS.map((f) => {
                const hasError = ambErrors && !ambiental[f.key];
                return (
                  <View key={f.key} style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, hasError && styles.fieldLabelErr]} nativeID={`amb-${f.key}`}>
                      {f.label}
                      {hasError && <Text style={styles.required}> — obligatorio</Text>}
                    </Text>
                    <TextInput
                      style={[styles.input, hasError && styles.inputErr]}
                      value={ambiental[f.key]}
                      onChangeText={(v) => updateAmb(f.key, v)}
                      keyboardType="decimal-pad"
                      placeholder={f.placeholder}
                      placeholderTextColor={theme.textPlaceholder}
                      accessibilityLabel={f.label}
                      accessibilityLabelledBy={`amb-${f.key}`}
                      accessibilityState={{ invalid: hasError }}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAmbientalModal(false)}
                activeOpacity={0.8}
                {...a11yButton('Cancelar')}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmarAmbiental}
                activeOpacity={0.85}
                {...a11yButton('Iniciar capacitación')}
              >
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={theme.onPrimarySolid}
                  {...a11yDecorative}
                />
                <Text style={styles.confirmBtnText}>Iniciar Capacitación</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function StatItem({ icon, label, value, styles, theme }) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconBox} {...a11yDecorative}>
        <Ionicons name={icon} size={18} color={theme.icon} />
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const makeStyles = (t, isCompact) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    content: { flex: 1, padding: 14, gap: 12 },

    topBar: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', flexWrap: 'wrap', gap: 10,
    },
    topTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    topTitle: { fontSize: 18, fontWeight: '800', color: t.textPrimary },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, minHeight: MIN_TOUCH_SIZE, borderRadius: 10,
      backgroundColor: t.card, borderWidth: 1.5, borderColor: t.border,
    },
    backBtnText: { fontSize: 14, fontWeight: '600', color: t.textPrimary },

    body: { flex: 1, flexDirection: isCompact ? 'column' : 'row', gap: 14 },
    bodyCompactContent: { gap: 14, paddingBottom: 24 },
    // "flex: 0" en RN-Web fija flexBasis:0% (colapsa a 0px): hay que cancelar el flex
    // heredado con las props largas y flexBasis 'auto' para medir por contenido.
    leftPanel: isCompact
      ? { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', gap: 12 }
      : { flex: 1, gap: 12 },

    card: {
      backgroundColor: t.card, borderRadius: 18, padding: 18, gap: 12,
      borderWidth: 1, borderColor: t.border,
      shadowColor: t.shadowColor, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity, shadowRadius: 6, elevation: 2,
    },
    overviewCard: { flex: 1 },
    sessionTitle: { fontSize: 20, fontWeight: '800', color: t.textPrimary },
    sessionDesc: { fontSize: 14, color: t.textSecondary, lineHeight: 20 },
    statsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statIconBox: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: t.pill, alignItems: 'center', justifyContent: 'center',
    },
    statLabel: { fontSize: 11, fontWeight: '700', color: t.textMuted, letterSpacing: 0.5 },
    statValue: { fontSize: 14, fontWeight: '700', color: t.textPrimary, marginTop: 1 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: t.textPrimary },
    overviewScroll: { flex: 1 },
    overviewScrollContent: { gap: 10, paddingBottom: 8 },
    note: { fontSize: 14, color: t.textSecondary, lineHeight: 20 },
    noteBold: { fontWeight: '700', color: t.textPrimary },

    statusCard: {
      backgroundColor: t.card, borderRadius: 18, padding: 18, gap: 12,
      borderWidth: 1, borderColor: t.border, overflow: 'hidden',
      shadowColor: t.shadowColor, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity, shadowRadius: 6, elevation: 2,
    },
    watermark: { position: 'absolute', right: 12, bottom: -10 },
    watermarkIcon: { opacity: 0.08 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    statusLabel: { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    actionBtn: {
      borderRadius: 12, minHeight: MIN_TOUCH_SIZE + 6,
      alignItems: 'center', justifyContent: 'center',
    },
    actionBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

    // ── Modal ──
    overlay: {
      flex: 1, backgroundColor: t.overlay,
      alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    sheet: {
      width: '100%', maxWidth: 460, backgroundColor: t.card, borderRadius: 20,
      padding: 24, gap: 20, borderWidth: 1, borderColor: t.border,
      shadowColor: t.shadowColor, shadowOpacity: t.shadowOpacity * 3,
      shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 12,
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    sheetHeaderText: { flex: 1 },
    sheetIcon: {
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: t.primarySoft, alignItems: 'center', justifyContent: 'center',
    },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: t.textPrimary },
    sheetSub: { fontSize: 13, color: t.textSecondary, marginTop: 3, lineHeight: 18 },
    fields: { gap: 16 },
    fieldWrap: { gap: 6 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    fieldLabelErr: { color: t.status.danger.fg },
    required: { fontWeight: '400', fontSize: 13 },
    input: {
      borderWidth: 1, borderColor: t.border, borderRadius: 10,
      paddingHorizontal: 14, minHeight: MIN_TOUCH_SIZE,
      fontSize: 15, color: t.textPrimary, fontWeight: '600',
      backgroundColor: t.cardAlt,
    },
    inputErr: { borderColor: t.status.danger.border, backgroundColor: t.status.danger.bg, borderWidth: 1.5 },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' },
    cancelBtn: {
      paddingHorizontal: 22, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
      borderRadius: 10, borderWidth: 1.5, borderColor: t.borderStrong,
    },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: t.textSecondary },
    confirmBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.primarySolid, borderRadius: 10,
      paddingHorizontal: 22, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
    },
    confirmBtnText: { fontSize: 15, fontWeight: '700', color: t.onPrimarySolid },
  });
