import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import { a11yButton, a11yDecorative, MIN_TOUCH_SIZE } from '../../../constants/a11y';

export default function ValidationCard({ item, onApprove, onReview, busy }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.doctorName}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.evaluationType} · {item.sessionCode}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Pendiente</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="shield-outline" size={14} color={theme.textMuted} {...a11yDecorative} />
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>JEFE A CARGO</Text>
          <Text style={styles.infoValue}>{item.requestedBy.name}</Text>
          <Text style={styles.infoRole}>{item.requestedBy.role}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={14} color={theme.textMuted} {...a11yDecorative} />
        <Text style={styles.timeText}>{item.receivedAgo}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.approveBtn, busy && styles.btnDisabled]}
          onPress={() => onApprove(item.id)}
          activeOpacity={0.8}
          disabled={busy}
          {...a11yButton(`Aprobar solicitud de ${item.doctorName}`, { disabled: busy, busy })}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={theme.status.success.onSolid}
            {...a11yDecorative}
          />
          <Text style={styles.approveBtnText}>Aprobar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reviewBtn, busy && styles.btnDisabled]}
          onPress={() => onReview(item.id)}
          activeOpacity={0.8}
          disabled={busy}
          {...a11yButton(`Revisar solicitud de ${item.doctorName}`, { disabled: busy })}
        >
          <Ionicons
            name="eye-outline"
            size={16}
            color={theme.status.danger.fg}
            {...a11yDecorative}
          />
          <Text style={styles.reviewBtnText}>Revisar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.status.warning.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.status.warning.border,
      padding: 12,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    doctorInfo: { flex: 1 },
    doctorName: { fontSize: 14, fontWeight: '700', color: t.textPrimary },
    subtitle: { fontSize: 12, color: t.textSecondary, marginTop: 2 },

    badge: {
      backgroundColor: t.status.warning.solid,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: { color: t.status.warning.onSolid, fontSize: 11, fontWeight: '700' },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 10, fontWeight: '700', color: t.textMuted, letterSpacing: 0.5 },
    infoValue: { fontSize: 13, fontWeight: '600', color: t.textPrimary },
    infoRole: { fontSize: 12, color: t.textSecondary },

    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12, color: t.textSecondary },

    actions: { flexDirection: 'row', gap: 8 },
    btnDisabled: { opacity: 0.5 },
    approveBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: t.status.success.solid,
      borderRadius: 8,
      minHeight: MIN_TOUCH_SIZE,
    },
    approveBtnText: { color: t.status.success.onSolid, fontSize: 13, fontWeight: '700' },
    reviewBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: t.card,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: t.status.danger.border,
      minHeight: MIN_TOUCH_SIZE,
    },
    reviewBtnText: { color: t.status.danger.fg, fontSize: 13, fontWeight: '700' },
  });
