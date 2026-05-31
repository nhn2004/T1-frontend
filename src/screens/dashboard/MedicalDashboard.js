import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import useAuthStore from '../../store/authStore';

import WelcomeBanner       from './components/WelcomeBanner';
import ValidationCard      from './components/ValidationCard';
import StatCard            from './components/StatCard';
import ActivityRow         from './components/ActivityRow';
import ConfirmApprovalModal from './components/ConfirmApprovalModal';

import {
  MEDICAL_DIRECTOR,
  VALIDATION_QUEUE,
  TOTAL_PENDING,
  STAT_CARDS,
  RECENT_ACTIVITIES,
} from './__mocks__/medicalData';

// Max cards visible at once — keeps the layout fixed with no scroll.
const MAX_VISIBLE = 1;

export default function MedicalDashboard({ navigation, Sidebar }) {
  const user = useAuthStore((s) => s.user);

  // Full queue in state — when one is approved it's removed and the next slides in.
  const [queue, setQueue]           = useState(VALIDATION_QUEUE);
  const [approvedCount, setApproved] = useState(0);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  // "Aprobar" → aprueba directamente sin modal
  const handleApprovePress = useCallback((id) => {
    setQueue((prev) => prev.filter((v) => v.id !== id));
    setApproved((n) => n + 1);
    // TODO: api.post(`/validations/${id}/approve`)
  }, []);

  // "Rechazar" → abre el modal
  const handleReview = useCallback((id) => {
    const item = queue.find((v) => v.id === id);
    setSelectedItem(item);
    setModalVisible(true);
  }, [queue]);

  // Aprobar desde el modal
  const handleConfirmApproval = useCallback((id) => {
    setModalVisible(false);
    setSelectedItem(null);
    setQueue((prev) => prev.filter((v) => v.id !== id));
    setApproved((n) => n + 1);
  }, []);

  // Rechazar con motivo desde el modal
  const handleRejectWithReason = useCallback((id, reason) => {
    setModalVisible(false);
    setSelectedItem(null);
    setQueue((prev) => prev.filter((v) => v.id !== id));
    setApproved((n) => n + 1);
    // TODO: api.post(`/validations/${id}/reject`, { reason })
    Alert.alert('Rechazado', `Motivo enviado: "${reason}"`);
  }, []);

  const handleCancelModal = useCallback(() => {
    setModalVisible(false);
    setSelectedItem(null);
  }, []);

  const handleViewAll = useCallback(() => {
    // TODO: navigation.navigate(ROUTES.VALIDATION_QUEUE);
    Alert.alert('Ver todas', 'Navegar a la cola completa.');
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const displayQueue   = queue.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(0, TOTAL_PENDING - approvedCount);

  const director = user
    ? { name: user.name, title: 'Medical Director' }
    : MEDICAL_DIRECTOR;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      {/* Sidebar slot — filled by Dev 2 via the navigator */}
      {Sidebar && <Sidebar />}

      <View style={styles.content}>

        <WelcomeBanner name={director.name} title={director.title} />

        <View style={styles.middleRow}>

          {/* Validation queue */}
          <View style={styles.queuePanel}>
            <QueueHeader count={remainingCount} />

            {displayQueue.length > 0 ? (
              displayQueue.map((item) => (
                <ValidationCard
                  key={item.id}
                  item={item}
                  onApprove={handleApprovePress}
                  onReview={handleReview}
                />
              ))
            ) : (
              <EmptyQueue />
            )}

            {remainingCount > 0 && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={handleViewAll}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllText}>
                  Ver Todas las Solicitudes ({remainingCount})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stat cards */}
          <View style={styles.statsPanel}>
            {STAT_CARDS.map((card) => (
              <StatCard key={card.id} {...card} />
            ))}
          </View>
        </View>

        {/* Recent activity */}
        <View style={styles.activityPanel}>
          <Text style={styles.sectionTitle}>Actividades recientes</Text>
          {RECENT_ACTIVITIES.map((activity) => (
            <ActivityRow key={activity.id} {...activity} />
          ))}
        </View>

      </View>

      {/* Confirmation modal — rendered outside the content flow so it overlays everything */}
      <ConfirmApprovalModal
        visible={modalVisible}
        item={selectedItem}
        onApprove={handleConfirmApproval}
        onReject={handleRejectWithReason}
        onCancel={handleCancelModal}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QueueHeader({ count }) {
  return (
    <View style={styles.queueHeader}>
      <View style={styles.queueTitleRow}>
        <Ionicons name="people-outline" size={18} color="#2E2E2E" />
        <Text style={styles.queueTitle}>Cola de Validaciones</Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countBadgeText}>{count} Pendientes</Text>
      </View>
    </View>
  );
}

function EmptyQueue() {
  return (
    <View style={styles.emptyBox}>
      <Ionicons name="checkmark-done-circle-outline" size={32} color="#00A63E" />
      <Text style={styles.emptyText}>Sin solicitudes pendientes</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F4F6F8',
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },

  // Queue panel
  queuePanel: {
    flex: 1.1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 14,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  queueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  countBadge: {
    backgroundColor: '#F0B100',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  viewAllBtn: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#C62828',
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 13,
    color: '#697282',
  },

  // Stat cards
  statsPanel: {
    flex: 0.9,
    gap: 10,
  },

  // Activity panel
  activityPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E2E2E',
    marginBottom: 6,
  },
});
