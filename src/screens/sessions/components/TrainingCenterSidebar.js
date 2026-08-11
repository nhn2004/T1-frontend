import React, { useCallback, useMemo } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_TONES } from '../sessionDisplay';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { a11yButton, a11yDecorative, a11yGroup, MIN_TOUCH_SIZE } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT } from '../../../constants/typography';

// Barra lateral derecha: centro de entrenamiento + personal asignado.
// Puramente presentacional: recibe todo por props.

export default function TrainingCenterSidebar({
  trainingCenter, instructors = [], instructorsLoaded = true, fullWidth,
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const address = trainingCenter?.address;

  const handleDirections = useCallback(() => {
    if (!address || address === '—') return;
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  }, [address]);

  return (
    <View style={[styles.sidebar, fullWidth && styles.sidebarFullWidth]}>
      {/* ── Centro de entrenamiento ── */}
      <View style={styles.centerCard}>
        {trainingCenter?.imageUri ? (
          <Image
            source={{ uri: trainingCenter.imageUri }}
            style={styles.centerImage}
            resizeMode="cover"
            accessible={false}
          />
        ) : (
          // Sin imagen del backend se muestra un marcador neutro en vez de un
          // <Image> con uri undefined, que en web deja un hueco roto.
          <View style={[styles.centerImage, styles.centerImagePlaceholder]} {...a11yDecorative}>
            <Ionicons name="business-outline" size={28} color={theme.iconMuted} />
          </View>
        )}

        <View style={styles.centerInfo}>
          <Text style={styles.centerName}>{trainingCenter?.name ?? 'Centro no asignado'}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location-sharp" size={13} color={theme.primaryText} {...a11yDecorative} />
            <Text style={styles.addressText} numberOfLines={3}>
              {address ?? 'Dirección no disponible'}
            </Text>
          </View>

          {!!trainingCenter?.specificLocation && (
            <View style={styles.specificBox}>
              <Ionicons name="business-outline" size={13} color={theme.icon} {...a11yDecorative} />
              <Text style={styles.specificText}>{trainingCenter.specificLocation}</Text>
            </View>
          )}

          {!!address && address !== '—' && (
            <TouchableOpacity
              style={styles.directionsRow}
              activeOpacity={0.7}
              onPress={handleDirections}
              {...a11yButton(t.sessionDetail.getDirections, {
                hint: 'Abre la ubicación en Google Maps',
              })}
            >
              <Text style={styles.directionsText}>{t.sessionDetail.getDirections}</Text>
              <Ionicons name="open-outline" size={14} color={theme.primaryText} {...a11yDecorative} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Personal asignado ── */}
      <View style={styles.instructorsCard}>
        <Text style={styles.instructorsLabel} accessibilityRole="header">
          {t.sessionDetail.leadInstructor}
        </Text>

        {!instructorsLoaded ? (
          <Text style={styles.emptyText}>No se pudo cargar el personal asignado.</Text>
        ) : instructors.length === 0 ? (
          <Text style={styles.emptyText}>
            Todavía no hay personal de salud asignado a esta capacitación.
          </Text>
        ) : (
          instructors.map((inst) => (
            <InstructorRow key={inst.id} instructor={inst} theme={theme} t={t} styles={styles} />
          ))
        )}
      </View>
    </View>
  );
}

function InstructorRow({ instructor, theme, t, styles }) {
  const tone = theme.status[ROLE_TONES[instructor.role] ?? 'neutral'];

  // Inicial a partir del último token no vacío del nombre; con nombres vacíos o
  // con espacios extra, `split(' ').slice(-1)[0][0]` reventaba con TypeError.
  const initial = (instructor.name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-1)[0]?.[0]?.toUpperCase() ?? '?';

  const roleLabel = t.common.instructorRoles[instructor.role] ?? instructor.role;

  return (
    <View
      style={styles.instructorRow}
      {...a11yGroup([instructor.name, instructor.division, roleLabel].filter(Boolean).join(', '))}
    >
      <View style={styles.avatar} {...a11yDecorative}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.instructorInfo}>
        <Text style={styles.instructorName}>{instructor.name}</Text>
        {!!instructor.division && (
          <Text style={styles.instructorDivision}>{instructor.division}</Text>
        )}
        <View style={[styles.roleBadge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.roleBadgeText, { color: tone.fg }]}>{roleLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    sidebar: { width: 260, gap: 12 },
    sidebarFullWidth: { width: '100%' },

    centerCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden',
    },
    centerImage: { width: '100%', height: 120, backgroundColor: t.pill },
    centerImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    centerInfo: { padding: 14, gap: 8 },
    centerName: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    addressText: { flex: 1, fontSize: FONT_SIZE.md, color: t.textSecondary, lineHeight: 18 },
    specificBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: t.pill, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 8,
    },
    specificText: { flex: 1, fontSize: FONT_SIZE.md, color: t.textSecondary },
    directionsRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      minHeight: MIN_TOUCH_SIZE - 8,
    },
    directionsText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.primaryText },

    instructorsCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      padding: 14,
      gap: 12,
    },
    instructorsLabel: {
      fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: t.textMuted,
      letterSpacing: 0.6, textTransform: 'uppercase',
    },
    emptyText: { fontSize: FONT_SIZE.md, color: t.textMuted, lineHeight: 18 },

    instructorRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    avatar: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: t.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.onPrimarySoft },
    instructorInfo: { flex: 1, gap: 2 },
    instructorName: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    instructorDivision: { fontSize: FONT_SIZE.base, color: t.textSecondary },
    roleBadge: {
      alignSelf: 'flex-start', borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 2, marginTop: 2,
    },
    roleBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  });
