import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { a11yButton, MIN_TOUCH_SIZE } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT } from '../../../constants/typography';

// Tarjeta "Acción inmediata requerida": una invitación de sesión pendiente.

export default function InvitationCard({ invitation, onConfirm, onDetails, compact, busy }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const badge = theme.badge.pending;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {t.dashboard.actionRequired}
      </Text>

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <Image
          source={invitation.image}
          style={[styles.image, compact && styles.imageCompact]}
          // Imagen ilustrativa de la capacitación: no aporta información que no esté
          // en el texto de al lado.
          accessible={false}
          accessibilityRole="none"
        />

        <View style={[styles.info, compact && styles.infoCompact]}>
          <View style={styles.topRow}>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {t.dashboard.invitationStatusLabel}
              </Text>
            </View>
            <Text style={styles.invitedAgo}>
              {t.dashboard.invitedAgo(invitation.invitedHoursAgo)}
            </Text>
          </View>

          <Text style={styles.title}>{invitation.title}</Text>
          <Text style={styles.description}>{invitation.description}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{invitation.date}</Text>
            <Text style={styles.metaText}>{invitation.location}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.confirmBtn, busy && styles.confirmBtnDisabled]}
              onPress={() => onConfirm(invitation.id)}
              activeOpacity={0.85}
              disabled={busy}
              {...a11yButton(`${t.dashboard.confirmAttendance} — ${invitation.title}`, {
                disabled: busy,
                busy,
              })}
            >
              <Text style={styles.confirmBtnText}>{t.dashboard.confirmAttendance}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDetails(invitation.id)}
              activeOpacity={0.7}
              style={styles.detailsBtn}
              {...a11yButton(`${t.dashboard.details} — ${invitation.title}`)}
            >
              <Text style={styles.detailsText}>{t.dashboard.details}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    card: {
      flex: 1.3,
      backgroundColor: t.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    // OJO: en RN-Web "flex: 0" compila a "flex: 0 1 0%" (flexBasis 0%), NO a "tamaño
    // según contenido" — colapsa el bloque a 0px. Para cancelar el flex heredado hay
    // que fijar las tres props largas con flexBasis 'auto' explícito.
    cardCompact: {
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
      width: '100%',
    },
    sectionTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: FONT_WEIGHT.bold,
      color: t.textPrimary,
      marginBottom: 12,
    },
    body: { flex: 1, flexDirection: 'row', gap: 14 },
    bodyCompact: {
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
      flexDirection: 'column',
    },
    image: { width: 130, borderRadius: 12, resizeMode: 'cover' },
    imageCompact: { width: '100%', height: 160 },
    info: { flex: 1, gap: 6 },
    infoCompact: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },

    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
    invitedAgo: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: t.textMuted },

    title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    description: { fontSize: FONT_SIZE.md, color: t.textSecondary, lineHeight: 18 },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 2 },
    metaText: { fontSize: FONT_SIZE.md, color: t.textSecondary },

    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 'auto',
      paddingTop: 8,
    },
    confirmBtn: {
      backgroundColor: t.primarySolid,
      borderRadius: 10,
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    confirmBtnDisabled: { backgroundColor: t.disabledBg },
    confirmBtnText: { color: t.onPrimarySolid, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },

    detailsBtn: {
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    detailsText: { color: t.primaryText, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  });
