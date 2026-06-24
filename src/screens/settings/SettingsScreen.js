import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, ROLE_LABELS, ROLES } from '../../constants';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import useSettingsStore from '../../store/settingsStore';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';

import SettingsCard from './components/SettingsCard';
import ToggleRow from './components/ToggleRow';
import FormField from './components/FormField';

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function SettingsScreen() {
  const { user, role, token, login, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 700;
  const isWide = width >= 1100;

  const darkMode = useSettingsStore((s) => s.darkMode);
  const pushNotifications = useSettingsStore((s) => s.pushNotifications);
  const soundAlerts = useSettingsStore((s) => s.soundAlerts);
  const autoSync = useSettingsStore((s) => s.autoSync);
  const autoBackup = useSettingsStore((s) => s.autoBackup);
  const language = useSettingsStore((s) => s.language);
  const lastSyncedAt = useSettingsStore((s) => s.lastSyncedAt);
  const toggle = useSettingsStore((s) => s.toggle);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const markSynced = useSettingsStore((s) => s.markSynced);

  const { t: tAll } = useTranslation();
  const t = tAll.settings;

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [toast, setToast] = useState(null); // { message, tone }
  const [logoutVisible, setLogoutVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const isTrainee = role === ROLES.FIREFIGHTER_TRAINEE;

  // El botón "Guardar Cambios" solo tiene sentido para Nombre/Correo: son los únicos
  // campos en estado local de este formulario — todo lo demás (toggles, idioma, modo
  // oscuro) ya se aplica al instante contra el store. Se deshabilita si no hay ediciones
  // pendientes, para que sea evidente qué hace y cuándo hace algo.
  const hasProfileChanges =
    name.trim() !== (user?.name ?? '') || email.trim() !== (user?.email ?? '');

  const handleSave = useCallback(() => {
    if (!name.trim() || !email.trim()) {
      setToast({ message: t.incompleteMessage, tone: 'error' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setToast({ message: t.invalidEmailMessage, tone: 'error' });
      return;
    }
    // Esto actualiza el authStore global — el nombre se refleja de inmediato
    // en el resto de la app (ej. el saludo del Dashboard).
    login({ user: { ...user, name: name.trim(), email: email.trim() }, role, token });
    // TODO: api.put('/users/me', { name, email })
    setToast({ message: t.savedToast, tone: 'success' });
  }, [name, email, user, role, token, login, t]);

  const handleSyncNow = useCallback(() => {
    markSynced();
    setToast({ message: t.syncToast, tone: 'success' });
  }, [markSynced, t]);

  const handleComingSoon = useCallback((feature) => {
    setToast({ message: t.comingSoonToast(feature), tone: 'error' });
  }, [t]);

  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <Ionicons name="settings-outline" size={22} color={theme.textPrimary} />
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{t.pageTitle}</Text>
        </View>

        {toast && <Toast message={toast.message} tone={toast.tone} />}

        <SettingsCard icon="person-outline" title={t.profile} dark={darkMode}>
          <FormField label={t.fullName} value={name} onChangeText={setName} dark={darkMode} />

          <View style={[styles.row, isCompact && styles.rowCompact]}>
            {isTrainee ? (
              <>
                <FormField label={t.firefighterId} value={token ?? ''} editable={false} dark={darkMode} />
                <FormField label={t.rank} value={ROLE_LABELS[role] ?? role ?? ''} editable={false} dark={darkMode} />
              </>
            ) : (
              <FormField label={t.role} value={ROLE_LABELS[role] ?? role ?? ''} editable={false} dark={darkMode} />
            )}
          </View>

          <FormField
            label={t.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            dark={darkMode}
          />

          <TouchableOpacity
            style={[styles.saveBtn, !hasProfileChanges && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={hasProfileChanges ? 0.85 : 1}
            disabled={!hasProfileChanges}
          >
            <Ionicons name="save-outline" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>
              {hasProfileChanges ? t.saveChanges : t.noChanges}
            </Text>
          </TouchableOpacity>
        </SettingsCard>

        <View style={[styles.gridRow, isWide && styles.gridRowWide]}>
          <View style={[styles.gridItem, isWide && styles.gridItemWide]}>
            <SettingsCard icon="notifications-outline" title={t.notifications} dark={darkMode}>
              <ToggleRow
                label={t.pushTitle}
                description={t.pushDesc}
                value={pushNotifications}
                onValueChange={() => toggle('pushNotifications')}
                dark={darkMode}
              />
              <ToggleRow
                label={t.soundTitle}
                description={t.soundDesc}
                value={soundAlerts}
                onValueChange={() => toggle('soundAlerts')}
                dark={darkMode}
              />
            </SettingsCard>
          </View>

          <View style={[styles.gridItem, isWide && styles.gridItemWide]}>
            <SettingsCard icon="sync-outline" title={t.dataSync} dark={darkMode}>
              <ToggleRow
                label={t.autoSyncTitle}
                description={t.autoSyncDesc}
                value={autoSync}
                onValueChange={() => toggle('autoSync')}
                dark={darkMode}
              />
              <ToggleRow
                label={t.backupTitle}
                description={t.backupDesc}
                value={autoBackup}
                onValueChange={() => toggle('autoBackup')}
                dark={darkMode}
              />

              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handleSyncNow}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={16} color={theme.textPrimary} />
                <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>{t.syncNow}</Text>
              </TouchableOpacity>

              {lastSyncedAt && (
                <Text style={styles.syncHint}>
                  {t.lastSync}: {formatTime(lastSyncedAt)}
                </Text>
              )}
            </SettingsCard>
          </View>
        </View>

        <View style={[styles.gridRow, isWide && styles.gridRowWide]}>
          <View style={[styles.gridItem, isWide && styles.gridItemWide]}>
            <SettingsCard icon="color-palette-outline" title={t.appearance} dark={darkMode}>
              <ToggleRow
                label={t.darkModeTitle}
                description={t.darkModeDesc}
                value={darkMode}
                onValueChange={() => toggle('darkMode')}
                dark={darkMode}
              />
            </SettingsCard>
          </View>

          <View style={[styles.gridItem, isWide && styles.gridItemWide]}>
            <SettingsCard icon="globe-outline" title={t.language} dark={darkMode}>
              <View style={styles.langRow}>
                <TouchableOpacity
                  style={[
                    styles.langBtn,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    language === 'es' && styles.langBtnActive,
                  ]}
                  onPress={() => setLanguage('es')}
                  activeOpacity={0.85}
                >
                  <Text style={[
                    styles.langBtnText,
                    { color: theme.textPrimary },
                    language === 'es' && styles.langBtnTextActive,
                  ]}>
                    Español
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.langBtn,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    language === 'en' && styles.langBtnActive,
                  ]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.85}
                >
                  <Text style={[
                    styles.langBtnText,
                    { color: theme.textPrimary },
                    language === 'en' && styles.langBtnTextActive,
                  ]}>
                    English
                  </Text>
                </TouchableOpacity>
              </View>
            </SettingsCard>
          </View>
        </View>

        <SettingsCard icon="shield-checkmark-outline" title={t.security} dark={darkMode}>
          <TouchableOpacity
            style={[styles.outlineBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => handleComingSoon(t.changePassword)}
            activeOpacity={0.8}
          >
            <Text style={[styles.outlineBtnText, { color: theme.textPrimary }]}>{t.changePassword}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => handleComingSoon(t.twoFactor)}
            activeOpacity={0.8}
          >
            <Text style={[styles.outlineBtnText, { color: theme.textPrimary }]}>{t.twoFactor}</Text>
          </TouchableOpacity>
        </SettingsCard>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setLogoutVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={16} color={theme.textPrimary} />
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
    </SafeAreaView>
  );
}

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

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 9,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncHint: {
    fontSize: 11,
    color: '#6A7282',
    textAlign: 'center',
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
  langBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langBtnText: {
    fontSize: 13,
  },
  langBtnTextActive: {
    color: '#fff',
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
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 11,
    marginTop: 4,
  },
  saveBtnDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveBtnText: {
    color: '#fff',
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
