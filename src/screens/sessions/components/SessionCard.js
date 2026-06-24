import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SESSION_STATUS } from '../__mocks__/sessionsData';
import { useAuth } from '../../../hooks';
import { ROLES } from '../../../constants';

const STATUS_CONFIG = {
  [SESSION_STATUS.PLANNED]: {
    badge: { label: 'Pendiente', bg: '#F59E0B', icon: 'time-outline' },
    btnBg: '#E85D27',
    btnOpacity: 1,
  },
  [SESSION_STATUS.ACTIVE]: {
    badge: { label: 'En Curso', bg: '#1E88E5', icon: 'play' },
    btnBg: '#E85D27',
    btnOpacity: 1,
  },
  [SESSION_STATUS.COMPLETED]: {
    badge: { label: 'Realizado', bg: '#27AE60', icon: 'checkmark' },
    btnBg: '#E85D27',
    btnOpacity: 1,
  },
  [SESSION_STATUS.CANCELLED]: {
    badge: { label: 'Cancelado', bg: '#9E9E9E', icon: 'close' },
    btnBg: '#9E9E9E',
    btnOpacity: 0.6,
  },
};

export default function SessionCard({ session, onViewDetails, cardWidth, cardHeight }) {
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
      { width: cardWidth },
      cardHeight ? { height: cardHeight } : null,
    ]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{session.title}</Text>
          <Text style={styles.applicants}>{session.applicants} Aspirantes</Text>
        </View>

        {/* Badge estilo pill con icono */}
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Ionicons name={badge.icon} size={10} color="#FFFFFF" />
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <DetailRow icon="calendar-outline"  label={session.date} />
        <DetailRow icon="time-outline"      label={session.time} />
        <DetailRow icon="clipboard-outline" label={session.type} />
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
        activeOpacity={isBtnDisabled ? 1 : 0.8}
        disabled={isBtnDisabled}
      >
        <Text style={[styles.btnText, isBtnDisabled && { color: '#8E9399' }]}>
          {btnLabel}
        </Text>
        <Ionicons name="arrow-forward" size={12} color={isBtnDisabled ? '#8E9399' : '#fff'} />
      </TouchableOpacity>

    </View>
  );
}

function DetailRow({ icon, label }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={12} color="#697282" />
      <Text style={styles.detailText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingTop: '1%',
    paddingHorizontal: '3%',
    paddingBottom: '4%',
    gap: 4,
    shadowColor: '#000',
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
