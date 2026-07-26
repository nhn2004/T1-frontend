import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, MIN_TOUCH_SIZE } from '../../constants/a11y';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import { useAuditOnMount } from '../../hooks/useAuditTrail';
import Toast from '../../components/Toast';

import WelcomeBanner        from './components/WelcomeBanner';
import ValidationCard       from './components/ValidationCard';
import StatCard             from './components/StatCard';
import ActivityRow          from './components/ActivityRow';
import ConfirmApprovalModal from './components/ConfirmApprovalModal';

import { invitationService }      from '../../services/invitationService';
import { healthPersonnelService } from '../../services/healthPersonnelService';
import { sessionService }         from '../../services/sessionService';

const MAX_VISIBLE = 1;

function timeAgo(iso) {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} hora${hrs > 1 ? 's' : ''}`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

export default function MedicalDashboard({ navigation }) {
  const user  = useAuthStore((s) => s.user);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const styles = useMemo(() => makeStyles(theme, isWide), [theme, isWide]);

  // Requisito de auditoría: esta pantalla lista solicitudes de personal médico.
  useAuditOnMount('MEDICAL_VALIDATION_QUEUE', user?.userId);

  const [queue,          setQueue]          = useState([]);
  const [allInvitations, setAllInvitations] = useState([]);
  const [staffCount,     setStaffCount]     = useState(null);
  const [sessionCount,   setSessionCount]   = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [busyId,         setBusyId]         = useState(null);
  const [toast,          setToast]          = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      invitationService.getAll(),
      healthPersonnelService.getAll(),
      sessionService.getAll(),
      invitationService.getPendingDetailed(),
    ]);
    const [invsR, staffR, sessR, pendingR] = results;

    if (invsR.status === 'fulfilled') setAllInvitations(invsR.value);
    // La cola llega enriquecida con la persona y la sesión reales; el listado crudo
    // solo se usa para la actividad reciente.
    if (pendingR.status === 'fulfilled') setQueue(pendingR.value);
    if (staffR.status === 'fulfilled') setStaffCount(staffR.value.length);
    if (sessR.status === 'fulfilled')  setSessionCount(sessR.value.length);

    if (results.some((r) => r.status === 'rejected')) {
      setToast({ message: 'Algunos datos no se pudieron cargar.', tone: 'error' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /**
   * Ejecuta una acción sobre una invitación y SOLO actualiza la lista si el servidor
   * confirmó el cambio. Antes se quitaba el elemento pasara lo que pasara, así que un
   * fallo de red mostraba "aprobado" mientras el backend seguía con la invitación
   * pendiente.
   */
  const runInvitationAction = useCallback(async (id, action, successMessage) => {
    setBusyId(id);
    setToast(null);
    try {
      await action(id);
      setQueue((prev) => prev.filter((i) => i.id !== id));
      setToast({ message: successMessage, tone: 'success' });
      setModalVisible(false);
      setSelectedItem(null);
      // Refresca la actividad reciente con el estado real del servidor.
      invitationService.getAll().then(setAllInvitations).catch(() => {});
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

  // ConfirmApprovalModal usa su propio vocabulario; se adapta aquí en vez de
  // arrastrar nombres de campo antiguos por toda la cola.
  const modalItem = useMemo(() => (selectedItem ? {
    id: selectedItem.id,
    doctorName: selectedItem.name,
    specialty: selectedItem.profession ?? selectedItem.email,
    requestedBy: {
      name: selectedItem.requestedBy ?? 'Administración',
      role: selectedItem.sessionTitle ?? 'Sesión no disponible',
    },
  } : null), [selectedItem]);

  const displayQueue   = queue.slice(0, MAX_VISIBLE);
  const remainingCount = queue.length;

  const director = {
    name: user?.name ?? 'Personal médico',
    title: 'Dirección Médica',
  };

  const statCards = useMemo(() => {
    const fmt = (v) => (loading || v === null ? '—' : String(v));
    return [
      {
        id: 'stat_invitations',
        title: 'Invitaciones Pendientes',
        value: loading ? '—' : String(remainingCount),
        subtitle: 'Esperando confirmación',
        iconName: 'send',
        iconBg: 'warning',
      },
      {
        id: 'stat_staff',
        title: 'Personal Activo',
        value: fmt(staffCount),
        subtitle: 'Médicos y enfermeros',
        iconName: 'people',
        iconBg: 'info',
      },
      {
        id: 'stat_sessions',
        title: 'Total Sesiones',
        value: fmt(sessionCount),
        subtitle: 'Registradas en el sistema',
        iconName: 'calendar',
        iconBg: 'success',
      },
    ];
  }, [loading, remainingCount, staffCount, sessionCount]);

  const recentActivities = useMemo(
    () => allInvitations
      .filter((i) => i.status === 'Accepted' || i.status === 'Rejected')
      .sort((a, b) => new Date(b.respondedAt ?? b.createdAt) - new Date(a.respondedAt ?? a.createdAt))
      .slice(0, 4)
      .map((i) => ({
        id:       i.invitationId,
        title:    i.status === 'Accepted' ? 'Invitación aceptada' : 'Invitación rechazada',
        subtitle: i.targetEmail,
        time:     timeAgo(i.respondedAt ?? i.createdAt),
        tone:     i.status === 'Accepted' ? 'success' : 'danger',
      })),
    [allInvitations],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <WelcomeBanner name={director.name} title={director.title} />

        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        <View style={styles.middleRow}>
          {/* Cola de validaciones */}
          <View style={styles.queuePanel}>
            <View style={styles.queueHeader}>
              <View style={styles.queueTitleRow}>
                <Ionicons name="people-outline" size={18} color={theme.icon} {...a11yDecorative} />
                <Text style={styles.queueTitle} accessibilityRole="header">
                  Cola de Validaciones
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {loading ? '—' : `${remainingCount} Pendientes`}
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : displayQueue.length > 0 ? (
              displayQueue.map((item) => (
                <ValidationCard
                  key={item.id}
                  item={item}
                  onApprove={handleApprovePress}
                  onReject={handleReview}
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

            {remainingCount > 0 && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigation?.navigate(ROUTES.VALIDATION_QUEUE)}
                activeOpacity={0.8}
                {...a11yButton(`Ver todas las solicitudes, ${remainingCount} pendientes`)}
              >
                <Text style={styles.viewAllText}>
                  Ver Todas las Solicitudes ({remainingCount})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Estadísticas */}
          <View style={styles.statsPanel}>
            {statCards.map((card) => <StatCard key={card.id} {...card} />)}
          </View>
        </View>

        {/* Actividad reciente */}
        <View style={styles.activityPanel}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Actividades recientes
          </Text>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => <ActivityRow key={activity.id} {...activity} />)
          ) : (
            <Text style={styles.emptyText}>Sin actividad reciente</Text>
          )}
        </View>
      </ScrollView>

      <ConfirmApprovalModal
        visible={modalVisible}
        item={modalItem}
        onApprove={handleConfirmApproval}
        onReject={handleRejectWithReason}
        onCancel={handleCancelModal}
        busy={busyId != null}
      />
    </SafeAreaView>
  );
}

const makeStyles = (t, isWide) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    content: { padding: 14, gap: 12 },

    middleRow: {
      flexDirection: isWide ? 'row' : 'column',
      gap: 12,
    },

    queuePanel: {
      flex: isWide ? 1.1 : undefined,
      backgroundColor: t.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: t.border,
      padding: 14,
    },
    queueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    queueTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    queueTitle: { fontSize: 16, fontWeight: '700', color: t.textPrimary },
    countBadge: {
      backgroundColor: t.status.warning.bg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    countBadgeText: { color: t.status.warning.fg, fontSize: 12, fontWeight: '700' },

    viewAllBtn: {
      marginTop: 8,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: t.status.danger.border,
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewAllText: { color: t.status.danger.fg, fontSize: 14, fontWeight: '600' },

    emptyBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
    emptyText: { fontSize: 14, color: t.textMuted, paddingVertical: 4 },

    statsPanel: { flex: isWide ? 0.9 : undefined, gap: 10 },

    activityPanel: {
      backgroundColor: t.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: t.border,
      padding: 14,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 6 },
  });
