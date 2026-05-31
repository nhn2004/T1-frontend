import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_COLORS } from '../__mocks__/sessionDetailData';

// Right sidebar: training center card + instructor list.
// Purely presentational — receives data as props.

export default function TrainingCenterSidebar({ trainingCenter, instructors }) {
  return (
    <View style={styles.sidebar}>

      {/* ── Training center card ── */}
      <View style={styles.centerCard}>
        <Image
          source={{ uri: trainingCenter.imageUri }}
          style={styles.centerImage}
          resizeMode="cover"
        />
        <View style={styles.centerInfo}>
          <Text style={styles.centerName}>{trainingCenter.name}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location-sharp" size={12} color="#E85D27" />
            <Text style={styles.addressText} numberOfLines={2}>
              {trainingCenter.address}
            </Text>
          </View>

          <View style={styles.specificBox}>
            <Ionicons name="business-outline" size={13} color="#495565" />
            <Text style={styles.specificText}>
              {trainingCenter.specificLocation}
            </Text>
          </View>

          <TouchableOpacity style={styles.directionsRow} activeOpacity={0.7}>
            <Text style={styles.directionsText}>Get Directions</Text>
            <Ionicons name="open-outline" size={14} color="#2E2E2E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Lead instructors ── */}
      <View style={styles.instructorsCard}>
        <Text style={styles.instructorsLabel}>LEAD INSTRUCTOR</Text>
        {instructors.map((inst) => (
          <InstructorRow key={inst.id} instructor={inst} />
        ))}
      </View>

    </View>
  );
}

function InstructorRow({ instructor }) {
  const roleStyle = ROLE_COLORS[instructor.role] ?? { bg: '#F0F0F0', text: '#333' };

  return (
    <View style={styles.instructorRow}>
      {/* Avatar initials */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {instructor.name.split(' ').slice(-1)[0][0]}
        </Text>
      </View>
      <View style={styles.instructorInfo}>
        <Text style={styles.instructorName}>{instructor.name}</Text>
        <Text style={styles.instructorDivision}>{instructor.division}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
          <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
            {instructor.role}
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
