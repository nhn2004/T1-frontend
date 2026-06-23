import React from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';

const heroImage = require('../../assets/fondocarro.jpg');
const trainingImage = require('../../assets/bomberosEjercitando.jpg');

// Mock data ready to be replaced by backend responses.
const immediateTraining = {
  id: 's2',
  status: 'In Progress',
  invitedAt: 'invited 2 hours ago',
  title: 'Live Fire Drill - Guayaquil',
  description: 'Mandatory training session covering hose handling techniques in live fire scenarios.',
  dateTime: 'Oct 24, 08:00 Am',
  location: 'Sauces 8',
};

const thisWeekSessions = [
  {
    id: 'equipment-maintenance',
    day: 'FRI',
    date: '25',
    title: 'Equipment Maintenance',
    time: '10:00 AM',
    place: 'Workshop A',
    status: 'CONFIRMED',
    statusTone: 'confirmed',
  },
  {
    id: 'ladder-drills',
    day: 'MON',
    date: '28',
    title: 'Ladder Drills',
    time: '07:30 AM',
    place: 'Tower 1',
    status: 'PENDING',
    statusTone: 'pending',
  },
  {
    id: 'classroom-ethics',
    day: 'TUE',
    date: '29',
    title: 'Classroom: Ethics',
    time: '01:00 PM',
    place: 'Room 304',
    status: null,
    statusTone: 'muted',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

export default function CapacitatorDashboard({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const isCompact = width < 760;
  const greetingName = (user?.name || 'Capacitador').toUpperCase();
  const handleViewDetails = (id) => {
    navigation?.navigate('SessionDetail', { id });
  };

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <ImageBackground source={heroImage} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroOverlay} />
        <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact]} numberOfLines={2}>
          {getGreeting()},{'\n'}{greetingName}
        </Text>
      </ImageBackground>

      <View style={[styles.dashboardGrid, !isWide && styles.dashboardGridStacked]}>
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Immediate Action Required</Text>

          <View style={[styles.trainingCard, isCompact && styles.trainingCardCompact]}>
            <Image source={trainingImage} resizeMode="cover" style={[styles.trainingImage, isCompact && styles.trainingImageCompact]} />

            <View style={styles.trainingContent}>
              <View style={styles.trainingMetaRow}>
                <View style={styles.progressPill}>
                  <Text style={styles.progressText}>{immediateTraining.status}</Text>
                </View>
                <Text style={styles.invitedText}>{immediateTraining.invitedAt}</Text>
              </View>

              <Text style={styles.trainingTitle} numberOfLines={2}>
                {immediateTraining.title}
              </Text>
              <Text style={styles.trainingDescription} numberOfLines={3}>
                {immediateTraining.description}
              </Text>

              <View style={styles.trainingDetailsRow}>
                <Text style={styles.trainingDetail}>{immediateTraining.dateTime}</Text>
                <Text style={styles.trainingDetail}>{immediateTraining.location}</Text>
              </View>

              <Pressable style={styles.detailsButton} onPress={() => handleViewDetails(immediateTraining.id)}>
                <Text style={styles.detailsButtonText}>View Details</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.weekCard, !isWide && styles.weekCardStacked]}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>This Week</Text>
            <Ionicons name="ellipsis-horizontal" size={18} color="#9AA3B0" />
          </View>

          <View style={styles.weekList}>
            {thisWeekSessions.map((session, index) => (
              <View key={session.id} style={styles.weekItem}>
                <View style={styles.dateBlock}>
                  <Text style={[styles.weekDay, index === 2 && styles.weekMuted]}>{session.day}</Text>
                  <Text style={[styles.weekDate, index === 2 && styles.weekMuted]}>{session.date}</Text>
                </View>

                <View style={[styles.timeline, index === 1 && styles.timelinePending, index === 2 && styles.timelineMuted]} />

                <View style={styles.weekInfo}>
                  <Text style={[styles.weekSessionTitle, index === 2 && styles.weekMuted]} numberOfLines={1}>
                    {session.title}
                  </Text>
                  <Text style={[styles.weekSessionMeta, index === 2 && styles.weekMuted]} numberOfLines={1}>
                    {session.time} - {session.place}
                  </Text>
                  {session.status && (
                    <View style={[styles.statusPill, styles[`${session.statusTone}Pill`]]}>
                      <Text style={[styles.statusText, styles[`${session.statusTone}Text`]]}>
                        {session.status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    paddingHorizontal: 28,
    paddingVertical: 34,
    gap: 26,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  hero: {
    minHeight: 126,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
  },
  heroImage: {
    borderRadius: 24,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35, 0, 12, 0.58)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '900',
    paddingHorizontal: 42,
    maxWidth: 640,
  },
  heroTitleCompact: {
    fontSize: 22,
    lineHeight: 25,
    paddingHorizontal: 24,
  },
  dashboardGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 30,
  },
  dashboardGridStacked: {
    flexDirection: 'column',
  },
  actionSection: {
    flex: 1,
    minWidth: 0,
    gap: 14,
  },
  sectionTitle: {
    color: '#151A20',
    fontSize: 20,
    fontWeight: '500',
  },
  trainingCard: {
    minHeight: 250,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  trainingCardCompact: {
    flexDirection: 'column',
  },
  trainingImage: {
    width: 220,
    height: 250,
    backgroundColor: '#E7EAEE',
  },
  trainingImageCompact: {
    width: '100%',
    height: 220,
  },
  trainingContent: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 26,
    paddingVertical: 24,
    gap: 13,
  },
  trainingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  progressPill: {
    minWidth: 86,
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#B9F8D3',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  progressText: {
    color: '#08A65B',
    fontSize: 11,
    fontWeight: '800',
  },
  invitedText: {
    color: '#94A0AF',
    fontSize: 11,
    fontWeight: '700',
  },
  trainingTitle: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  trainingDescription: {
    color: '#4F5E70',
    fontSize: 11,
    lineHeight: 18,
  },
  trainingDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 2,
  },
  trainingDetail: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '500',
  },
  detailsButton: {
    width: 160,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 14,
    backgroundColor: COLORS.primary,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  weekCard: {
    width: 294,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 26,
    paddingVertical: 30,
    gap: 18,
  },
  weekCardStacked: {
    width: '100%',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekTitle: {
    color: '#2C3440',
    fontSize: 16,
    fontWeight: '900',
  },
  weekList: {
    gap: 14,
  },
  weekItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  dateBlock: {
    width: 34,
    alignItems: 'center',
  },
  weekDay: {
    color: '#8D96A3',
    fontSize: 12,
    fontWeight: '900',
  },
  weekDate: {
    color: '#2C3440',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  timeline: {
    width: 4,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#25D682',
  },
  timelinePending: {
    backgroundColor: '#FF6A1A',
  },
  timelineMuted: {
    backgroundColor: '#E7EAEE',
  },
  weekInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  weekSessionTitle: {
    color: '#2C3440',
    fontSize: 14,
    fontWeight: '900',
  },
  weekSessionMeta: {
    color: '#8D96A3',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 2,
  },
  confirmedPill: {
    backgroundColor: '#C9F8D8',
  },
  pendingPill: {
    backgroundColor: '#FFE4D0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  confirmedText: {
    color: '#0CA85C',
  },
  pendingText: {
    color: '#EA5A0B',
  },
  weekMuted: {
    color: '#AEB6C2',
  },
});
