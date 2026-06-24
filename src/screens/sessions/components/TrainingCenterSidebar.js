import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_COLORS } from '../__mocks__/sessionDetailData';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// Right sidebar: training center card + instructor list.
// Purely presentational — receives data as props.

export default function TrainingCenterSidebar({ trainingCenter = {}, instructors = [], fullWidth }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleDirections = () => {
    const query = encodeURIComponent(trainingCenter?.address ?? '');
    if (!trainingCenter?.address) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  };

  return (
    <View style={[styles.sidebar, fullWidth && styles.sidebarFullWidth]}>

      {/* ── Training center card ── */}
      <View style={[styles.centerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Image
          source={{ uri: trainingCenter.imageUri }}
          style={styles.centerImage}
          resizeMode="cover"
        />
        <View style={styles.centerInfo}>
          <Text style={[styles.centerName, { color: theme.textPrimary }]}>{trainingCenter.name}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location-sharp" size={12} color="#E85D27" />
            <Text style={[styles.addressText, { color: theme.textSecondary }]} numberOfLines={2}>
              {trainingCenter.address}
            </Text>
          </View>

          <View style={[styles.specificBox, { backgroundColor: theme.pill }]}>
            <Ionicons name="business-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.specificText, { color: theme.textSecondary }]}>
              {trainingCenter.specificLocation}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.directionsRow}
            activeOpacity={0.7}
            onPress={handleDirections}
            accessibilityRole="button"
            accessibilityLabel={t.sessionDetail.getDirections}
          >
            <Text style={[styles.directionsText, { color: theme.textPrimary }]}>{t.sessionDetail.getDirections}</Text>
            <Ionicons name="open-outline" size={14} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Lead instructors ── */}
      <View style={[styles.instructorsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.instructorsLabel, { color: theme.textMuted }]}>{t.sessionDetail.leadInstructor}</Text>
        {(instructors || []).map((inst) => (
          <InstructorRow key={inst.id} instructor={inst} theme={theme} t={t} />
        ))}
      </View>

    </View>
  );
}

function InstructorRow({ instructor, theme, t }) {
  const roleStyle = ROLE_COLORS[instructor.role] ?? { bg: theme.pill, text: theme.textSecondary };

  return (
    <View style={styles.instructorRow}>
      {/* Avatar initials */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {instructor.name.split(' ').slice(-1)[0][0]}
        </Text>
      </View>
      <View style={styles.instructorInfo}>
        <Text style={[styles.instructorName, { color: theme.textPrimary }]}>{instructor.name}</Text>
        <Text style={[styles.instructorDivision, { color: theme.textSecondary }]}>{instructor.division}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
          <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
            {t.common.instructorRoles[instructor.role] ?? instructor.role}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    gap: 12,
  },
  sidebarFullWidth: {
    width: '100%',
  },

  // Training center card
  centerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  centerImage: {
    width: '100%',
    height: 120,
  },
  centerInfo: {
    padding: 14,
    gap: 8,
  },
  centerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  addressText: {
    fontSize: 11,
    color: '#495565',
    flex: 1,
    lineHeight: 16,
  },
  specificBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F6F8',
    borderRadius: 8,
    padding: 8,
  },
  specificText: {
    fontSize: 11,
    color: '#495565',
    flex: 1,
  },
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  directionsText: {
    fontSize: 13,
    color: '#2E2E2E',
    fontWeight: '600',
  },

  // Instructors
  instructorsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  instructorsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9AA3B0',
    letterSpacing: 1,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E85D27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  instructorInfo: {
    flex: 1,
    gap: 2,
  },
  instructorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  instructorDivision: {
    fontSize: 11,
    color: '#697282',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
