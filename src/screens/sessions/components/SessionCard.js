import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SESSION_STATUS } from '../sessionFilters';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { useAuth } from '../../../hooks';
import { ROLES } from '../../../constants/roles';
import { a11yButton, a11yDecorative, a11yGroup, MIN_TOUCH_SIZE } from '../../../constants/a11y';

// Tono semántico + icono por estado. El color lo resuelve el tema en ambos modos.
const STATUS_CONFIG = {
  [SESSION_STATUS.PLANNED]:   { tone: 'warning', icon: 'time-outline', labelKey: 'pending' },
  [SESSION_STATUS.ACTIVE]:    { tone: 'info',    icon: 'play',         labelKey: 'inProgress' },
  [SESSION_STATUS.COMPLETED]: { tone: 'success', icon: 'checkmark',    labelKey: 'completed' },
  [SESSION_STATUS.CANCELLED]: { tone: 'neutral', icon: 'close',        labelKey: 'cancelled' },
};

export default function SessionCard({ session, onViewDetails, cardWidth, cardHeight }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { roles } = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const cfg  = STATUS_CONFIG[session.status] ?? STATUS_CONFIG[SESSION_STATUS.PLANNED];
  const tone = theme.status[cfg.tone];
  const statusLabel = t.common.status[cfg.labelKey] ?? cfg.labelKey;

  const isTrainee = roles.includes(ROLES.FIREFIGHTER_TRAINEE);

  // El aspirante solo tiene resultados que consultar en sesiones ya realizadas.
  const isBtnDisabled = isTrainee && session.status !== SESSION_STATUS.COMPLETED;

  // La etiqueta refleja lo que la pantalla destino puede mostrar realmente: antes
  // decía "Ver Resultados" en sesiones en curso, que no tienen resultados todavía.
  const btnLabel = isTrainee
    ? (session.status === SESSION_STATUS.COMPLETED ? 'Ver Resultados' : statusLabel)
    : (session.status === SESSION_STATUS.COMPLETED ? 'Ver Reportes' : t.sessions.viewDetails);

  const spoken = [
    session.title,
    `${session.applicants} ${t.sessions.applicants}`,
    statusLabel,
    session.date,
    session.time,
    session.type,
  ].filter(Boolean).join(', ');

  return (
    <View
      style={[styles.card, { width: cardWidth }, cardHeight ? { height: cardHeight } : null]}
      {...a11yGroup(spoken)}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>{session.title}</Text>
          <Text style={styles.applicants}>
            {session.applicants} {t.sessions.applicants}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Ionicons name={cfg.icon} size={11} color={tone.fg} {...a11yDecorative} />
          <Text style={[styles.badgeText, { color: tone.fg }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <DetailRow icon="calendar-outline"  label={session.date} styles={styles} theme={theme} />
        <DetailRow icon="time-outline"      label={session.time} styles={styles} theme={theme} />
        <DetailRow icon="clipboard-outline" label={session.type} styles={styles} theme={theme} />
      </View>

      <TouchableOpacity
        style={[styles.btn, isBtnDisabled ? styles.btnDisabled : styles.btnEnabled]}
        onPress={() => onViewDetails(session.id)}
        activeOpacity={isBtnDisabled ? 1 : 0.8}
        disabled={isBtnDisabled}
        {...a11yButton(`${btnLabel} — ${session.title}`, { disabled: isBtnDisabled })}
      >
        <Text style={[styles.btnText, isBtnDisabled && styles.btnTextDisabled]}>
          {btnLabel}
        </Text>
        {!isBtnDisabled && (
          <Ionicons
            name="arrow-forward"
            size={13}
            color={theme.onPrimarySolid}
            {...a11yDecorative}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

function DetailRow({ icon, label, styles, theme }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={13} color={theme.iconMuted} {...a11yDecorative} />
      <Text style={styles.detailText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.card,
      paddingTop: 12,
      paddingHorizontal: 14,
      paddingBottom: 14,
      gap: 8,
      shadowColor: t.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
    titleBlock: { flex: 1 },
    title: { fontSize: 14, fontWeight: '700', color: t.textPrimary },
    applicants: { fontSize: 12, color: t.textMuted, fontWeight: '500', marginTop: 2 },

    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: { fontSize: 10, fontWeight: '700' },

    details: {
      borderTopWidth: 1,
      borderTopColor: t.divider,
      paddingTop: 10,
      paddingBottom: 4,
      gap: 5,
    },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 12, flex: 1, color: t.textSecondary },

    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 8,
      minHeight: MIN_TOUCH_SIZE - 6,
      // `marginTop: 'auto'` empuja el botón al fondo del espacio disponible; el
      // marginTop mínimo evita que quede pegado a la fila de detalles cuando la
      // tarjeta es justa de alto.
      marginTop: 'auto',
      marginBottom: 0,
    },
    btnEnabled:  { backgroundColor: t.primarySolid },
    btnDisabled: { backgroundColor: t.disabledBg, borderWidth: 1, borderColor: t.border },
    btnText: { color: t.onPrimarySolid, fontSize: 13, fontWeight: '700' },
    btnTextDisabled: { color: t.textDisabled },
  });
