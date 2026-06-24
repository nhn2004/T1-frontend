import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, ROLES } from '../../constants';
import AgendaTimeline from './components/AgendaTimeline';
import TrainingCenterSidebar from './components/TrainingCenterSidebar';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import { sessionService } from '../../services';

import {
  BASE_DETAIL,
  STATUS_DISPLAY,
} from './__mocks__/sessionDetailData';

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

export default function SessionDetailScreen({ navigation, route, Sidebar, sessionId, onBack }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { role, user, token } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 980;
  const isTrainee = role === ROLES.FIREFIGHTER_TRAINEE;

  const id = sessionId ?? route?.params?.id;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    sessionService.getById(id)
      .then(data => setSession({ ...BASE_DETAIL, ...data }))
      .catch(() => setSession({ ...BASE_DETAIL, title: 'Sesión', status: 'PLANNED', date: '—', time: '—' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !session) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const display = isTrainee
    ? (TRAINEE_DISPLAY[session.status] ?? TRAINEE_DISPLAY.PLANNED)
    : (STATUS_DISPLAY[session.status] ?? STATUS_DISPLAY.PLANNED);

  const handleAction = useCallback(() => {
    if (display.btnDisabled) return;

    if (isTrainee) {
      // Pendiente de backend: se usa el token como bomberoId placeholder.
      navigation?.navigate('ResultadosBombero', {
        bomberoId: token,
        bomberoName: user?.name,
      });
      return;
    }

    navigation?.navigate('PersonasSesiones', { sessionId: session.id });
  }, [display, isTrainee, navigation, session.id, token, user]);

  const BodyContainer = isCompact ? ScrollView : View;

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();                    // navegación temporal App.js
    } else {
      navigation?.goBack();        // navegación real react-navigation
    }
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

              {/* Estado label + badges */}
              <View style={styles.statusRow}>
                <Ionicons name="layers-outline" size={16} color={theme.textPrimary} />
                <Text style={[styles.statusLabel, { color: theme.textPrimary }]}>{t.sessionDetail.status}</Text>
                {(display.badges || []).map((b) => (
                  <View key={b.labelKey} style={[styles.badge, { backgroundColor: b.bg }]}>
                    <Text style={styles.badgeText}>{t.common.status[b.labelKey]}</Text>
                  </View>
                ))}
              </View>

              {/* Full-width action button */}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  content: { flex: 1, padding: 14, gap: 12 },

  // Header
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#2E2E2E' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },

  // Body layout
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

  // Summary
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

  // Overview
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2E2E2E' },
  overviewScroll: { flex: 1 },
  overviewScrollContent: { gap: 10, paddingBottom: 8 },
  note: { fontSize: 12, color: '#495565', lineHeight: 18 },
  noteBold: { fontWeight: '700', color: '#2E2E2E' },

  // ── Status card ──
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    overflow: 'hidden',       // para que el watermark no se salga
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  watermark: {
    position: 'absolute',
    right: 12,
    bottom: -10,
    pointerEvents: 'none',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#2E2E2E' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Action button
  actionBtn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDisabled: { backgroundColor: '#E0E0E0' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  actionBtnTextDisabled: { color: '#A8A8A8' },

});
