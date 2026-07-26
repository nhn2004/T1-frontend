import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import { a11yButton, a11yDecorative, a11yGroup, MIN_TOUCH_SIZE } from '../../../constants/a11y';

/**
 * Tarjeta de una solicitud pendiente de validación.
 *
 * Jerarquía deliberada, de arriba abajo:
 *   1. QUIÉN  — avatar + nombre real + profesión
 *   2. QUÉ    — sesión a la que se le invita, con fecha
 *   3. CUÁNDO — antigüedad de la solicitud y vencimiento
 *   4. ACCIÓN — aprobar / rechazar
 *
 * La versión anterior mostraba el correo como si fuera el nombre y rellenaba el
 * resto con texto fijo («Invitación de sesión · —», «Jefe a cargo: Admin SMAB»),
 * dejando fuera la sesión, que es justo el dato que permite decidir.
 */
export default function ValidationCard({ item, onApprove, onReject, onReview, busy, compact }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme, compact), [theme, compact]);

  // El acento y el aviso de vencimiento marcan la urgencia; el resto de la tarjeta
  // se mantiene en superficie neutra para que una cola larga no sature la vista.
  const tone = item.isUrgent ? theme.status.danger : theme.status.warning;

  const initials = (item.name || '?')
    .trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join('') || '?';

  const expiryLabel = item.expiresInDays === null ? null
    : item.expiresInDays < 0 ? 'Vencida'
    : item.expiresInDays === 0 ? 'Vence hoy'
    : item.expiresInDays === 1 ? 'Vence mañana'
    : `Vence en ${item.expiresInDays} días`;

  const spoken = [
    item.name,
    item.profession,
    item.sessionTitle ? `para ${item.sessionTitle}` : null,
    item.sessionDate,
    `solicitada ${item.requestedAgo}`,
    expiryLabel,
  ].filter(Boolean).join(', ');

  return (
    <View style={styles.card} {...a11yGroup(spoken)}>
      <View style={styles.content}>
        {/* ── Quién ── */}
        <View style={styles.personRow}>
          <View style={styles.avatar} {...a11yDecorative}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.personText}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          </View>

          {!!item.profession && (
            <View style={styles.professionChip}>
              <Text style={styles.professionText} numberOfLines={1}>{item.profession}</Text>
            </View>
          )}
        </View>

        {/* ── Qué ── */}
        <View style={styles.sessionBox}>
          <Ionicons name="flame-outline" size={15} color={theme.primaryText} {...a11yDecorative} />
          <View style={styles.sessionText}>
            <Text style={styles.sessionTitle} numberOfLines={2}>
              {item.sessionTitle ?? 'Sesión no disponible'}
            </Text>
            {(item.sessionDate || item.sessionTime) && (
              <Text style={styles.sessionMeta}>
                {[item.sessionDate, item.sessionTime].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        </View>

        {/* ── Cuándo ── */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={theme.iconMuted} {...a11yDecorative} />
            <Text style={styles.metaText}>Solicitada {item.requestedAgo}</Text>
          </View>
          {!!expiryLabel && (
            <View style={[styles.expiryChip, { backgroundColor: tone.bg }]}>
              <Text style={[styles.expiryText, { color: tone.fg }]}>{expiryLabel}</Text>
            </View>
          )}
        </View>

        {/* ── Acción ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.approveBtn, busy && styles.btnBusy]}
            onPress={() => onApprove(item.id)}
            activeOpacity={0.85}
            disabled={busy}
            {...a11yButton(`Aprobar la solicitud de ${item.name}`, { disabled: busy, busy })}
          >
            <Ionicons
              name="checkmark"
              size={16}
              color={theme.status.success.onSolid}
              {...a11yDecorative}
            />
            <Text style={styles.approveText}>Aprobar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectBtn, busy && styles.btnBusy]}
            onPress={() => (onReject ? onReject(item.id) : onReview(item.id))}
            activeOpacity={0.85}
            disabled={busy}
            {...a11yButton(`Rechazar la solicitud de ${item.name}`, { disabled: busy })}
          >
            <Ionicons
              name="close"
              size={16}
              color={theme.status.danger.fg}
              {...a11yDecorative}
            />
            <Text style={styles.rejectText}>Rechazar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => onReview(item.id)}
            activeOpacity={0.7}
            disabled={busy}
            {...a11yButton(`Ver detalle de la solicitud de ${item.name}`, { disabled: busy })}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={theme.icon}
              {...a11yDecorative}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (t, compact) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden',
      shadowColor: t.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity,
      shadowRadius: 6,
      elevation: 2,
    },
    // La urgencia se comunica solo con el chip de vencimiento; la tarjeta se mantiene
    // limpia y uniforme.
    content: { padding: 14, gap: 12 },

    personRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: t.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 14, fontWeight: '800', color: t.onPrimarySoft },
    personText: { flex: 1, minWidth: 0 },
    name: { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    email: { fontSize: 12, color: t.textMuted, marginTop: 1 },
    professionChip: {
      backgroundColor: t.pill,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      maxWidth: compact ? 110 : 150,
    },
    professionText: { fontSize: 11, fontWeight: '700', color: t.textSecondary },

    sessionBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: t.cardAlt,
      borderRadius: 10,
      padding: 10,
    },
    sessionText: { flex: 1, minWidth: 0 },
    sessionTitle: { fontSize: 14, fontWeight: '600', color: t.textPrimary, lineHeight: 19 },
    sessionMeta: { fontSize: 12, color: t.textMuted, marginTop: 2 },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
    metaText: { fontSize: 12, color: t.textMuted },
    expiryChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    expiryText: { fontSize: 11, fontWeight: '800' },

    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btnBusy: { opacity: 0.6 },
    approveBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: MIN_TOUCH_SIZE - 4,
      borderRadius: 10,
      backgroundColor: t.status.success.solid,
    },
    approveText: { fontSize: 14, fontWeight: '700', color: t.status.success.onSolid },
    rejectBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: MIN_TOUCH_SIZE - 4,
      borderRadius: 10,
      backgroundColor: t.card,
      borderWidth: 1.5,
      borderColor: t.status.danger.border,
    },
    rejectText: { fontSize: 14, fontWeight: '700', color: t.status.danger.fg },
    detailBtn: {
      width: MIN_TOUCH_SIZE - 4,
      minHeight: MIN_TOUCH_SIZE - 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
