import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROLE_LABELS, ROLES } from '../../constants';
import { a11yButton, a11yDecorative, a11yHeader } from '../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import { userService } from '../../services';
import Toast from '../../components/Toast';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import SettingsCard from '../settings/components/SettingsCard';
import FormField from '../settings/components/FormField';

function initials(name) {
  const parts = (name || '').split(' ').filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('') || '?';
}

function Row({ label, value, styles }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, role, roles, updateUser } = useAuth();
  const theme = useTheme();
  const { t: tAll } = useTranslation();
  const t = tAll.profile;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Campos editables. Se hidratan desde el mismo `userService.getById` que ya se
  // pedía para la ficha de solo lectura — antes esta pantalla y Configuración pedían
  // el detalle del usuario por separado para lo mismo.
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.userId) {
      setLoading(false);
      return undefined;
    }
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await userService.getById(user.userId);
        if (cancelled) return;
        setDetails(data);
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? null);
      } catch {
        if (!cancelled) setError(t.loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.userId, t.loadError]);

  const roleLabels = (roles ?? []).map((r) => ROLE_LABELS[r] ?? r).join(' · ');
  const isTrainee = role === ROLES.FIREFIGHTER_TRAINEE;

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
      updateUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        name: updated.name,
        email: updated.email,
      });
      setDetails((d) => (d ? { ...d, ...updated } : d));
      setToast({ message: t.savedToast, tone: 'success' });
    } catch (e) {
      if (!e.response) {
        updateUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: email.trim(),
        });
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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={22} color={theme.textPrimary} {...a11yDecorative} />
          <Text style={styles.pageTitle} {...a11yHeader(t.pageTitle)}>{t.pageTitle}</Text>
        </View>

        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        <View style={styles.identityCard}>
          <View style={styles.avatar} {...a11yDecorative}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          {!!roleLabels && <Text style={styles.role}>{roleLabels}</Text>}
        </View>

        {loading ? (
          <View style={styles.detailCard}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.detailCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <SettingsCard icon="create-outline" title={t.editSectionTitle}>
              <View style={styles.formRow}>
                <FormField label={t.firstNameLabel} value={firstName} onChangeText={setFirstName} />
                <FormField label={t.lastNameLabel} value={lastName} onChangeText={setLastName} />
              </View>

              <View style={styles.formRow}>
                {isTrainee ? (
                  <>
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

              <FormField label={t.emailLabel} value={email} onChangeText={setEmail} keyboardType="email-address" />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: hasProfileChanges ? theme.primarySolid : theme.disabledBg }]}
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
                <Text style={[styles.saveBtnText, { color: hasProfileChanges ? theme.onPrimarySolid : theme.textDisabled }]}>
                  {hasProfileChanges ? t.saveChanges : t.noChanges}
                </Text>
              </TouchableOpacity>
            </SettingsCard>

            <View style={styles.detailCard}>
              <Row label={t.phoneLabel} value={phone ?? '—'} styles={styles} />
              <Row
                label={t.statusLabel}
                value={details?.accountStatus === 'active' ? t.statusActive : (details?.accountStatus ?? '—')}
                styles={styles}
              />
              <Row
                label={t.memberSinceLabel}
                value={details?.createdAt ? new Date(details.createdAt).toLocaleDateString() : '—'}
                styles={styles}
              />
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
          </>
        )}
      </ScrollView>

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

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1 },
    content: {
      padding: 16,
      gap: 14,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pageTitle: { ...TEXT_STYLES.screenTitle, color: t.textPrimary },

    identityCard: {
      alignItems: 'center',
      gap: 6,
      padding: 24,
      borderRadius: 14,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.primarySolid,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    avatarText: { fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold, color: t.onPrimarySolid },
    name: { ...TEXT_STYLES.cardTitle, color: t.textPrimary },
    role: { ...TEXT_STYLES.caption, color: t.textSecondary },

    formRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },

    detailCard: {
      padding: 18,
      borderRadius: 14,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      gap: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    rowLabel: { ...TEXT_STYLES.caption, color: t.textSecondary },
    rowValue: { ...TEXT_STYLES.caption, fontWeight: FONT_WEIGHT.semibold, color: t.textPrimary, flexShrink: 1, textAlign: 'right' },
    errorText: { fontSize: FONT_SIZE.md, color: t.status.danger.fg, textAlign: 'center' },

    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 8,
      paddingVertical: 11,
      marginTop: 4,
    },
    saveBtnText: { ...TEXT_STYLES.button },

    outlineBtn: {
      borderWidth: 1.5,
      borderRadius: 8,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    outlineBtnText: { fontSize: FONT_SIZE.md },
  });
