import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROLES, ROLE_LABELS } from '../../constants';
import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, a11yGroup, a11yModal, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import Toast from '../../components/Toast';
import { auditService, invitationService, sessionService, userService } from '../../services';
import api from '../../services/api';

const ALL_ROLE_CODES = Object.values(ROLES);

const HERO_IMAGE = require('../../assets/bomberosEjercitando.jpg');

const ROLE_OPTIONS = ['Todos los roles', 'ADMIN', 'MEDICO', 'CAPACITADOR', 'ASPIRANTE', 'JEFE', 'INVESTIGADOR'];

const ROLE_LABEL = {
  SYSTEM_ADMIN: 'ADMIN',
  ADMIN: 'ADMIN',
  MEDICAL: 'MEDICO',
  CAPACITATOR: 'CAPACITADOR',
  FIREFIGHTER_TRAINEE: 'ASPIRANTE',
  FIRE_CHIEF: 'JEFE',
  RESEARCHER: 'INVESTIGADOR',
};

// Tono semántico por rol; el color concreto sale del tema en ambos modos.
const ROLE_TONE = {
  ADMIN: 'info',
  MEDICO: 'success',
  CAPACITADOR: 'warning',
  ASPIRANTE: 'info',
  JEFE: 'danger',
  INVESTIGADOR: 'neutral',
};

function getUserRole(user) {
  const rawRole = user.roles?.[0] ?? user.role ?? user.primaryRole ?? null;
  if (!rawRole) return '—';
  return ROLE_LABEL[rawRole] ?? rawRole;
}

function getUserCode(user, index) {
  if (user.code) return user.code;
  if (user.applicantCode) return `#${user.applicantCode}`;
  const role = getUserRole(user).slice(0, 3);
  return `#${role}-${String(index + 1).padStart(3, '0')}`;
}

/**
 * En compacto, la tabla de usuarios pasa a ancho fijo (ver `codeColumn`/etc. en
 * makeStyles) y necesita desplazamiento horizontal para no aplastar las columnas.
 * En ancho normal no hace falta: se renderiza tal cual, sin envoltorio de scroll.
 */
function TableScrollWrap({ isCompact, contentStyle, children }) {
  if (!isCompact) return children;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={contentStyle}>
      <View style={{ width: contentStyle?.minWidth }}>{children}</View>
    </ScrollView>
  );
}

export default function SystemDashboard({ navigation }) {
  const { user, canAccessRoute } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const styles = useMemo(() => makeStyles(theme, isCompact), [theme, isCompact]);

  const [loading,          setLoading]          = useState(true);
  const [users,            setUsers]            = useState([]);
  const [sessions,         setSessions]         = useState([]);
  const [pendingInvitesList, setPendingInvitesList] = useState([]);
  const [roleFilter,       setRoleFilter]       = useState(ROLE_OPTIONS[0]);
  const [failedSources,    setFailedSources]    = useState([]);
  const [toast,            setToast]            = useState(null);

  // ── Invitaciones pendientes (ver/revocar) ──
  const [invitesModalVisible, setInvitesModalVisible] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  // ── Enviar invitación ──
  const [inviteVisible, setInviteVisible] = useState(false);
  const [inviteEmail,   setInviteEmail]   = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError,   setInviteError]   = useState('');

  // ── Editar permisos ──
  const [permTarget,     setPermTarget]     = useState(null); // usuario (item) o null
  const [permSelected,   setPermSelected]   = useState([]);
  const [permLoading,    setPermLoading]    = useState(false);
  const [permSaving,     setPermSaving]     = useState(false);
  const [permError,      setPermError]      = useState('');

  // ── Auditoría ──
  const [auditItems,   setAuditItems]   = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError,   setAuditError]   = useState(null);

  useEffect(() => {
    let alive = true;
    setAuditLoading(true);
    auditService.getAll()
      .then((items) => { if (alive) setAuditItems(items); })
      .catch(() => { if (alive) setAuditError('No se pudo cargar el registro de auditoría.'); })
      .finally(() => { if (alive) setAuditLoading(false); });
    return () => { alive = false; };
  }, []);

  const loadInvites = useCallback(() => (
    invitationService.getAll().then((all) => {
      const pending = all.filter((i) => i.status === 'Pending');
      setPendingInvitesList(pending);
      return pending;
    })
  ), []);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      api.get('/users'),
      sessionService.getAll(),
      loadInvites(),
    ]).then(([usersR, sessionsR, invitesR]) => {
      if (!alive) return;
      const failed = [];

      if (usersR.status === 'fulfilled') setUsers(usersR.value.data?.data ?? []);
      else failed.push('usuarios');

      if (sessionsR.status === 'fulfilled') setSessions(sessionsR.value);
      else failed.push('sesiones');

      if (invitesR.status === 'rejected') failed.push('invitaciones');

      setFailedSources(failed);
    }).finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [loadInvites]);

  const handleRevokeInvite = useCallback(async (invitation) => {
    setRevokingId(invitation.invitationId);
    try {
      await invitationService.revoke(invitation.invitationId);
      setPendingInvitesList((prev) => prev.filter((i) => i.invitationId !== invitation.invitationId));
      setToast({ message: `Invitación a ${invitation.targetEmail} revocada.`, tone: 'success' });
    } catch (e) {
      if (!e.response) {
        setPendingInvitesList((prev) => prev.filter((i) => i.invitationId !== invitation.invitationId));
        setToast({ message: 'Sin conexión: la revocación quedó guardada localmente y se aplicará cuando vuelva la señal.', tone: 'warning' });
        setRevokingId(null);
        return;
      }
      setToast({ message: e?.response?.data?.message ?? 'No se pudo revocar la invitación.', tone: 'error' });
    } finally {
      setRevokingId(null);
    }
  }, []);

  // Sin fallback a datos ficticios: si la API de usuarios falla, la tabla queda vacía
  // y se avisa. Antes se mostraban usuarios inventados como si fueran reales.
  const normalizedUsers = useMemo(
    () => users.map((item, index) => ({
      ...item,
      code: item.code ?? getUserCode(item, index),
      roleLabel: item.roleLabel ?? getUserRole(item),
    })),
    [users],
  );

  const visibleUsers = useMemo(
    () => normalizedUsers
      .filter((item) => roleFilter === ROLE_OPTIONS[0] || item.roleLabel === roleFilter)
      .slice(0, 4),
    [normalizedUsers, roleFilter],
  );

  const stats = useMemo(() => {
    // «—» cuando el dato no está disponible. Nunca se inventa un número de relleno.
    const fmt = (v) => (loading || v === null || v === undefined ? '—' : String(v));
    return [
      {
        id: 'users', label: 'USUARIOS\nTOTALES',
        value: fmt(failedSources.includes('usuarios') ? null : users.length),
        icon: 'people-outline', tone: 'info',
      },
      {
        id: 'sessions', label: 'SESIONES\nACTIVAS',
        value: fmt(failedSources.includes('sesiones') ? null : sessions.filter((s) => s.status === 'ACTIVE').length),
        icon: 'log-in-outline', tone: 'primary', live: true,
      },
      {
        id: 'invites', label: 'INVITACIONES\nPENDIENTES',
        value: fmt(failedSources.includes('invitaciones') ? null : pendingInvitesList.length),
        icon: 'person-add-outline', tone: 'warning',
        onPress: () => setInvitesModalVisible(true),
      },
    ];
  }, [loading, users, sessions, pendingInvitesList, failedSources]);

  const cycleRoleFilter = useCallback(() => {
    setRoleFilter((current) => {
      const nextIndex = (ROLE_OPTIONS.indexOf(current) + 1) % ROLE_OPTIONS.length;
      return ROLE_OPTIONS[nextIndex];
    });
  }, []);

  const handleSendInvite = useCallback(async () => {
    const email = inviteEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Ingresa un correo electrónico válido.');
      return;
    }
    setInviteSending(true);
    setInviteError('');
    try {
      const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
      await invitationService.create({ targetEmail: email, expiresAt });
      setInviteVisible(false);
      setInviteEmail('');
      setToast({ message: `Invitación enviada a ${email}.`, tone: 'success' });
    } catch (e) {
      if (!e.response) {
        setInviteVisible(false);
        setInviteEmail('');
        setToast({ message: 'Sin conexión: la invitación quedó guardada localmente y se enviará cuando vuelva la señal.', tone: 'warning' });
        setInviteSending(false);
        return;
      }
      setInviteError(e?.response?.data?.message ?? 'No se pudo enviar la invitación.');
    } finally {
      setInviteSending(false);
    }
  }, [inviteEmail]);

  const handleOpenPermissions = useCallback(async (item) => {
    setPermTarget(item);
    setPermError('');
    setPermLoading(true);
    try {
      const roleCodes = await userService.getRoles(item.userId);
      setPermSelected(roleCodes);
    } catch {
      // Sin roles previos resueltos, se parte de un checklist vacío en vez de bloquear
      // el modal — el admin igual puede armar el set de roles desde cero.
      setPermSelected([]);
    } finally {
      setPermLoading(false);
    }
  }, []);

  const toggleRoleSelected = useCallback((code) => {
    setPermSelected((prev) => (
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    ));
  }, []);

  const handleSavePermissions = useCallback(async () => {
    if (!permTarget) return;
    if (permSelected.length === 0) {
      setPermError('Selecciona al menos un rol.');
      return;
    }
    setPermSaving(true);
    setPermError('');
    try {
      await userService.updateRoles(permTarget.userId, permSelected);
      setUsers((prev) => prev.map((u) => (
        u.userId === permTarget.userId ? { ...u, roleLabel: getUserRole({ roles: permSelected }) } : u
      )));
      setPermTarget(null);
      setToast({ message: `Permisos de ${permTarget.code} actualizados.`, tone: 'success' });
    } catch (e) {
      if (!e.response) {
        setUsers((prev) => prev.map((u) => (
          u.userId === permTarget.userId ? { ...u, roleLabel: getUserRole({ roles: permSelected }) } : u
        )));
        setPermTarget(null);
        setToast({ message: 'Sin conexión: los permisos quedaron guardados localmente y se aplicarán cuando vuelva la señal.', tone: 'warning' });
        setPermSaving(false);
        return;
      }
      setPermError(e?.response?.data?.message ?? 'No se pudieron guardar los permisos.');
    } finally {
      setPermSaving(false);
    }
  }, [permTarget, permSelected]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ImageBackground
          source={HERO_IMAGE}
          style={styles.hero}
          imageStyle={styles.heroImage}
          accessible={false}
        >
          <View style={styles.heroOverlay} {...a11yDecorative} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} accessibilityRole="header">
              BIENVENIDO, {(user?.name ?? 'ADMINISTRADOR').toUpperCase()}
            </Text>
            <Text style={styles.heroSubtitle}>
              ADMINISTRACIÓN DEL SISTEMA · ACCESO GLOBAL
            </Text>
            <View style={styles.heroActions}>
              {canAccessRoute(ROUTES.PEOPLE) && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation?.navigate(ROUTES.PEOPLE)}
                  activeOpacity={0.85}
                  {...a11yButton('Gestionar usuarios')}
                >
                  <Ionicons name="people-outline" size={17} color="#FFFFFF" {...a11yDecorative} />
                  <Text style={styles.primaryButtonText}>Gestionar Usuarios</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => { setInviteEmail(''); setInviteError(''); setInviteVisible(true); }}
                activeOpacity={0.85}
                {...a11yButton('Enviar invitación')}
              >
                <Ionicons name="person-add-outline" size={17} color="#FFFFFF" {...a11yDecorative} />
                <Text style={styles.secondaryButtonText}>Enviar invitación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        {failedSources.length > 0 && !loading && (
          <View style={styles.warningBanner} accessibilityRole="alert">
            <Ionicons
              name="warning-outline"
              size={18}
              color={theme.status.warning.fg}
              {...a11yDecorative}
            />
            <Text style={styles.warningText}>
              No se pudieron cargar: {failedSources.join(', ')}. Los valores afectados se
              muestran como «—».
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          {stats.map((stat) => {
            const tone = stat.tone === 'primary'
              ? { bg: theme.primarySoft, fg: theme.primaryText, solid: theme.primarySolid }
              : theme.status[stat.tone];
            const CardComponent = stat.onPress ? TouchableOpacity : View;

            return (
              <CardComponent
                key={stat.id}
                style={[styles.statCard, { borderLeftColor: tone.solid }]}
                activeOpacity={stat.onPress ? 0.8 : undefined}
                onPress={stat.onPress}
                {...(stat.onPress
                  ? a11yButton(`${stat.label.replace('\n', ' ')}: ${stat.value}`, { hint: 'Ver invitaciones pendientes' })
                  : a11yGroup(`${stat.label.replace('\n', ' ')}: ${stat.value}`))}
              >
                <View style={[styles.statIcon, { backgroundColor: tone.bg }]} {...a11yDecorative}>
                  <Ionicons name={stat.icon} size={22} color={tone.fg} />
                </View>
                <View style={styles.statTextBox}>
                  <View style={styles.statLabelRow}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    {stat.live && (
                      <View style={styles.liveBadge}>
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
                {stat.onPress && (
                  <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} {...a11yDecorative} />
                )}
              </CardComponent>
            );
          })}
        </View>

        <View style={styles.mainGrid}>
          {/* ── Gestión de usuarios ── */}
          <View style={styles.usersPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle} accessibilityRole="header">Gestión de Usuarios</Text>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel} nativeID="roleFilterLabel">FILTRAR POR ROL:</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={cycleRoleFilter}
                  activeOpacity={0.8}
                  {...a11yButton(`Filtrar por rol: ${roleFilter}`, {
                    hint: 'Cambia al siguiente rol de la lista',
                  })}
                >
                  <Text style={styles.filterText}>{roleFilter}</Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={theme.icon}
                    {...a11yDecorative}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TableScrollWrap isCompact={isCompact} contentStyle={styles.tableScrollContent}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, styles.codeColumn]}>CÓDIGO</Text>
              <Text style={[styles.tableHeadText, styles.roleColumn]}>ROL</Text>
              <Text style={[styles.tableHeadText, styles.statusColumn]}>ESTADO</Text>
              <Text style={[styles.tableHeadText, styles.actionColumn]}>ACCIÓN</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} style={styles.loading} />
            ) : visibleUsers.length === 0 ? (
              <Text style={styles.emptyText}>
                {failedSources.includes('usuarios')
                  ? 'No se pudo cargar la lista de usuarios.'
                  : 'No hay usuarios que coincidan con el filtro.'}
              </Text>
            ) : (
              visibleUsers.map((item) => {
                const tone = theme.status[ROLE_TONE[item.roleLabel] ?? 'neutral'];
                const active = String(item.accountStatus).toLowerCase() === 'active';

                return (
                  <View key={item.userId ?? item.code} style={styles.tableRow}>
                    <Text style={[styles.codeText, styles.codeColumn]}>{item.code}</Text>
                    <View style={styles.roleColumn}>
                      <View style={[styles.roleBadge, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: tone.fg }]}>
                          {item.roleLabel}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusColumn, styles.statusCell]}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: active ? theme.status.success.solid : theme.status.neutral.solid },
                        ]}
                        {...a11yDecorative}
                      />
                      <Text style={styles.statusText}>{active ? 'Activo' : 'Inactivo'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionColumn, styles.editButton]}
                      activeOpacity={0.8}
                      onPress={() => handleOpenPermissions(item)}
                      {...a11yButton(`Editar permisos de ${item.code}`)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={14}
                        color={theme.primaryText}
                        {...a11yDecorative}
                      />
                      <Text style={styles.editText}>Editar permisos</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            </TableScrollWrap>
          </View>

          {/* ── Registro de auditoría ── */}
          <View style={styles.auditPanel}>
            <Text style={styles.panelTitle} accessibilityRole="header">Registro de Auditoría</Text>

            {auditLoading ? (
              <ActivityIndicator size="small" color={theme.primary} style={styles.loading} />
            ) : auditError ? (
              <Text style={styles.emptyText} accessibilityRole="alert">{auditError}</Text>
            ) : auditItems.length === 0 ? (
              <View style={styles.auditEmpty}>
                <Ionicons name="shield-checkmark-outline" size={28} color={theme.iconMuted} {...a11yDecorative} />
                <Text style={styles.auditEmptyTitle}>Sin eventos todavía</Text>
                <Text style={styles.auditEmptyText}>
                  Los accesos a datos médicos y otros eventos auditados aparecerán aquí
                  a medida que ocurran.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.auditList} showsVerticalScrollIndicator={false}>
                {auditItems.slice(0, 30).map((ev) => (
                  <View key={ev.id} style={styles.auditRow}>
                    <View style={styles.auditRowTop}>
                      <Text style={styles.auditEvent}>{ev.event}</Text>
                      <Text style={styles.auditTime}>
                        {new Date(ev.occurredAt).toLocaleString('es-ES', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    {!!ev.resourceType && (
                      <Text style={styles.auditResource}>
                        {ev.resourceType}{ev.resourceId ? ` · ${String(ev.resourceId).slice(0, 8)}…` : ''}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Modal: enviar invitación ── */}
      <Modal
        visible={inviteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !inviteSending && setInviteVisible(false)}
      >
        <KeyboardAvoidingView style={styles.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={() => !inviteSending && setInviteVisible(false)} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback accessible={false}>
              <View style={styles.modalCard} {...a11yModal('Enviar invitación')}>
                <Text style={styles.modalTitle} accessibilityRole="header">Enviar Invitación</Text>
                <Text style={styles.modalSub}>
                  Se enviará un enlace de invitación válido por 7 días al correo indicado.
                </Text>

                <Text style={styles.fieldLabel} nativeID="invite-email">Correo electrónico</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={inviteEmail}
                  onChangeText={(v) => { setInviteEmail(v); setInviteError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="persona@smab.app"
                  placeholderTextColor={theme.textPlaceholder}
                  accessibilityLabel="Correo electrónico"
                  accessibilityLabelledBy="invite-email"
                />
                {!!inviteError && <Text style={styles.modalError} accessibilityRole="alert">{inviteError}</Text>}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setInviteVisible(false)}
                    disabled={inviteSending}
                    {...a11yButton('Cancelar', { disabled: inviteSending })}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, inviteSending && styles.modalSubmitBtnDisabled]}
                    onPress={handleSendInvite}
                    disabled={inviteSending}
                    {...a11yButton('Enviar', { disabled: inviteSending, busy: inviteSending })}
                  >
                    {inviteSending
                      ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                      : <Text style={styles.modalSubmitText}>Enviar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: editar permisos ── */}
      <Modal
        visible={!!permTarget}
        transparent
        animationType="fade"
        onRequestClose={() => !permSaving && setPermTarget(null)}
      >
        <TouchableWithoutFeedback onPress={() => !permSaving && setPermTarget(null)} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback accessible={false}>
              <View style={styles.modalCard} {...a11yModal(`Editar permisos de ${permTarget?.code ?? ''}`)}>
                <Text style={styles.modalTitle} accessibilityRole="header">
                  Editar Permisos {permTarget ? `— ${permTarget.code}` : ''}
                </Text>
                <Text style={styles.modalSub}>
                  Un usuario puede tener más de un rol; los permisos son la unión de todos.
                </Text>

                {permLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} style={styles.loading} />
                ) : (
                  <ScrollView
                    style={styles.roleList}
                    contentContainerStyle={styles.roleListContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {ALL_ROLE_CODES.map((code) => {
                      const checked = permSelected.includes(code);
                      return (
                        <TouchableOpacity
                          key={code}
                          style={[styles.roleRow, checked && styles.roleRowActive]}
                          onPress={() => toggleRoleSelected(code)}
                          activeOpacity={0.8}
                          accessible
                          accessibilityRole="checkbox"
                          accessibilityLabel={ROLE_LABELS[code] ?? code}
                          accessibilityState={{ checked }}
                        >
                          <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                            {checked && <Ionicons name="checkmark" size={13} color={theme.onPrimarySolid} {...a11yDecorative} />}
                          </View>
                          <Text style={styles.roleRowText}>{ROLE_LABELS[code] ?? code}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {!!permError && <Text style={styles.modalError} accessibilityRole="alert">{permError}</Text>}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setPermTarget(null)}
                    disabled={permSaving}
                    {...a11yButton('Cancelar', { disabled: permSaving })}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, permSaving && styles.modalSubmitBtnDisabled]}
                    onPress={handleSavePermissions}
                    disabled={permSaving || permLoading}
                    {...a11yButton('Guardar', { disabled: permSaving || permLoading, busy: permSaving })}
                  >
                    {permSaving
                      ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                      : <Text style={styles.modalSubmitText}>Guardar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Modal: invitaciones pendientes (ver / revocar) ── */}
      <Modal
        visible={invitesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInvitesModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setInvitesModalVisible(false)} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback accessible={false}>
              <View style={styles.modalCard} {...a11yModal('Invitaciones pendientes')}>
                <Text style={styles.modalTitle} accessibilityRole="header">Invitaciones Pendientes</Text>
                <Text style={styles.modalSub}>
                  Cancela una invitación antes de que el destinatario responda.
                </Text>

                {pendingInvitesList.length === 0 ? (
                  <Text style={styles.emptyListText}>No hay invitaciones pendientes.</Text>
                ) : (
                  <ScrollView style={styles.inviteList} contentContainerStyle={{ gap: 8 }}>
                    {pendingInvitesList.map((inv) => {
                      const revoking = revokingId === inv.invitationId;
                      return (
                        <View key={inv.invitationId} style={styles.inviteRow}>
                          <View style={styles.inviteRowText}>
                            <Text style={styles.inviteEmailText} numberOfLines={1}>{inv.targetEmail}</Text>
                            <Text style={styles.inviteAgoText}>
                              Enviada el {new Date(inv.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.inviteRevokeBtn, revoking && styles.modalSubmitBtnDisabled]}
                            onPress={() => handleRevokeInvite(inv)}
                            disabled={revoking}
                            {...a11yButton(`Revocar invitación a ${inv.targetEmail}`, { disabled: revoking, busy: revoking })}
                          >
                            {revoking
                              ? <ActivityIndicator size="small" color={theme.status.danger.fg} />
                              : <Text style={styles.inviteRevokeText}>Revocar</Text>}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setInvitesModalVisible(false)}
                    {...a11yButton('Cerrar')}
                  >
                    <Text style={styles.modalCancelText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (t, isCompact) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    content: { padding: 16, gap: 16 },

    hero: { minHeight: 190, borderRadius: 8, overflow: 'hidden', justifyContent: 'center' },
    heroImage: { borderRadius: 8 },
    // Velo fijo para asegurar contraste del texto blanco sobre la foto.
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.58)' },
    heroContent: { paddingHorizontal: isCompact ? 20 : 32, paddingVertical: 28, gap: 12 },
    heroTitle: { color: '#FFFFFF', fontSize: isCompact ? 24 : 34, fontWeight: '900' },
    heroSubtitle: { color: '#EAEAEA', fontSize: isCompact ? 14 : 17, fontWeight: '800' },
    heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
    primaryButton: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#C94E1B', borderRadius: 7,
      paddingHorizontal: 18, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
    },
    primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    secondaryButton: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderRadius: 7, borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.55)',
      backgroundColor: 'rgba(0,0,0,0.35)',
      paddingHorizontal: 18, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
    },
    secondaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

    warningBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.status.warning.bg,
      borderWidth: 1, borderColor: t.status.warning.border,
      borderRadius: 10, padding: 12,
    },
    warningText: { flex: 1, fontSize: 13, color: t.status.warning.fg },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flex: 1, minWidth: 170,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border, borderLeftWidth: 4,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    statIcon: { width: 44, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    statTextBox: { flex: 1 },
    statLabelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    statLabel: { color: t.textMuted, fontSize: 11, fontWeight: '900', lineHeight: 14 },
    liveBadge: {
      backgroundColor: t.status.danger.solid, borderRadius: 10,
      paddingHorizontal: 5, paddingVertical: 2,
    },
    liveText: { color: t.status.danger.onSolid, fontSize: 9, fontWeight: '900' },
    statValue: { color: t.textPrimary, fontSize: 27, fontWeight: '900', lineHeight: 32 },

    mainGrid: { flexDirection: isCompact ? 'column' : 'row', gap: 18, alignItems: 'stretch' },
    usersPanel: {
      flex: isCompact ? undefined : 2.15,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border,
      padding: 18, minHeight: 360,
    },
    auditPanel: {
      flex: isCompact ? undefined : 1,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border,
      padding: 18, minHeight: 360,
    },
    panelHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20,
    },
    panelTitle: { color: t.textPrimary, fontSize: 19, fontWeight: '900' },
    filterGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    filterLabel: { color: t.textMuted, fontSize: 11, fontWeight: '900' },
    filterButton: {
      minWidth: 160,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      borderRadius: 8, borderWidth: 1, borderColor: t.border,
      backgroundColor: t.cardAlt,
      paddingHorizontal: 12, minHeight: MIN_TOUCH_SIZE,
    },
    filterText: { color: t.textPrimary, fontSize: 13, fontWeight: '700' },

    tableHeader: {
      flexDirection: 'row', borderBottomWidth: 1,
      borderBottomColor: t.border, paddingBottom: 12,
    },
    tableHeadText: { color: t.textMuted, fontSize: 11, fontWeight: '900' },
    tableRow: {
      minHeight: 58, flexDirection: 'row', alignItems: 'center',
      borderBottomWidth: 1, borderBottomColor: t.divider,
    },
    // En compacto las columnas dejan de repartirse por flex (se aplastaban hasta ser
    // ilegibles) y pasan a ancho fijo dentro de una tabla que se desplaza en horizontal
    // — ver TableScrollWrap más abajo en el JSX.
    codeColumn:   isCompact ? { width: 90 }  : { flex: 1.15 },
    roleColumn:   isCompact ? { width: 120 } : { flex: 1.2 },
    statusColumn: isCompact ? { width: 100 } : { flex: 1.15 },
    actionColumn: isCompact ? { width: 170 } : { flex: 1.25 },
    tableScrollContent: { minWidth: isCompact ? 480 : undefined },
    codeText: { color: t.textPrimary, fontSize: 13, fontWeight: '900' },
    roleBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
    roleBadgeText: { fontSize: 11, fontWeight: '900' },
    statusCell: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { color: t.textSecondary, fontSize: 13, fontWeight: '700' },
    editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: MIN_TOUCH_SIZE },
    editText: { color: t.primaryText, fontSize: 13, fontWeight: '800' },
    loading: { paddingVertical: 32 },
    emptyText: { color: t.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 32 },

    auditEmpty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 32, flex: 1 },
    auditEmptyTitle: { color: t.textPrimary, fontSize: 15, fontWeight: '800' },
    auditEmptyText: { color: t.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },

    auditList: { flex: 1 },
    auditRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.divider, gap: 3 },
    auditRowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    auditEvent: { fontSize: 13, fontWeight: '700', color: t.textPrimary },
    auditTime: { fontSize: 11, color: t.textMuted },
    auditResource: { fontSize: 12, color: t.textSecondary },

    // ── Modales (invitar / editar permisos) ──
    kbAvoid: { flex: 1 },
    modalOverlay: {
      flex: 1, backgroundColor: t.overlay,
      alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    modalCard: {
      width: '100%', maxWidth: 420, backgroundColor: t.card, borderRadius: 16,
      padding: 20, gap: 12, borderWidth: 1, borderColor: t.border,
    },
    modalTitle: { fontSize: 17, fontWeight: '800', color: t.textPrimary },
    modalSub: { fontSize: 13, color: t.textSecondary, lineHeight: 18, marginTop: -6 },
    fieldLabel: { fontSize: 13, color: t.textSecondary, fontWeight: '600' },
    fieldInput: {
      borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 14, backgroundColor: t.cardAlt, borderColor: t.borderStrong, color: t.textPrimary,
    },
    modalError: { fontSize: 12, color: t.status.danger.fg },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalCancelBtn: {
      flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center',
      borderRadius: 10, borderWidth: 1.5, borderColor: t.borderStrong,
    },
    modalCancelText: { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    modalSubmitBtn: {
      flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center',
      borderRadius: 10, backgroundColor: t.primarySolid,
    },
    modalSubmitBtnDisabled: { opacity: 0.7 },
    modalSubmitText: { fontSize: 14, fontWeight: '700', color: t.onPrimarySolid },

    roleList: { maxHeight: 260 },
    roleListContent: { gap: 8, paddingBottom: 2 },
    roleRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8,
      borderWidth: 1, borderColor: t.border, backgroundColor: t.card,
    },
    roleRowActive: { borderColor: t.primarySolid, backgroundColor: t.primarySoft },
    checkbox: {
      width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: t.borderStrong,
      alignItems: 'center', justifyContent: 'center', backgroundColor: t.cardAlt,
    },
    checkboxActive: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    roleRowText: { fontSize: 13, fontWeight: '600', color: t.textPrimary },

    emptyListText: { fontSize: 13, color: t.textSecondary, textAlign: 'center', paddingVertical: 12 },
    inviteList: { maxHeight: 320 },
    inviteRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8,
      borderWidth: 1, borderColor: t.border, backgroundColor: t.card,
    },
    inviteRowText: { flex: 1, minWidth: 0, gap: 2 },
    inviteEmailText: { fontSize: 13, fontWeight: '700', color: t.textPrimary },
    inviteAgoText: { fontSize: 11, color: t.textSecondary },
    inviteRevokeBtn: {
      minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center',
      borderRadius: 8, borderWidth: 1.5, borderColor: t.status.danger.fg,
    },
    inviteRevokeText: { fontSize: 12, fontWeight: '700', color: t.status.danger.fg },
  });
