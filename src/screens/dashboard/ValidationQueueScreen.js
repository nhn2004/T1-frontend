import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { a11yButton, a11yDecorative, a11yTab, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';
import useTheme from '../../hooks/useTheme';
import { useAuditOnMount } from '../../hooks/useAuditTrail';
import useAuthStore from '../../store/authStore';
import Toast from '../../components/Toast';
import { safeGoBack } from '../../utils/safeGoBack';

import ValidationCard from './components/ValidationCard';
import ConfirmApprovalModal from './components/ConfirmApprovalModal';
import { invitationService } from '../../services/invitationService';

const FILTERS = [
  { key: 'all',    label: 'Todas' },
  { key: 'urgent', label: 'Por vencer' },
];

export default function ValidationQueueScreen({ navigation }) {
  const theme = useTheme();
  const user  = useAuthStore((s) => s.user);
  const { width } = useWindowDimensions();

  // Dos columnas en tablet/escritorio: una cola de 12 solicitudes en una sola
  // columna estrecha obligaba a desplazarse mucho para tener la vista completa.
  const columns = width >= 1100 ? 2 : 1;
  const compact = width < 600;
  const styles = useMemo(() => makeStyles(theme, compact), [theme, compact]);

  useAuditOnMount('MEDICAL_VALIDATION_QUEUE', user?.userId);

  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [busyId,       setBusyId]       = useState(null);
  const [toast,        setToast]        = useState(null);
  const [filter,       setFilter]       = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await invitationService.getPendingDetailed());
    } catch {
      setToast({ message: 'No se pudo cargar la cola de validaciones.', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const urgentCount = useMemo(() => items.filter((i) => i.isUrgent).length, [items]);

  const visible = useMemo(
    () => (filter === 'urgent' ? items.filter((i) => i.isUrgent) : items),
    [items, filter],
  );

  // La lista solo se actualiza cuando el servidor confirma el cambio.
  const runAction = useCallback(async (id, action, successMessage) => {
    setBusyId(id);
    setToast(null);
    try {
      await action(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setToast({ message: successMessage, tone: 'success' });
      setModalVisible(false);
      setSelectedItem(null);
    } catch (error) {
      if (!error.response) {
        // Encolado offline por api.js — se sincroniza solo cuando vuelva la señal.
        setItems((prev) => prev.filter((i) => i.id !== id));
        setToast({ message: 'Sin conexión: la acción quedó guardada localmente y se aplicará cuando vuelva la señal.', tone: 'warning' });
        setModalVisible(false);
        setSelectedItem(null);
        setBusyId(null);
        return;
      }
      const detail = error?.response?.data?.message ?? 'Revisa tu conexión e inténtalo de nuevo.';
      setToast({ message: `No se pudo completar la acción. ${detail}`, tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }, []);

  // Esta pantalla revisa invitaciones de OTRAS personas (el staff de validación no es
  // el destinatario), así que usa staffAccept/staffReject en vez de accept/reject — el
  // backend exige que accept/reject los use el propio destinatario.
  const handleApprove = useCallback(
    (id) => runAction(id, invitationService.staffAccept, 'Invitación aprobada.'),
    [runAction],
  );

  // POST /invitations/{id}/staff-reject no acepta ningún campo de motivo
  // (InvitationService.StaffRejectAsync solo recibe el id) — el motivo que el usuario
  // escribe en el modal no se envía ni se guarda en ningún lado. El mensaje anterior
  // decía "Motivo registrado", lo cual era falso; ahora solo confirma el rechazo.
  const handleRejectWithReason = useCallback(
    (id, _reason) => runAction(
      id,
      invitationService.staffReject,
      'Invitación rechazada.',
    ),
    [runAction],
  );

  // "Rechazar" directo y "Detalle" abren el mismo modal: el motivo es obligatorio
  // para rechazar, así que no tiene sentido un rechazo de un solo toque.
  const openModal = useCallback((id) => {
    setSelectedItem(items.find((v) => v.id === id) ?? null);
    setModalVisible(true);
  }, [items]);

  const modalItem = useMemo(() => (selectedItem ? {
    id: selectedItem.id,
    doctorName: selectedItem.name,
    specialty: selectedItem.profession ?? selectedItem.email,
    requestedBy: {
      name: selectedItem.requestedBy ?? 'Administración',
      role: selectedItem.sessionTitle ?? 'Sesión no disponible',
    },
  } : null), [selectedItem]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Encabezado ── */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.titleRow}>
            <Ionicons
              name="checkmark-done-circle"
              size={22}
              color={theme.primaryText}
              {...a11yDecorative}
            />
            <Text style={styles.title} accessibilityRole="header">Cola de Validaciones</Text>
          </View>
          <Text style={styles.subtitle}>
            {loading ? 'Cargando solicitudes…'
              : items.length === 0 ? 'No hay solicitudes pendientes'
              : `${items.length} ${items.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}`
                + (urgentCount > 0 ? ` · ${urgentCount} por vencer` : '')}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={load}
            disabled={loading}
            {...a11yButton('Actualizar', { disabled: loading })}
          >
            <Ionicons name="refresh" size={18} color={theme.textPrimary} {...a11yDecorative} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => safeGoBack(navigation)}
            activeOpacity={0.8}
            {...a11yButton('Volver')}
          >
            <Ionicons name="arrow-back" size={16} color={theme.textPrimary} {...a11yDecorative} />
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filtros: solo aparecen si hay algo urgente que separar ── */}
      {urgentCount > 0 && !loading && (
        <View style={styles.filterRow} accessibilityRole="tablist">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = f.key === 'urgent' ? urgentCount : items.length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(f.key)}
                {...a11yTab(`${f.label}, ${count}`, active)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
                <View style={[styles.filterCount, active && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.stateBox}>
            <View style={styles.emptyIcon} {...a11yDecorative}>
              <Ionicons name="checkmark-done" size={34} color={theme.status.success.fg} />
            </View>
            <Text style={styles.emptyTitle}>Todo al día</Text>
            <Text style={styles.emptyText}>
              {filter === 'urgent'
                ? 'Ninguna solicitud está por vencer.'
                : 'No hay solicitudes pendientes de validación.'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {visible.map((item) => (
              <View
                key={item.id}
                style={[styles.gridItem, columns === 2 && styles.gridItemHalf]}
              >
                <ValidationCard
                  item={item}
                  onApprove={handleApprove}
                  onReject={openModal}
                  onReview={openModal}
                  busy={busyId === item.id}
                  compact={compact}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmApprovalModal
        visible={modalVisible}
        item={modalItem}
        onApprove={handleApprove}
        onReject={handleRejectWithReason}
        onCancel={() => { setModalVisible(false); setSelectedItem(null); }}
        busy={busyId != null}
      />
    </SafeAreaView>
  );
}

const makeStyles = (t, compact) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 12,
      paddingHorizontal: compact ? 14 : 20,
      paddingTop: 14,
      paddingBottom: 10,
    },
    headerMain: { flex: 1, minWidth: 200, gap: 2 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: t.textPrimary, ...TEXT_STYLES.screenTitle },
    subtitle: { fontSize: FONT_SIZE.md, color: t.textMuted },

    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: {
      width: MIN_TOUCH_SIZE,
      height: MIN_TOUCH_SIZE,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, minHeight: MIN_TOUCH_SIZE, borderRadius: 10,
      backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
    },
    backBtnText: { color: t.textPrimary, ...TEXT_STYLES.bodyBold },

    filterRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: compact ? 14 : 20,
      paddingBottom: 10,
    },
    filterPill: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      paddingHorizontal: 14, minHeight: MIN_TOUCH_SIZE - 8,
      borderRadius: 999,
      backgroundColor: t.card,
      borderWidth: 1.5, borderColor: t.border,
    },
    filterPillActive: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    filterText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: t.textSecondary },
    filterTextActive: { color: t.onPrimarySolid },
    filterCount: {
      minWidth: 22, alignItems: 'center',
      borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1,
      backgroundColor: t.pill,
    },
    filterCountActive: { backgroundColor: t.scrim },
    filterCountText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: t.textSecondary },
    filterCountTextActive: { color: t.onPrimarySolid },

    list: {
      paddingHorizontal: compact ? 14 : 20,
      paddingBottom: 28,
      gap: 12,
      maxWidth: 1100,
      width: '100%',
      alignSelf: 'center',
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '100%' },
    // `calc`-like: dos columnas dejando el gap entre ellas.
    gridItemHalf: { width: '48.6%', flexGrow: 1 },

    stateBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 70 },
    emptyIcon: {
      width: 68, height: 68, borderRadius: 34,
      backgroundColor: t.status.success.bg,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    emptyText: { ...TEXT_STYLES.body, color: t.textMuted, textAlign: 'center', maxWidth: 320 },
  });
