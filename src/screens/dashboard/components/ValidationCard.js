import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ValidationCard({ item, onApprove, onReview }) {
  return (
    <View style={styles.card}>
      {/* Header: nombre doctor + badge */}
      <View style={styles.header}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.doctorName}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.evaluationType} · {item.sessionCode}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Pendiente</Text>
        </View>
      </View>

      {/* Jefe a cargo */}
      <View style={styles.infoRow}>
        <Ionicons name="shield-outline" size={12} color="#697282" />
        <View>
          <Text style={styles.infoLabel}>Jefe a cargo</Text>
          <Text style={styles.infoValue}>{item.requestedBy.name}</Text>
          <Text style={styles.infoRole}>{item.requestedBy.role}</Text>
        </View>
      </View>

      {/* Timestamp */}
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={12} color="#697282" />
        <Text style={styles.timeText}>{item.receivedAgo}</Text>
      </View>

      {/* Botones */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => onApprove(item.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
          <Text style={styles.approveBtnText}>Aprobar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => onReview(item.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={14} color="#C62828" />
          <Text style={styles.reviewBtnText}>Revisar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDE7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEEF85',
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorInfo: { flex: 1, marginRight: 8 },
  doctorName: { fontSize: 13, fontWeight: '700', color: '#2E2E2E' },
  subtitle: { fontSize: 11, color: '#495565', marginTop: 2 },
  badge: {
    backgroundColor: '#F0B100',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  infoLabel: { fontSize: 9, fontWeight: '700', color: '#9AA3B0', letterSpacing: 0.5 },
  infoValue: { fontSize: 12, fontWeight: '600', color: '#2E2E2E' },
  infoRole: { fontSize: 10, color: '#697282' },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: '#697282' },

  actions: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    backgroundColor: '#00A63E', borderRadius: 8, paddingVertical: 7,
  },
  approveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  reviewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: '#C62828', paddingVertical: 7,
  },
  reviewBtnText: { color: '#C62828', fontSize: 12, fontWeight: '700' },
});
