import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SESSION_STATUS } from '../__mocks__/sessionsData';

const STATUS_CONFIG = {
  [SESSION_STATUS.PLANNED]: {
    badges:      [{ label: 'Pendiente',   bg: '#F57C00' }],
    btnBg:       '#E85D27',
    btnOpacity:  1,
  },
  [SESSION_STATUS.ACTIVE]: {
    badges:      [
      { label: 'Pendiente',   bg: '#F57C00' },
      { label: 'En Progreso', bg: '#2E7D32' },
    ],
    btnBg:       '#E85D27',
    btnOpacity:  1,
  },
  [SESSION_STATUS.COMPLETED]: {
    badges:      [{ label: 'Realizado',  bg: '#2E7D32' }],
    btnBg:       '#2E7D32',
    btnOpacity:  1,
  },
  [SESSION_STATUS.CANCELLED]: {
    badges:      [{ label: 'Cancelado',  bg: '#9E9E9E' }],
    btnBg:       '#9E9E9E',
    btnOpacity:  0.6,
  },
};

import { useAuth } from '../../../hooks';
import { ROLES } from '../../../constants';

export default function SessionCard({ session, onViewDetails, cardWidth, cardHeight }) {
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG[SESSION_STATUS.PLANNED];
  const { role } = useAuth();
  const isTrainee = role === ROLES.FIREFIGHTER_TRAINEE;

  const isBtnDisabled = isTrainee && (session.status === SESSION_STATUS.PLANNED || session.status === SESSION_STATUS.CANCELLED);

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
        <View style={styles.badgeStack}>
          {cfg.badges.map((b) => (
            <View key={b.label} style={[styles.badge, { backgroundColor: b.bg }]}>
              <Text style={styles.badgeText}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Details — flex:1 para que empujen el botón hacia abajo */}
      <View style={styles.details}>
        <DetailRow icon="calendar-outline"  label={session.date} />
        <DetailRow icon="time-outline"      label={session.time} />
        <DetailRow icon="clipboard-outline" label={session.type} />
      </View>

      {/* Botón siempre al fondo de la card */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: isBtnDisabled ? '#F4F5F7' : cfg.btnBg, opacity: isBtnDisabled ? 1 : cfg.btnOpacity, borderColor: isBtnDisabled ? '#D6DADF' : 'transparent', borderWidth: isBtnDisabled ? 1 : 0 }]}
        onPress={() => onViewDetails(session.id)}
        activeOpacity={0.8}
        disabled={isBtnDisabled}
      >
        <Text style={[styles.btnText, isBtnDisabled && { color: '#8E9399' }]}>
          {isTrainee ? 'Ver Resultados' : (session.status === SESSION_STATUS.COMPLETED ? 'Ver Reportes' : 'Ver Detalles')}
        </Text>
        <Ionicons name="arrow-forward" size={12} color={isBtnDisabled ? "#8E9399" : "#fff"} />
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
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F57C00',
    paddingTop: '1%',
    paddingHorizontal: '3%',
    paddingBottom: '4%',
    gap: 4,
    shadowColor: '#F57C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBlock: { flex: 1, marginRight: 4 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  applicants: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
    marginTop: 2,
  },
  badgeStack: {
    gap: 3,
    alignItems: 'flex-end',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  details: {
    borderTopWidth: 1,
    borderTopColor: '#FFD6A7',
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
