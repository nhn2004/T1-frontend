import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { a11yButton, a11yDecorative, MIN_TOUCH_SIZE } from '../../constants/a11y';
import useTheme from '../../hooks/useTheme';
import { useAuditOnMount } from '../../hooks/useAuditTrail';
import useAuthStore from '../../store/authStore';
import Toast from '../../components/Toast';

import ValidationCard from './components/ValidationCard';
import ConfirmApprovalModal from './components/ConfirmApprovalModal';
import { invitationService } from '../../services/invitationService';

export default function ValidationQueueScreen({ navigation }) {
  const theme = useTheme();
  const user  = useAuthStore((s) => s.user);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Requisito de auditoría: acceso a la cola de validación de personal médico.
  useAuditOnMount('MEDICAL_VALIDATION_QUEUE', user?.userId);

  const [rawInvitations, setRawInvitations] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [busyId,         setBusyId]         = useState(null);
  const [toast,          setToast]          = useState(null);
  const [modalVisible,   setModalVisible]   = useState(false);
  const [selectedItem,   setSelectedItem]   = useState(null);

  useEffect(() => {
    let alive = true;

    invitationService.getAll()
      .then((invs) => {
        if (alive) setRawInvitations(invs.filter((i) => i.status === 'Pending'));
      })
      .catch(() => {
        if (alive) setToast({ message: 'No se pudo cargar la cola de validaciones.', tone: 'error' });
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  const queue = useMemo(
    () => rawInvitations.map(invitationService.toValidationItem),
    [rawInvitations],
  );

  // La lista solo se actualiza cuando el servidor confirma el cambio; si la petición
  // falla, la invitación permanece en la cola y se informa el error.
  const runInvitationAction = useCallback(async (id, action, successMessage) => {
    setBusyId(id);
    setToast(null);
    try {
      await action(id);
      setRawInvitations((prev) => prev.filter((i) => i.invitationId !== id));
      setToast({ message: successMessage, tone: 'success' });
      setModalVisible(false);
      setSelectedItem(null);
    } catch (error) {
      const detail = error?.response?.data?.message ?? 'Revisa tu conexión e inténtalo de nuevo.';
      setToast({ message: `No se pudo completar la acción. ${detail}`, tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }, []);

  const handleApprovePress = useCallback(
    (id) => runInvitationAction(id, invitationService.accept, 'Invitación aprobada.'),
    [runInvitationAction],
  );

  const handleConfirmApproval = useCallback(
    (id) => runInvitationAction(id, invitationService.accept, 'Invitación aprobada.'),
    [runInvitationAction],
  );

  const handleRejectWithReason = useCallback(
    (id, reason) => runInvitationAction(
      id,
      invitationService.reject,
      `Invitación rechazada. Motivo registrado: "${reason}"`,
    ),
    [runInvitationAction],
  );

  const handleReview = useCallback((id) => {
    setSelectedItem(queue.find((v) => v.id === id) ?? null);
    setModalVisible(true);
  }, [queue]);

  const handleCancelModal = useCallback(() => {
    setModalVisible(false);
    setSelectedItem(null);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topTitleRow}>
          <Ionicons name="people-outline" size={20} color={theme.primaryText} {...a11yDecorative} />
          <Text style={styles.topTitle} accessibilityRole="header">Cola de Validaciones</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {loading ? '—' : `${queue.length} Pendientes`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          {...a11yButton('Volver')}
        >
          <Ionicons name="arrow-back" size={16} color={theme.textPrimary} {...a11yDecorative} />
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        {loading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : queue.length > 0 ? (
          queue.map((item) => (
            <ValidationCard
              key={item.id}
              item={item}
              onApprove={handleApprovePress}
              onReview={handleReview}
              busy={busyId === item.id}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={32}
              color={theme.status.success.fg}
              {...a11yDecorative}
            />
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
        busy={busyId != null}
      />
    </SafeAreaView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
      padding: 14,
    },
    topTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
    topTitle: { fontSize: 18, fontWeight: '800', color: t.textPrimary },
    countBadge: {
      backgroundColor: t.status.warning.bg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    countBadgeText: { color: t.status.warning.fg, fontSize: 12, fontWeight: '700' },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, minHeight: MIN_TOUCH_SIZE, borderRadius: 10,
      backgroundColor: t.card, borderWidth: 1.5, borderColor: t.border,
    },
    backBtnText: { fontSize: 14, fontWeight: '600', color: t.textPrimary },
    list: {
      padding: 14, paddingTop: 0, gap: 12,
      maxWidth: 640, width: '100%', alignSelf: 'center',
    },
    emptyBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 60 },
    emptyText: { fontSize: 14, color: t.textMuted },
  });
