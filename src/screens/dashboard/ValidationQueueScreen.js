import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ValidationCard from './components/ValidationCard';
import ConfirmApprovalModal from './components/ConfirmApprovalModal';
import { VALIDATION_QUEUE } from './__mocks__/medicalData';

// Lista completa de la cola de validaciones — antes "Ver Todas las Solicitudes"
// solo mostraba un Alert.alert() de marcador de posición (que además no
// aparece en absoluto en web, donde Alert.alert es un no-op), así que el botón
// no hacía nada visible. Reutiliza los mismos componentes y handlers que el
// panel resumido del dashboard.
export default function ValidationQueueScreen({ navigation }) {
  const [queue, setQueue] = useState(VALIDATION_QUEUE);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleApprovePress = useCallback((id) => {
    setQueue((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleReview = useCallback((id) => {
    const item = queue.find((v) => v.id === id);
    setSelectedItem(item);
    setModalVisible(true);
  }, [queue]);

  const handleConfirmApproval = useCallback((id) => {
    setModalVisible(false);
    setSelectedItem(null);
    setQueue((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleRejectWithReason = useCallback((id, reason) => {
    setModalVisible(false);
    setSelectedItem(null);
    setQueue((prev) => prev.filter((v) => v.id !== id));
    Alert.alert('Rechazado', `Motivo enviado: "${reason}"`);
  }, []);

  const handleCancelModal = useCallback(() => {
    setModalVisible(false);
    setSelectedItem(null);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.topTitleRow}>
          <Ionicons name="people-outline" size={20} color="#E85D27" />
          <Text style={styles.topTitle}>Cola de Validaciones</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{queue.length} Pendientes</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={16} color="#2E2E2E" />
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {queue.length > 0 ? (
          queue.map((item) => (
            <ValidationCard
              key={item.id}
              item={item}
              onApprove={handleApprovePress}
              onReview={handleReview}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color="#00A63E" />
            <Text style={styles.emptyText}>Sin solicitudes pendientes</Text>
          </View>
        )}
      </ScrollView>

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F8' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14,
  },
  topTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#2E2E2E' },
  countBadge: {
    backgroundColor: '#F0B100', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },
  list: {
    padding: 14, paddingTop: 0, gap: 12,
    maxWidth: 640, width: '100%', alignSelf: 'center',
  },
  emptyBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 60 },
  emptyText: { fontSize: 13, color: '#697282' },
});
