import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SESSION_STATUS } from '../__mocks__/sessionsData';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// "labelKey" se resuelve contra t.common.status — el texto del badge es chrome
// de interfaz, así que responde al idioma elegido en Configuración.
const STATUS_CONFIG = {
  [SESSION_STATUS.PLANNED]: {
    badges:      [{ labelKey: 'pending',   bg: '#F57C00' }],
    btnBg:       '#E85D27',
    accent:      '#F57C00',
    btnOpacity:  1,
  },
  [SESSION_STATUS.ACTIVE]: {
    badges:      [
      { labelKey: 'pending',   bg: '#F57C00' },
      { labelKey: 'inProgress', bg: '#2E7D32' },
    ],
    btnBg:       '#E85D27',
    accent:      '#2E7D32',
    btnOpacity:  1,
  },
  [SESSION_STATUS.COMPLETED]: {
    badges:      [{ labelKey: 'completed',  bg: '#2E7D32' }],
    btnBg:       '#2E7D32',
    accent:      '#2E7D32',
    btnOpacity:  1,
  },
  [SESSION_STATUS.CANCELLED]: {
    badges:      [{ labelKey: 'cancelled',  bg: '#9E9E9E' }],
    btnBg:       '#9E9E9E',
    accent:      '#9E9E9E',
    btnOpacity:  0.6,
  },
};

export default function SessionCard({ session, onViewDetails, cardWidth, cardHeight }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG[SESSION_STATUS.PLANNED];
  const { badge } = cfg;
  const { role } = useAuth();
  const isTrainee = role === ROLES.FIREFIGHTER_TRAINEE;
  const isBtnDisabled = isTrainee && (
    session.status === SESSION_STATUS.PLANNED ||
    session.status === SESSION_STATUS.CANCELLED
  );

  const btnLabel = isTrainee
    ? 'Ver Resultados'
    : session.status === SESSION_STATUS.COMPLETED
      ? 'Ver Reportes'
      : 'Ver Detalles';

  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.card, borderColor: cfg.accent, shadowColor: cfg.accent },
      { width: cardWidth },
      cardHeight ? { height: cardHeight } : null,
    ]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>{session.title}</Text>
          <Text style={[styles.applicants, { color: cfg.accent }]}>{session.applicants} {t.sessions.applicants}</Text>
        </View>
        <View style={styles.badgeStack}>
          {cfg.badges.map((b) => (
            <View key={b.labelKey} style={[styles.badge, { backgroundColor: b.bg }]}>
              <Text style={styles.badgeText}>{t.common.status[b.labelKey]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Details — flex:1 para que empujen el botón hacia abajo */}
      <View style={[styles.details, { borderTopColor: theme.divider }]}>
        <DetailRow icon="calendar-outline"  label={session.date} color={theme.textSecondary} />
        <DetailRow icon="time-outline"      label={session.time} color={theme.textSecondary} />
        <DetailRow icon="clipboard-outline" label={session.type} color={theme.textSecondary} />
      </View>

      {/* Botón */}
      <TouchableOpacity
        style={[
          styles.btn,
          isBtnDisabled
            ? { backgroundColor: '#F4F5F7', borderWidth: 1, borderColor: '#D6DADF' }
            : { backgroundColor: cfg.btnBg, opacity: cfg.btnOpacity },
        ]}
        onPress={() => onViewDetails(session.id)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${t.sessions.viewDetails} — ${session.title}`}
      >
        <Text style={styles.btnText}>{t.sessions.viewDetails}</Text>
        <Ionicons name="arrow-forward" size={12} color="#fff" />
      </TouchableOpacity>

    </View>
  );
}

function DetailRow({ icon, label, color }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.detailText, { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingTop: '1%',
    paddingHorizontal: '3%',
    paddingBottom: '4%',
    gap: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBlock: { flex: 1, marginRight: 6 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  applicants: {
    fontSize: 11,
    color: '#9AA3B0',
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  details: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: '1.5%',
    gap: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 11,
    color: '#495565',
    flex: 1,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: '2%',
    marginTop: 'auto',
    marginBottom: 0,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
