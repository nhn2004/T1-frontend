import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// "Immediate Action Required" card: a single pending session invitation.

export default function InvitationCard({ invitation, onConfirm, onDetails, compact }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const badge = theme.badge.pending;

  return (
    <View style={[styles.card, { backgroundColor: theme.card }, compact && styles.cardCompact]}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t.dashboard.actionRequired}</Text>

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <Image
          source={invitation.image}
          style={[styles.image, compact && styles.imageCompact]}
        />

        <View style={[styles.info, compact && styles.infoCompact]}>
          <View style={styles.topRow}>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>{t.dashboard.invitationStatusLabel}</Text>
            </View>
            <Text style={[styles.invitedAgo, { color: theme.textMuted }]}>
              {t.dashboard.invitedAgo(invitation.invitedHoursAgo)}
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>{invitation.title}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{invitation.description}</Text>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: theme.textPrimary }]}>{invitation.date}</Text>
            <Text style={[styles.metaText, { color: theme.textPrimary }]}>{invitation.location}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onConfirm(invitation.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`${t.dashboard.confirmAttendance} — ${invitation.title}`}
            >
              <Text style={styles.confirmBtnText}>{t.dashboard.confirmAttendance}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDetails(invitation.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t.dashboard.details}
            >
              <Text style={styles.detailsText}>{t.dashboard.details}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1.3,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },
  // OJO: en RN-Web "flex: 0" compila a CSS "flex: 0 1 0%" (flexBasis 0%), NO a
  // "tamaño según contenido" — colapsa el bloque a 0px igual que flex:1 sin espacio
  // que repartir. Para cancelar el flex heredado hay que fijar las tres props largas
  // con flexBasis "auto" explícito.
  cardCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  bodyCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    flexDirection: 'column',
  },
  image: {
    width: 130,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imageCompact: {
    width: '100%',
    height: 160,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  infoCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  invitedAgo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#99A1AF',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  description: {
    fontSize: 12,
    color: '#4A5565',
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 'auto',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '700',
  },
});
