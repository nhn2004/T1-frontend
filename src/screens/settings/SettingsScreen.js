import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, useWindowDimensions, Modal, TouchableWithoutFeedback, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROLE_LABELS, ROLES } from '../../constants';
import { a11yButton, a11yDecorative, a11yModal } from '../../constants/a11y';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import useSettingsStore from '../../store/settingsStore';
import useOfflineQueueStore from '../../store/offlineQueueStore';
import useAppRefreshStore from '../../store/appRefreshStore';
import { processQueue, describeQueueItem } from '../../services/offlineSync';
import { ensureNotificationPermission } from '../../services/notifications';
import { createAndShareBackup } from '../../services/backup';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import { authService, userService } from '../../services';

import SettingsCard from './components/SettingsCard';
import ToggleRow from './components/ToggleRow';
import FormField from './components/FormField';

function formatTime(date) {
  // `offlineQueueStore` persiste `lastSyncedAt` como string ISO (AsyncStorage solo
  // guarda JSON), así que puede llegar como Date o como string según de dónde venga.
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function SettingsScreen() {
  const { user, role, updateUser, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 700;
  const isWide = width >= 1100;

  const darkMode = useSettingsStore((s) => s.darkMode);
  const pushNotifications = useSettingsStore((s) => s.pushNotifications);
  const soundAlerts = useSettingsStore((s) => s.soundAlerts);
  const autoBackup = useSettingsStore((s) => s.autoBackup);
  const language = useSettingsStore((s) => s.language);
  const toggle = useSettingsStore((s) => s.toggle);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  // A diferencia del resto de los toggles (que solo cambian un valor local), este
  // pide de verdad el permiso del sistema operativo — si el usuario lo rechaza, el
  // switch vuelve a apagarse en vez de quedar prendido mintiendo sobre el estado real.
  const handleTogglePush = useCallback(async () => {
    const turningOn = !pushNotifications;
    toggle('pushNotifications');
    if (turningOn) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        toggle('pushNotifications');
        setToast({ message: 'No se concedió el permiso de notificaciones del sistema.', tone: 'error' });
      }
    }
  }, [pushNotifications, toggle]);

  const pendingItems = useOfflineQueueStore((s) => s.pending);
  const pendingCount = pendingItems.length;
  const syncing = useOfflineQueueStore((s) => s.syncing);
  const lastSyncedAt = useOfflineQueueStore((s) => s.lastSyncedAt);
  const autoSync = useOfflineQueueStore((s) => s.autoSync);
  const setAutoSync = useOfflineQueueStore((s) => s.setAutoSync);

  const { t: tAll } = useTranslation();
  const t = tAll.settings;

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  // El login no devuelve el teléfono (authService.login no lo mapea), así que se
  // hidrata aparte desde el backend para no perderlo al guardar — sin esto, guardar
  // nombre/correo mandaría `phone: undefined` y borraría el teléfono ya guardado.
  const [phone, setPhone] = useState(user?.phone ?? null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { message, tone }
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user?.userId) return undefined;
    let cancelled = false;
    userService.getById(user.userId)
      .then((full) => {
        if (cancelled) return;
        setFirstName(full.firstName ?? '');
        setLastName(full.lastName ?? '');
        setEmail(full.email ?? '');
        setPhone(full.phone ?? null);
      })
      .catch(() => {}); // silencioso: si falla, se sigue con los valores de authStore
    return () => { cancelled = true; };
  }, [user?.userId]);

  const isTrainee = role === ROLES.FIREFIGHTER_TRAINEE;

  // El botón "Guardar Cambios" solo tiene sentido para Nombres/Apellidos/Correo: son
  // los únicos campos en estado local de este formulario — todo lo demás (toggles,
  // idioma, modo oscuro) ya se aplica al instante contra el store. Se deshabilita si
  // no hay ediciones pendientes, para que sea evidente qué hace y cuándo hace algo.
  const hasProfileChanges =
    firstName.trim() !== (user?.firstName ?? '') ||
    lastName.trim() !== (user?.lastName ?? '') ||
    email.trim() !== (user?.email ?? '');

  const handleSave = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setToast({ message: t.incompleteMessage, tone: 'error' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setToast({ message: t.invalidEmailMessage, tone: 'error' });
      return;
    }

    setSaving(true);
    try {
      const updated = await userService.update(user.userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone,
        email: email.trim(),
      });
      // `updateUser` (setUser en authStore) preserva rol, token y sesión — a diferencia
      // de `login`/`setAuth`, que espera `roles` y dejaría el rol global en null si no
      // se le pasa, rompiendo el navigator (pantalla blanca sin dashboard).
      updateUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        name: updated.name,
        email: updated.email,
      });
      setToast({ message: t.savedToast, tone: 'success' });
    } catch (e) {
      if (!e.response) {
        // Encolado offline — se aplica el cambio localmente igual (es información
        // que el propio usuario ya conoce, no depende de un cálculo del servidor) y
        // se sincroniza de verdad cuando vuelva la señal.
        updateUser({ firstName: firstName.trim(), lastName: lastName.trim(), name: `${firstName.trim()} ${lastName.trim()}`.trim(), email: email.trim() });
        setToast({ message: 'Sin conexión: se guardó localmente y se sincronizará cuando vuelva la señal.', tone: 'warning' });
        setSaving(false);
        return;
      }
      const message = e?.response?.data?.message ?? t.saveError;
      setToast({ message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, email, phone, user, updateUser, t]);

  const handleSyncNow = useCallback(async () => {
    if (pendingCount === 0) {
      setToast({ message: t.syncNothingPending, tone: 'info' });
      return;
    }
    const { synced, failed, stillOffline, sessionExpired } = await processQueue();
    if (sessionExpired) {
      setToast({ message: t.syncSessionExpired, tone: 'warning' });
    } else if (stillOffline) {
      setToast({ message: t.syncStillOffline, tone: 'warning' });
    } else if (failed.length > 0) {
      setToast({ message: t.syncPartial(synced, failed.length), tone: 'warning' });
    } else {
      setToast({ message: t.syncAllOk(synced), tone: 'success' });
    }
  }, [pendingCount, t]);

  const [backingUp, setBackingUp] = useState(false);
  const handleBackupNow = useCallback(async () => {
    setBackingUp(true);
    try {
      await createAndShareBackup();
    } catch {
      setToast({ message: 'No se pudo crear el respaldo.', tone: 'error' });
    } finally {
      setBackingUp(false);
    }
  }, []);

  const bumpRefreshKey = useAppRefreshStore((s) => s.bumpRefreshKey);

  // "Actualizar datos": primero sincroniza lo pendiente (igual que Sincronizar ahora),
  // y luego fuerza que toda la app vuelva a pedir sus datos desde cero — no hay una
  // capa de caché compartida entre pantallas, así que remontar el árbol de navegación
  // es la forma más simple y confiable de garantizar que todo quede al día. Como
  // efecto colateral honesto: al remontar el navegador, la pila de navegación vuelve a
  // su pantalla inicial (se pierde el "dónde estabas"), igual que si reabrieras la app.
  const handleRefreshAll = useCallback(async () => {
    if (pendingCount > 0) await processQueue();
    bumpRefreshKey();
    setToast({ message: 'Datos actualizados.', tone: 'success' });
  }, [pendingCount, bumpRefreshKey]);

  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <Ionicons name="settings-outline" size={22} color={theme.textPrimary} />
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{t.pageTitle}</Text>
        </View>

        {toast && <Toast message={toast.message} tone={toast.tone} />}

        <SettingsCard icon="person-outline" title={t.profile}>
          <View style={[styles.row, isCompact && styles.rowCompact]}>
            <FormField label={t.firstNameLabel} value={firstName} onChangeText={setFirstName} />
            <FormField label={t.lastNameLabel} value={lastName} onChangeText={setLastName} />
          </View>

          <View style={[styles.row, isCompact && styles.rowCompact]}>
            {isTrainee ? (
              <>
                {/* Antes este campo mostraba el JWT de sesión completo — la misma
                    credencial que viaja en el header Authorization — etiquetado como
                    "ID de Bombero". Ahora muestra el identificador real del usuario. */}
                <FormField
                  label={t.firefighterId}
                  value={user?.applicantCode ?? user?.userId ?? '—'}
                  editable={false}
                 
                />
                <FormField label={t.rank} value={ROLE_LABELS[role] ?? role ?? ''} editable={false} />
              </>
            ) : (
              <FormField label={t.role} value={ROLE_LABELS[role] ?? role ?? ''} editable={false} />
            )}
          </View>

          <FormField
            label={t.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
           
          />

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: hasProfileChanges ? theme.primarySolid : theme.disabledBg },
            ]}
            onPress={handleSave}
            activeOpacity={hasProfileChanges ? 0.85 : 1}
            disabled={!hasProfileChanges || saving}
            {...a11yButton(hasProfileChanges ? t.saveChanges : t.noChanges, {
              disabled: !hasProfileChanges || saving,
              busy: saving,
            })}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.onPrimarySolid} />
            ) : (
              <Ionicons
                name="save-outline"
                size={16}
                color={hasProfileChanges ? theme.onPrimarySolid : theme.textDisabled}
                {...a11yDecorative}
              />
            )}
            <Text
              style={[
                styles.saveBtnText,
                { color: hasProfileChanges ? theme.onPrimarySolid : theme.textDisabled },
              ]}
            >
              {hasProfileChanges ? t.saveChanges : t.noChanges}
            </Text>
          </TouchableOpacity>
        </SettingsCard>

        <View style={[styles.gridRow, isWide && styles.gridRowWide]}>
          <View style={[styles.gridItem, isWide && styles.gridItemWide]}>
            <SettingsCard icon="notifications-outline" title={t.notifications} style={isWide && styles.gridCardFill}>
              <ToggleRow
                label={t.pushTitle}
                description={t.pushDesc}
                value={pushNotifications}
                onValueChange={handleTogglePush}
               
              />
              <ToggleRow
                label={t.soundTitle}
                description={t.soundDesc}
                value={soundAlerts}
                onValueChange={() => toggle('soundAlerts')}
               
              />
            </SettingsCard>
          </View>

          <View style={[styles.gridItem, isWide && styles.gridItemWide]}>
            <SettingsCard icon="sync-outline" title={t.dataSync} style={isWide && styles.gridCardFill}>
              <ToggleRow
                label={t.autoSyncTitle}
                description={t.autoSyncDesc}
                value={autoSync}
                onValueChange={() => setAutoSync(!autoSync)}
              />
              <ToggleRow
                label={t.backupTitle}
                description={t.backupDesc}
                value={autoBackup}
                onValueChange={() => toggle('autoBackup')}
              />

              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}
                onPress={handleBackupNow}
                activeOpacity={0.8}
                disabled={backingUp}
                {...a11yButton('Respaldo ahora', { disabled: backingUp, busy: backingUp })}
              >
                {backingUp
                  ? <ActivityIndicator size="small" color={theme.textPrimary} />
                  : <Ionicons name="download-outline" size={16} color={theme.textPrimary} {...a11yDecorative} />}
                <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>Respaldo ahora</Text>
              </TouchableOpacity>

              <Text style={[styles.syncHint, { color: pendingCount > 0 ? theme.status.warning.fg : theme.textMuted }]}>
                {t.pendingChanges(pendingCount)}
              </Text>

              {pendingCount > 0 && (
                <View style={styles.pendingList}>
                  {pendingItems.slice(0, 4).map((item) => (
                    <Text
                      key={item.id}
                      style={[styles.pendingItemText, { color: theme.textMuted }]}
                      numberOfLines={1}
                    >
                      • {describeQueueItem(item)}
                    </Text>
                  ))}
                  {pendingCount > 4 && (
                    <Text style={[styles.pendingItemText, { color: theme.textMuted }]}>
                      {t.pendingItemsMore(pendingCount - 4)}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  syncing && styles.secondaryBtnDisabled,
                ]}
                onPress={handleSyncNow}
                activeOpacity={0.8}
                disabled={syncing}
                {...a11yButton(syncing ? t.syncing : t.syncNow, { disabled: syncing, busy: syncing })}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <Ionicons
                    name="cloud-upload-outline"
                    size={16}
                    color={theme.textPrimary}
                    {...a11yDecorative}
                  />
                )}
                <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
                  {syncing ? t.syncing : t.syncNow}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}
                onPress={handleRefreshAll}
                activeOpacity={0.8}
                {...a11yButton('Actualizar datos')}
              >
                <Ionicons name="refresh-outline" size={16} color={theme.textPrimary} {...a11yDecorative} />
                <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>Actualizar datos</Text>
              </TouchableOpacity>

              {lastSyncedAt && (
                <Text style={[styles.syncHint, { color: theme.textMuted }]}>
                  {t.lastSync}: {formatTime(lastSyncedAt)}
                </Text>
              )}
            </SettingsCard>
          </View>
        </View>

        <View style={[styles.gridRow, isWide && styles.gridRowWide]}>
          <View style={[styles.gridItem, isWide && styles.gridItemWide]}>
            <SettingsCard icon="color-palette-outline" title={t.appearance} style={isWide && styles.gridCardFill}>
              <ToggleRow
                label={t.darkModeTitle}
                description={t.darkModeDesc}
                value={darkMode}
                onValueChange={() => toggle('darkMode')}
               
              />
            </SettingsCard>
          </View>

          <View style={[styles.gridItem, isWide && styles.gridItemWide]}>
            <SettingsCard icon="globe-outline" title={t.language} style={isWide && styles.gridCardFill}>
              <View style={styles.langRow}>
                {[
                  { code: 'es', label: 'Español' },
                  { code: 'en', label: 'English' },
                ].map(({ code, label }) => {
                  const active = language === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.langBtn,
                        active
                          ? { backgroundColor: theme.primarySolid, borderColor: theme.primarySolid }
                          : { backgroundColor: theme.card, borderColor: theme.border },
                      ]}
                      onPress={() => setLanguage(code)}
                      activeOpacity={0.85}
                      // `radio` transmite mejor que `button` que se elige uno entre varios.
                      accessible
                      accessibilityRole="radio"
                      accessibilityLabel={label}
                      accessibilityState={{ checked: active }}
                    >
                      <Text style={[
                        styles.langBtnText,
                        { color: active ? theme.onPrimarySolid : theme.textPrimary },
                        active && styles.langBtnTextActive,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SettingsCard>
          </View>
        </View>

        <SettingsCard icon="shield-checkmark-outline" title={t.security}>
          <TouchableOpacity
            style={[styles.outlineBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setPasswordModalVisible(true)}
            activeOpacity={0.8}
            {...a11yButton(t.changePassword)}
          >
            <Text style={[styles.outlineBtnText, { color: theme.textPrimary }]}>{t.changePassword}</Text>
          </TouchableOpacity>
        </SettingsCard>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setLogoutVisible(true)}
          activeOpacity={0.8}
          {...a11yButton(t.logout, { hint: t.logoutMessage })}
        >
          <Ionicons name="log-out-outline" size={16} color={theme.textPrimary} {...a11yDecorative} />
          <Text style={[styles.logoutBtnText, { color: theme.textPrimary }]}>{t.logout}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={logoutVisible}
        title={t.logoutTitle}
        message={t.logoutMessage}
        confirmLabel={t.logoutConfirm}
        cancelLabel={t.cancel}
        destructive
        onCancel={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          logout();
        }}
      />

      <ChangePasswordModal
        visible={passwordModalVisible}
        t={t}
        theme={theme}
        onClose={() => setPasswordModalVisible(false)}
        onSuccess={() => setToast({ message: t.changePasswordSuccess, tone: 'success' })}
      />
    </SafeAreaView>
  );
}

function ChangePasswordModal({ visible, t, theme, onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const styles = modalStyles(theme);

  const reset = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [submitting, reset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t.changePasswordIncomplete);
      return;
    }
    if (newPassword.length < 8) {
      setError(t.changePasswordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.changePasswordMismatch);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      reset();
      onClose();
      onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message ?? t.changePasswordError);
    } finally {
      setSubmitting(false);
    }
  }, [currentPassword, newPassword, confirmPassword, t, reset, onClose, onSuccess]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.card} {...a11yModal(t.changePasswordTitle)}>
              <Text style={styles.title} accessibilityRole="header">{t.changePasswordTitle}</Text>

              <ScrollView style={styles.formScrollArea} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
                <FormField
                  label={t.currentPasswordLabel}
                  value={currentPassword}
                  onChangeText={(v) => { setCurrentPassword(v); setError(''); }}
                  secureTextEntry
                  textContentType="password"
                  autoComplete="current-password"
                />
                <FormField
                  label={t.newPasswordLabel}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setError(''); }}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                />
                <FormField
                  label={t.confirmNewPasswordLabel}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                />
              </ScrollView>

              {!!error && (
                <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleClose}
                  activeOpacity={0.8}
                  disabled={submitting}
                  {...a11yButton(t.cancel, { disabled: submitting })}
                >
                  <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={submitting}
                  {...a11yButton(t.changePasswordSubmit, { disabled: submitting, busy: submitting })}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                    : <Text style={styles.submitBtnText}>{t.changePasswordSubmit}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = (t) =>
  StyleSheet.create({
    kbAvoid: { flex: 1 },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: t.overlay,
    },
    card: {
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 380,
      maxHeight: '90%',
      gap: 12,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    formScrollArea: { flexShrink: 1 },
    formScroll: { gap: 12, paddingBottom: 2 },
    title: { fontSize: 17, fontWeight: '700', color: t.textPrimary, marginBottom: 4 },
    errorText: { fontSize: 13, color: t.status.danger.fg },
    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: {
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.borderStrong,
    },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    submitBtn: {
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: t.primarySolid,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { fontSize: 14, fontWeight: '700', color: t.onPrimarySolid },
  });

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    gap: 14,
  },
  rowCompact: {
    flexDirection: 'column',
  },

  gridRow: {
    gap: 14,
  },
  gridRowWide: {
    flexDirection: 'row',
  },
  gridItem: {
    width: '100%',
  },
  gridItemWide: {
    flex: 1,
  },
  // "gridItemWide" se estira para igualar al hermano más alto de la fila (es el
  // comportamiento por defecto de un row), pero ese estiramiento no baja por sí
  // solo a la tarjeta — un View en columna solo estira el ancho de sus hijos, no
  // el alto. Por eso la tarjeta necesita flex:1 explícito para llenar esa altura.
  gridCardFill: {
    flex: 1,
  },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 9,
  },
  secondaryBtnDisabled: { opacity: 0.7 },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncHint: {
    fontSize: 11,
    textAlign: 'center',
  },
  pendingList: {
    gap: 2,
  },
  pendingItemText: {
    fontSize: 11,
  },

  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  langBtnText: {
    fontSize: 13,
  },
  langBtnTextActive: {
    fontWeight: '700',
  },

  outlineBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  outlineBtnText: {
    fontSize: 13,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 11,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
