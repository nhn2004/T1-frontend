import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, Pressable, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, ROLES } from '../../constants';
import AgendaTimeline from './components/AgendaTimeline';
import TrainingCenterSidebar from './components/TrainingCenterSidebar';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import { sessionService } from '../../services';
import { traineeService } from '../../services/traineeService';
import api from '../../services/api';

import { STATUS_DISPLAY } from './__mocks__/sessionDetailData';

const EMPTY_SESSION = {
  id:               null,
  title:            '',
  description:      '',
  date:             '—',
  time:             '—',
  capacityCount:    0,
  status:           'PLANNED',
  note:             '',
  agenda:           [],
  trainingCenter:   { name: '—', address: '—', specificLocation: '', imageUri: null },
  instructors:      [],
};

// El aspirante no administra la sesión (eso es del instructor) — solo puede consultarla
// y, una vez finalizada, ver sus propios resultados. Evita mandarlo a una pantalla de
// gestión de asistentes que ni siquiera existe en su navegador.
const TRAINEE_DISPLAY = {
  PLANNED: {
    badges: STATUS_DISPLAY.PLANNED.badges,
    btnLabelKey: 'instructorWillStart',
    btnBg: '#9AA3B0',
    btnDisabled: true,
  },
  ACTIVE: {
    badges: STATUS_DISPLAY.ACTIVE.badges,
    btnLabelKey: 'inProgressWait',
    btnBg: '#9AA3B0',
    btnDisabled: true,
  },
  COMPLETED: {
    badges: STATUS_DISPLAY.COMPLETED.badges,
    btnLabelKey: 'viewMyResults',
    btnBg: '#2E7D32',
    btnDisabled: false,
  },
  CANCELLED: STATUS_DISPLAY.CANCELLED,
};

const EMPTY_AMBIENTAL = {
  presionAtmosferica: '',
  temperaturaAmbiente: '',
  humedadRelativa: '',
};

export default function SessionDetailScreen({ navigation, route, Sidebar, sessionId, onBack }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { role, user } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 980;
  const isTrainee = role === ROLES.FIREFIGHTER_TRAINEE;

  const id = sessionId ?? route?.params?.id;
  const [session, setSession] = useState({ ...EMPTY_SESSION });
  const [syncing, setSyncing] = useState(false);
  const myParticipantIdRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    setSyncing(true);
    sessionService.getById(id)
      .then(data => setSession({ ...EMPTY_SESSION, ...data }))
      .catch(() => {})
      .finally(() => setSyncing(false));
  }, [id]);

  // Resolver sessionParticipantId del trainee logueado para esta sesión
  useEffect(() => {
    if (!isTrainee || !id || !user?.userId) return;
    traineeService.getAll()
      .then(trainees => {
        const me = trainees.find(t => t.userId === user.userId);
        if (!me) return;
        return api.get('/session-participants').then(({ data: wrapper }) => {
          const mine = (wrapper.data ?? []).find(p =>
            p.trainingSessionId === id && p.traineeFirefighterId === me.id
          );
          if (mine) myParticipantIdRef.current = mine.sessionParticipantId;
        });
      })
      .catch(() => {});
  }, [isTrainee, id, user]);

  const display = isTrainee
    ? (TRAINEE_DISPLAY[session.status] ?? TRAINEE_DISPLAY.PLANNED)
    : (STATUS_DISPLAY[session.status] ?? STATUS_DISPLAY.PLANNED);

  const [showAmbientalModal, setShowAmbientalModal] = useState(false);
  const [ambiental, setAmbiental] = useState(EMPTY_AMBIENTAL);
  const [ambErrors, setAmbErrors]   = useState(false);

  const updateAmb = (field, val) => setAmbiental(prev => ({ ...prev, [field]: val }));

  const handleAction = useCallback(() => {
    if (display.btnDisabled) return;

    if (isTrainee) {
      navigation?.navigate('ResultadosBombero', {
        bomberoId:   myParticipantIdRef.current,
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
  }, [display, isTrainee, navigation, session, user]);

  function handleConfirmarAmbiental() {
    const { presionAtmosferica, temperaturaAmbiente, humedadRelativa } = ambiental;
    if (!presionAtmosferica || !temperaturaAmbiente || !humedadRelativa) {
      setAmbErrors(true);
      return;
    }
    setShowAmbientalModal(false);
    navigateToPersonas();
  }

  function navigateToPersonas() {
    navigation?.navigate('PersonasSesiones', {
      sessionId:   session.id,
      sessionName: session.title,
      ambiental,
    });
  }

  const BodyContainer = isCompact ? ScrollView : View;

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else navigation?.goBack();
  }, [onBack, navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      {Sidebar && <Sidebar />}

      <View style={styles.content}>

        {/* ── Header bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topTitleRow}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={[styles.topTitle, { color: theme.textPrimary }]}>{t.sessionDetail.pageTitle}</Text>
            {syncing && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />}
          </View>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t.sessionDetail.back}
          >
            <Ionicons name="arrow-back" size={16} color={theme.textPrimary} />
            <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>{t.sessionDetail.back}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Body ──
            En tablet/escritorio ocupa toda la altura sin scroll de página (solo la
            agenda interna scrollea). En teléfono se apila en columna y todo el body
            scrollea, para que nada quede recortado en pantallas chicas. */}
        <BodyContainer
          style={[styles.body, isCompact && styles.bodyCompact]}
          {...(isCompact ? { contentContainerStyle: styles.bodyCompactContent, showsVerticalScrollIndicator: false } : {})}
        >

          {/* LEFT PANEL */}
          <View style={[styles.leftPanel, isCompact && styles.leftPanelCompact]}>

            {/* Summary card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.sessionTitle, { color: theme.textPrimary }]}>{session.title}</Text>
              <Text style={[styles.sessionDesc, { color: theme.textSecondary }]}>{session.description}</Text>
              <View style={styles.statsRow}>
                <StatItem icon="calendar-outline" label={t.sessionDetail.date}     value={session.date}     theme={theme} />
                <StatItem icon="time-outline"     label={t.sessionDetail.time}     value={session.time}     theme={theme} />
                <StatItem icon="people-outline"   label={t.sessionDetail.capacity} value={`${session.capacityCount} ${t.sessions.applicants}`} theme={theme} />
              </View>
            </View>

            {/* Overview + agenda */}
            <View style={[styles.card, !isCompact && styles.overviewCard, { backgroundColor: theme.card }]}>
              {/* Header fijo — nunca scrollea */}
              <View style={styles.sectionHeader}>
                <Ionicons name="layers-outline" size={18} color={theme.textPrimary} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t.sessionDetail.overview}</Text>
              </View>

              {/* En tablet/escritorio esta sección scrollea internamente; en teléfono
                  se deja crecer porque ya scrollea la página completa. */}
              <ScrollView
                style={!isCompact && styles.overviewScroll}
                scrollEnabled={!isCompact}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.overviewScrollContent}
              >
                <Text style={[styles.note, { color: theme.textSecondary }]}>
                  <Text style={[styles.noteBold, { color: theme.textPrimary }]}>{t.sessionDetail.note} </Text>
                  {session.note}
                </Text>
                <AgendaTimeline items={session.agenda} />
              </ScrollView>
            </View>

            {/* ── Status card with large watermark icon ── */}
            <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
              {/* Watermark icon in the background */}
              <View style={styles.watermark} pointerEvents="none">
                <Ionicons name="flame" size={90} color="#E85D27" style={{ opacity: 0.06 }} />
              </View>
              <View style={styles.statusRow}>
                <Ionicons name="layers-outline" size={16} color={theme.textPrimary} />
                <Text style={[styles.statusLabel, { color: theme.textPrimary }]}>{t.sessionDetail.status}</Text>
                {(display.badges || []).map((b) => (
                  <View key={b.labelKey} style={[styles.badge, { backgroundColor: b.bg }]}>
                    <Text style={styles.badgeText}>{t.common.status[b.labelKey]}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: display.btnBg },
                  display.btnDisabled && styles.actionBtnDisabled,
                ]}
                onPress={handleAction}
                activeOpacity={display.btnDisabled ? 1 : 0.85}
                disabled={display.btnDisabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: display.btnDisabled }}
              >
                <Text style={[
                  styles.actionBtnText,
                  display.btnDisabled && styles.actionBtnTextDisabled,
                ]}>
                  {t.sessionDetail[display.btnLabelKey]}
                </Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* RIGHT SIDEBAR */}
          <TrainingCenterSidebar
            trainingCenter={session.trainingCenter}
            instructors={session.instructors}
            fullWidth={isCompact}
          />

        </BodyContainer>
      </View>

      {/* ── Modal Datos Ambientales ── */}
      <Modal visible={showAmbientalModal} transparent animationType="fade">
        <Pressable style={m.overlay} onPress={() => setShowAmbientalModal(false)}>
          <Pressable style={m.sheet} onPress={e => e.stopPropagation()}>

            <View style={m.sheetHeader}>
              <View style={m.sheetIcon}>
                <Ionicons name="partly-sunny-outline" size={22} color="#E85D27" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={m.sheetTitle}>Datos Ambientales</Text>
                <Text style={m.sheetSub}>Registra las condiciones del entorno antes de iniciar la práctica.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAmbientalModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#697282" />
              </TouchableOpacity>
            </View>

            <View style={m.fields}>

              <View style={m.fieldWrap}>
                <Text style={[m.fieldLabel, ambErrors && !ambiental.presionAtmosferica && m.fieldLabelErr]}>
                  Presión atmosférica (hPa)
                  {ambErrors && !ambiental.presionAtmosferica && <Text style={m.required}> — obligatorio</Text>}
                </Text>
                <TextInput
                  style={[m.input, ambErrors && !ambiental.presionAtmosferica && m.inputErr]}
                  value={ambiental.presionAtmosferica}
                  onChangeText={v => updateAmb('presionAtmosferica', v)}
                  keyboardType="number-pad"
                  placeholder="ej. 1013"
                  placeholderTextColor="#B0B7C3"
                />
              </View>

              <View style={m.fieldWrap}>
                <Text style={[m.fieldLabel, ambErrors && !ambiental.temperaturaAmbiente && m.fieldLabelErr]}>
                  Temperatura ambiente (°C)
                  {ambErrors && !ambiental.temperaturaAmbiente && <Text style={m.required}> — obligatorio</Text>}
                </Text>
                <TextInput
                  style={[m.input, ambErrors && !ambiental.temperaturaAmbiente && m.inputErr]}
                  value={ambiental.temperaturaAmbiente}
                  onChangeText={v => updateAmb('temperaturaAmbiente', v)}
                  keyboardType="number-pad"
                  placeholder="ej. 24"
                  placeholderTextColor="#B0B7C3"
                />
              </View>

              <View style={m.fieldWrap}>
                <Text style={[m.fieldLabel, ambErrors && !ambiental.humedadRelativa && m.fieldLabelErr]}>
                  Humedad relativa (%)
                  {ambErrors && !ambiental.humedadRelativa && <Text style={m.required}> — obligatorio</Text>}
                </Text>
                <TextInput
                  style={[m.input, ambErrors && !ambiental.humedadRelativa && m.inputErr]}
                  value={ambiental.humedadRelativa}
                  onChangeText={v => updateAmb('humedadRelativa', v)}
                  keyboardType="number-pad"
                  placeholder="ej. 65"
                  placeholderTextColor="#B0B7C3"
                />
              </View>

            </View>

            <View style={m.footer}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setShowAmbientalModal(false)} activeOpacity={0.8}>
                <Text style={m.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={m.confirmBtn} onPress={handleConfirmarAmbiental} activeOpacity={0.85}>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
                <Text style={m.confirmBtnText}>Iniciar Capacitación</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ── StatItem ──────────────────────────────────────────────────────────────────

function StatItem({ icon, label, value, theme }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconBox, { backgroundColor: theme.pill }]}>
        <Ionicons name={icon} size={18} color={theme.textSecondary} />
      </View>
      <View>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  content: { flex: 1, padding: 14, gap: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#2E2E2E' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },
  body: { flex: 1, flexDirection: 'row', gap: 14 },
  bodyCompact: { flexDirection: 'column' },
  bodyCompactContent: { gap: 14, paddingBottom: 24 },
  leftPanel: { flex: 1, gap: 12 },
  // "flex: 0" en RN-Web fija flexBasis:0% (colapsa a 0px) — hay que cancelar el
  // flex heredado con las props largas y flexBasis "auto" para que mida por contenido.
  leftPanelCompact: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  overviewCard: { flex: 1 },
  sessionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  sessionDesc: { fontSize: 12, color: '#495565', lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#9AA3B0', letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginTop: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2E2E2E' },
  overviewScroll: { flex: 1 },
  overviewScrollContent: { gap: 10, paddingBottom: 8 },
  note: { fontSize: 12, color: '#495565', lineHeight: 18 },
  noteBold: { fontWeight: '700', color: '#2E2E2E' },
  statusCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 12,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  watermark: { position: 'absolute', right: 12, bottom: -10, pointerEvents: 'none' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#2E2E2E' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  actionBtnDisabled: { backgroundColor: '#E0E0E0' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  actionBtnTextDisabled: { color: '#A8A8A8' },
});

const m = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheet: {
    width: 460, backgroundColor: '#fff', borderRadius: 20,
    padding: 28, gap: 22,
    shadowColor: '#000', shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 12,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  sheetIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFF0EA', alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  sheetSub:   { fontSize: 12, color: '#697282', marginTop: 3, lineHeight: 18 },
  fields:     { gap: 16 },
  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#495565' },
  fieldLabelErr: { color: '#D83B35' },
  required: { fontWeight: '400', fontSize: 12 },
  input: {
    borderWidth: 1, borderColor: '#E8EBF0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#2E2E2E', fontWeight: '600',
    backgroundColor: '#F9FAFB',
  },
  inputErr: { borderColor: '#D83B35', backgroundColor: '#FFF5F5', borderWidth: 1.5 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: {
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D0D5DD',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#697282' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E85D27', borderRadius: 10,
    paddingHorizontal: 22, paddingVertical: 12,
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
