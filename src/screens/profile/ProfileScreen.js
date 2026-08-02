import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROLE_LABELS } from '../../constants';
import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, a11yHeader } from '../../constants/a11y';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import { userService } from '../../services';

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

export default function ProfileScreen({ navigation }) {
  const { user, roles } = useAuth();
  const theme = useTheme();
  const { t: tAll } = useTranslation();
  const t = tAll.profile;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        if (!cancelled) setDetails(data);
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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={22} color={theme.textPrimary} {...a11yDecorative} />
          <Text style={styles.pageTitle} {...a11yHeader(t.pageTitle)}>{t.pageTitle}</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.avatar} {...a11yDecorative}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          {!!roleLabels && <Text style={styles.role}>{roleLabels}</Text>}
        </View>

        <View style={styles.detailCard}>
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <Row label={t.emailLabel} value={details?.email ?? user?.email ?? '—'} styles={styles} />
              <Row label={t.phoneLabel} value={details?.phone ?? '—'} styles={styles} />
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
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation?.navigate(ROUTES.SETTINGS)}
          activeOpacity={0.85}
          {...a11yButton(t.editButton)}
        >
          <Ionicons name="create-outline" size={16} color={theme.onPrimarySolid} {...a11yDecorative} />
          <Text style={styles.editBtnText}>{t.editButton}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    pageTitle: { fontSize: 20, fontWeight: '700', color: t.textPrimary },

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
    avatarText: { fontSize: 26, fontWeight: '800', color: t.onPrimarySolid },
    name: { fontSize: 18, fontWeight: '700', color: t.textPrimary },
    role: { fontSize: 13, color: t.textSecondary },

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
    rowLabel: { fontSize: 13, color: t.textSecondary },
    rowValue: { fontSize: 13, fontWeight: '600', color: t.textPrimary, flexShrink: 1, textAlign: 'right' },
    errorText: { fontSize: 13, color: t.status.danger.fg, textAlign: 'center' },

    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 8,
      paddingVertical: 11,
      backgroundColor: t.primarySolid,
    },
    editBtnText: { fontSize: 14, fontWeight: '700', color: t.onPrimarySolid },
  });
