import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { a11yAlert, a11yButton, a11yDecorative, ICON_HIT_SLOP, MIN_TOUCH_SIZE } from '../../constants/a11y';
import useAuthStore from '../../store/authStore';
import { authService } from '../../services';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';

// Credenciales sembradas por seed_local_users.sql / DbSeeder. Cubre los 7 roles para
// poder probar cada dashboard sin tener que recordar los correos.
const DEMO_USERS = [
  { role: ROLES.FIREFIGHTER_TRAINEE, icon: 'shield-outline',        email: 'bombero@smab.app' },
  { role: ROLES.MEDICAL,             icon: 'medkit-outline',        email: 'medico@smab.app' },
  { role: ROLES.CAPACITATOR,         icon: 'school-outline',        email: 'capacitador@smab.app' },
  { role: ROLES.FIRE_CHIEF,          icon: 'star-outline',          email: 'jefe@smab.app' },
  { role: ROLES.ADMIN,               icon: 'briefcase-outline',     email: 'admin@smab.app' },
  { role: ROLES.SYSTEM_ADMIN,        icon: 'settings-outline',      email: 'sysadmin@smab.app' },
  { role: ROLES.RESEARCHER,          icon: 'analytics-outline',     email: 'investigador@smab.app' },
];
const DEMO_PASS = 'Smab2026!';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const theme = useTheme();
  const { t: tAll } = useTranslation();
  const t = tAll.auth;
  const { width } = useWindowDimensions();

  // En pantallas angostas (teléfono en vertical) el panel de marca se apila encima
  // del formulario en vez de competir por el ancho.
  const isWide = width >= 860;

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const passwordRef = useRef(null);
  const styles = useMemo(() => makeStyles(theme, isWide), [theme, isWide]);

  const fillDemo = useCallback((user) => {
    setEmail(user.email);
    setPassword(DEMO_PASS);
    setErrorMsg('');
  }, []);

  const handleLogin = useCallback(async () => {
    const mail = email.trim().toLowerCase();
    setErrorMsg('');

    if (!mail || !password) {
      setErrorMsg(t.errors.empty);
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setErrorMsg(t.errors.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      const authData = await authService.login(mail, password);
      setAuth(authData);
    } catch (error) {
      const status  = error.response?.status;
      const message = error.response?.data?.message;

      // Sin esto, un fallo de red (IP vieja, firewall, servidor caído) solo mostraba
      // un mensaje genérico en pantalla — no había forma de ver la causa real
      // (timeout, DNS, conexión rechazada) sin abrir la consola de Metro.
      console.warn('[Login] request failed', {
        code: error.code,
        message: error.message,
        url: error.config ? `${error.config.baseURL ?? ''}${error.config.url ?? ''}` : undefined,
        status,
      });

      if (status === 401)      setErrorMsg(t.errors.credentials);
      else if (status === 422) setErrorMsg(message ?? t.errors.locked);
      else if (status === 400) setErrorMsg(message ?? t.errors.badRequest);
      else                     setErrorMsg(t.errors.network);
    } finally {
      setLoading(false);
    }
  }, [email, password, setAuth, t]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.relativeFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollAbsolute}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* ── Panel de marca ── */}
          <View style={styles.leftPanel}>
            <View style={styles.logoCircle} {...a11yDecorative}>
              <Ionicons name="shield" size={isWide ? 52 : 38} color={theme.onPrimarySolid} />
            </View>
            <Text style={styles.appName} accessibilityRole="header">{t.appName}</Text>
            <Text style={styles.appSub}>{t.appSubtitle}</Text>
            {isWide && (
              <>
                <View style={styles.dividerLine} {...a11yDecorative} />
                <Text style={styles.tagline}>{t.tagline}</Text>
                <Text style={styles.countries}>{t.countries}</Text>
              </>
            )}
          </View>

          {/* ── Formulario ── */}
          <View style={styles.rightPanel}>
            <Text style={styles.welcomeTitle} accessibilityRole="header">{t.welcomeTitle}</Text>
            <Text style={styles.welcomeSub}>{t.welcomeSubtitle}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label} nativeID="loginEmailLabel">{t.emailLabel}</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={18} color={theme.iconMuted} {...a11yDecorative} />
                <TextInput
                  style={styles.input}
                  placeholder={t.emailPlaceholder}
                  placeholderTextColor={theme.textPlaceholder}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrorMsg(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  accessibilityLabel={t.emailLabel}
                  accessibilityLabelledBy="loginEmailLabel"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label} nativeID="loginPassLabel">{t.passwordLabel}</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.iconMuted} {...a11yDecorative} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder={t.passwordPlaceholder}
                  placeholderTextColor={theme.textPlaceholder}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrorMsg(''); }}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel={t.passwordLabel}
                  accessibilityLabelledBy="loginPassLabel"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  hitSlop={ICON_HIT_SLOP}
                  {...a11yButton(showPass ? t.hidePassword : t.showPassword, {
                    selected: showPass,
                  })}
                >
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation?.navigate(ROUTES.FORGOT_PASSWORD)}
              style={styles.forgotRow}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              {...a11yButton(t.forgot)}
            >
              <Text style={styles.forgotText}>{t.forgot}</Text>
            </TouchableOpacity>

            {!!errorMsg && (
              <View style={styles.errorBanner} {...a11yAlert(errorMsg)}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.status.danger.fg}
                  {...a11yDecorative}
                />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
              {...a11yButton(loading ? t.submitting : t.submit, { disabled: loading, busy: loading })}
            >
              {loading
                ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                : <Ionicons name="log-in-outline" size={18} color={theme.onPrimarySolid} {...a11yDecorative} />}
              <Text style={styles.loginBtnText}>{loading ? t.submitting : t.submit}</Text>
            </TouchableOpacity>

            {/* ── Acceso rápido de prueba ──
                Solo en desarrollo: estas credenciales (y la contraseña compartida
                Smab2026!) no deben quedar visibles ni utilizables en el build de
                producción — ver DEPLOY.md del backend, que ya trata esa contraseña
                como no apta para producción. */}
            {__DEV__ && (
              <View style={styles.demoSection}>
                <View style={styles.demoDividerRow}>
                  <View style={styles.demoDivider} {...a11yDecorative} />
                  <Text style={styles.demoLabel}>{t.demoTitle}</Text>
                  <View style={styles.demoDivider} {...a11yDecorative} />
                </View>
                <View style={styles.demoChips}>
                  {DEMO_USERS.map((u) => {
                    const label = ROLE_LABELS[u.role] ?? u.role;
                    return (
                      <TouchableOpacity
                        key={u.email}
                        style={styles.demoChip}
                        onPress={() => fillDemo(u)}
                        activeOpacity={0.75}
                        disabled={loading}
                        {...a11yButton(label, { hint: t.demoHint, disabled: loading })}
                      >
                        <Ionicons name={u.icon} size={15} color={theme.primaryText} {...a11yDecorative} />
                        <Text style={styles.demoChipText} numberOfLines={1}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t, isWide) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    // El cálculo de tamaño por flexbox en la web resultó poco confiable — probado en
    // el DOM real: con flex:1 + minHeight:0 + overflow:scroll, la caja igual terminaba
    // creciendo para caber todo el contenido en vez de quedarse acotada a la pantalla.
    // `position:'absolute'` con los cuatro bordes en 0 no depende de ese cálculo: toma
    // el tamaño exacto de su contenedor posicionado (`relativeFlex`), así que queda
    // acotado de verdad y el scroll interno sí se activa.
    relativeFlex: { flex: 1, position: 'relative' },
    scrollAbsolute: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'scroll',
    },
    scroll: {
      flexGrow: 1,
      flexDirection: isWide ? 'row' : 'column',
    },

    leftPanel: {
      flex: isWide ? 0.42 : undefined,
      backgroundColor: t.mode === 'dark' ? '#0E0E0E' : '#1A1A1A',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isWide ? 32 : 24,
      gap: isWide ? 12 : 6,
    },
    logoCircle: {
      width: isWide ? 90 : 64,
      height: isWide ? 90 : 64,
      borderRadius: isWide ? 45 : 32,
      backgroundColor: t.primarySolid,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isWide ? 8 : 4,
    },
    // Este panel siempre es oscuro (identidad de marca), así que su texto no
    // depende del tema: los valores están fijados para contrastar sobre #1A1A1A.
    appName: { fontSize: isWide ? FONT_SIZE.hero : FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold, color: '#FFFFFF', letterSpacing: 1 },
    appSub: { fontSize: FONT_SIZE.md, color: '#C9CFD8', textAlign: 'center', lineHeight: 19 },
    dividerLine: { width: 40, height: 2, backgroundColor: t.primary, borderRadius: 2, marginVertical: 8 },
    tagline: { fontSize: FONT_SIZE.lg, color: '#C9CFD8', textAlign: 'center', lineHeight: 21 },
    countries: { fontSize: FONT_SIZE.lg, color: '#A8AEB8', marginTop: 4 },

    rightPanel: {
      flex: isWide ? 0.58 : 1,
      backgroundColor: t.card,
      padding: isWide ? 40 : 24,
      justifyContent: 'center',
      gap: 16,
    },
    welcomeTitle: { fontSize: FONT_SIZE.statValue, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    welcomeSub: { fontSize: FONT_SIZE.lg, color: t.textSecondary, lineHeight: 20, marginBottom: 4 },

    fieldGroup: { gap: 6 },
    label: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: t.textSecondary },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.cardAlt,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.border,
      paddingHorizontal: 14,
      minHeight: MIN_TOUCH_SIZE + 4,
      gap: 10,
    },
    input: { flex: 1, fontSize: FONT_SIZE.lg, color: t.textPrimary, paddingVertical: 12 },

    forgotRow: { alignSelf: 'flex-end', marginTop: -6, paddingVertical: 4 },
    forgotText: { fontSize: FONT_SIZE.md, color: t.primaryText, fontWeight: FONT_WEIGHT.semibold },

    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.status.danger.bg,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.status.danger.border,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    errorBannerText: { flex: 1, ...TEXT_STYLES.bodyBold, color: t.status.danger.fg },

    loginBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.primarySolid,
      borderRadius: 12,
      minHeight: MIN_TOUCH_SIZE + 6,
      marginTop: 4,
    },
    loginBtnDisabled: { backgroundColor: t.disabledBg },
    loginBtnText: { color: t.onPrimarySolid, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },

    demoSection: { gap: 10, marginTop: 4 },
    demoDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    demoDivider: { flex: 1, height: 1, backgroundColor: t.border },
    demoLabel: { fontSize: FONT_SIZE.base, color: t.textMuted, fontWeight: FONT_WEIGHT.semibold },
    demoChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    demoChip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
      minHeight: MIN_TOUCH_SIZE - 6,
      borderRadius: 10,
      borderWidth: 1.5,
      backgroundColor: t.primarySoft,
      borderColor: t.primaryBorder,
    },
    demoChipText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: t.onPrimarySoft },
  });
