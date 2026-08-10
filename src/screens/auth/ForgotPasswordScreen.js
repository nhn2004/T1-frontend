import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants/routes';
import { a11yAlert, a11yButton, a11yDecorative, ICON_HIT_SLOP, MIN_TOUCH_SIZE } from '../../constants/a11y';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { safeGoBack } from '../../utils/safeGoBack';

const STEPS = { EMAIL: 'EMAIL', RESET: 'RESET', SUCCESS: 'SUCCESS' };
const MIN_PASSWORD_LENGTH = 8;
// Mismo patrón que LoginScreen.js — sin este chequeo, un correo mal escrito solo se
// detectaba tras el viaje de ida y vuelta al servidor.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation, route }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // El correo real de reseteo (ver AuthService.RequestPasswordResetAsync en el
  // backend) enlaza aquí con ?token=... — si llega, se salta directo al paso de
  // nueva contraseña en vez de pedirle el correo de nuevo.
  const linkToken = route?.params?.token ?? '';
  const [step,        setStep]        = useState(linkToken ? STEPS.RESET : STEPS.EMAIL);
  const [email,       setEmail]       = useState('');
  const [token,       setToken]       = useState(linkToken);
  const [tokenAutofilled, setTokenAutofilled] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  const handleRequestReset = useCallback(async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Ingresa tu correo electrónico.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setErrorMsg('Ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      // En desarrollo el backend devuelve el token en la propia respuesta para poder
      // probar el flujo sin buzón de correo. En producción no debería venir: si no
      // llega, el campo queda vacío y el usuario lo pega desde su email.
      const resetToken = res.data?.data?.resetToken ?? '';
      setToken(resetToken);
      setTokenAutofilled(!!resetToken);
      setStep(STEPS.RESET);
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleResetPassword = useCallback(async () => {
    setErrorMsg('');
    if (!token.trim())       { setErrorMsg('Ingresa el token de restablecimiento.'); return; }
    if (!newPassword)        { setErrorMsg('Ingresa la nueva contraseña.'); return; }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirm) { setErrorMsg('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
        confirmPassword: confirm,
      });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'Token inválido o expirado.');
    } finally {
      setLoading(false);
    }
  }, [token, newPassword, confirm]);

  const ErrorBanner = useCallback(
    ({ message }) => (
      <View style={styles.errorBanner} {...a11yAlert(message)}>
        <Ionicons name="alert-circle-outline" size={18} color={theme.status.danger.fg} {...a11yDecorative} />
        <Text style={styles.errorBannerText}>{message}</Text>
      </View>
    ),
    [styles, theme],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.relativeFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollAbsolute} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => safeGoBack(navigation, ROUTES.LOGIN)}
            hitSlop={ICON_HIT_SLOP}
            {...a11yButton('Volver')}
          >
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>

          {/* ── Paso 1: solicitar token ── */}
          {step === STEPS.EMAIL && (
            <>
              <View style={styles.iconCircle} {...a11yDecorative}>
                <Ionicons name="lock-closed-outline" size={32} color={theme.primaryText} />
              </View>
              <Text style={styles.title} accessibilityRole="header">¿Olvidaste tu contraseña?</Text>
              <Text style={styles.subtitle}>
                Ingresa tu correo y te enviaremos un token para restablecer tu contraseña.
              </Text>

              {!!errorMsg && <ErrorBanner message={errorMsg} />}

              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="fpEmail">Correo electrónico</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={theme.iconMuted} {...a11yDecorative} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setErrorMsg(''); }}
                    placeholder="tu@correo.com"
                    placeholderTextColor={theme.textPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    returnKeyType="send"
                    onSubmitEditing={handleRequestReset}
                    editable={!loading}
                    accessibilityLabel="Correo electrónico"
                    accessibilityLabelledBy="fpEmail"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleRequestReset}
                disabled={loading}
                activeOpacity={0.85}
                {...a11yButton('Enviar instrucciones', { disabled: loading, busy: loading })}
              >
                {loading
                  ? <ActivityIndicator color={theme.onPrimarySolid} size="small" />
                  : <Text style={styles.btnText}>Enviar instrucciones</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Paso 2: nueva contraseña ── */}
          {step === STEPS.RESET && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: theme.status.info.bg }]} {...a11yDecorative}>
                <Ionicons name="key-outline" size={32} color={theme.status.info.fg} />
              </View>
              <Text style={styles.title} accessibilityRole="header">Nueva contraseña</Text>
              <Text style={styles.subtitle}>
                Ingresa el token que recibiste y elige una nueva contraseña.
              </Text>

              {!!errorMsg && <ErrorBanner message={errorMsg} />}

              {tokenAutofilled && (
                <View style={styles.noticeBanner} accessibilityRole="text">
                  <Ionicons name="information-circle-outline" size={18} color={theme.status.warning.fg} {...a11yDecorative} />
                  <Text style={styles.noticeText}>
                    El servidor devolvió el token directamente (modo de desarrollo). En
                    producción llegará a tu correo.
                  </Text>
                </View>
              )}

              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="fpToken">Token de restablecimiento</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="ticket-outline" size={18} color={theme.iconMuted} {...a11yDecorative} />
                  <TextInput
                    style={[styles.input, styles.tokenInput]}
                    value={token}
                    onChangeText={(v) => { setToken(v); setErrorMsg(''); setTokenAutofilled(false); }}
                    placeholder="Token recibido"
                    placeholderTextColor={theme.textPlaceholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    accessibilityLabel="Token de restablecimiento"
                    accessibilityLabelledBy="fpToken"
                  />
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="fpNewPwd">Nueva contraseña</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.iconMuted} {...a11yDecorative} />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={(v) => { setNewPassword(v); setErrorMsg(''); }}
                    placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                    placeholderTextColor={theme.textPlaceholder}
                    secureTextEntry={!showPwd}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!loading}
                    accessibilityLabel="Nueva contraseña"
                    accessibilityLabelledBy="fpNewPwd"
                    accessibilityHint={`Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPwd((p) => !p)}
                    hitSlop={ICON_HIT_SLOP}
                    {...a11yButton(showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña', { selected: showPwd })}
                  >
                    <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.icon} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="fpConfirm">Confirmar contraseña</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.iconMuted} {...a11yDecorative} />
                  <TextInput
                    style={styles.input}
                    value={confirm}
                    onChangeText={(v) => { setConfirm(v); setErrorMsg(''); }}
                    placeholder="Repite la contraseña"
                    placeholderTextColor={theme.textPlaceholder}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    returnKeyType="go"
                    onSubmitEditing={handleResetPassword}
                    editable={!loading}
                    accessibilityLabel="Confirmar contraseña"
                    accessibilityLabelledBy="fpConfirm"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm((p) => !p)}
                    hitSlop={ICON_HIT_SLOP}
                    {...a11yButton(showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña', { selected: showConfirm })}
                  >
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.icon} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
                {...a11yButton('Cambiar contraseña', { disabled: loading, busy: loading })}
              >
                {loading
                  ? <ActivityIndicator color={theme.onPrimarySolid} size="small" />
                  : <Text style={styles.btnText}>Cambiar contraseña</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => { setStep(STEPS.EMAIL); setErrorMsg(''); }}
                {...a11yButton('Volver a ingresar correo')}
              >
                <Text style={styles.secondaryBtnText}>Volver a ingresar correo</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Paso 3: confirmación ── */}
          {step === STEPS.SUCCESS && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: theme.status.success.bg }]} {...a11yDecorative}>
                <Ionicons name="checkmark-circle-outline" size={40} color={theme.status.success.fg} />
              </View>
              <Text style={styles.title} accessibilityRole="header" {...a11yAlert('Contraseña actualizada')}>
                ¡Contraseña actualizada!
              </Text>
              <Text style={styles.subtitle}>
                Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión con tus
                nuevas credenciales.
              </Text>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation?.navigate(ROUTES.LOGIN)}
                activeOpacity={0.85}
                {...a11yButton('Ir al inicio de sesión')}
              >
                <Ionicons name="log-in-outline" size={18} color={theme.onPrimarySolid} {...a11yDecorative} />
                <Text style={styles.btnText}>Ir al inicio de sesión</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root:   { flex: 1, backgroundColor: t.card },
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
    scroll: { flexGrow: 1, padding: 24, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },

    backBtn: {
      width: MIN_TOUCH_SIZE,
      height: MIN_TOUCH_SIZE,
      borderRadius: 10,
      backgroundColor: t.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },

    iconCircle: {
      width: 72, height: 72, borderRadius: 20,
      backgroundColor: t.primarySoft,
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'flex-start', marginBottom: 4,
    },

    title:    { fontSize: 26, fontWeight: '900', color: t.textPrimary },
    subtitle: { fontSize: 15, color: t.textSecondary, lineHeight: 21, marginBottom: 4 },

    errorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.status.danger.bg,
      borderWidth: 1.5, borderColor: t.status.danger.border,
      borderRadius: 10, padding: 12,
    },
    errorBannerText: { flex: 1, fontSize: 14, color: t.status.danger.fg, fontWeight: '600' },

    noticeBanner: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: t.status.warning.bg,
      borderWidth: 1, borderColor: t.status.warning.border,
      borderRadius: 10, padding: 12,
    },
    noticeText: { flex: 1, fontSize: 13, color: t.status.warning.fg, lineHeight: 18 },

    fieldBlock: { gap: 6 },
    label:      { fontSize: 13, fontWeight: '700', color: t.textSecondary },

    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: t.border, borderRadius: 12,
      paddingHorizontal: 12,
      minHeight: MIN_TOUCH_SIZE + 4,
      backgroundColor: t.cardAlt, gap: 8,
    },
    input: { flex: 1, fontSize: 15, color: t.textPrimary, paddingVertical: 12 },
    tokenInput: { fontSize: 13 },

    btn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: t.primarySolid, borderRadius: 14,
      minHeight: MIN_TOUCH_SIZE + 8, marginTop: 4,
    },
    btnDisabled: { backgroundColor: t.disabledBg },
    btnText:     { color: t.onPrimarySolid, fontSize: 16, fontWeight: '800' },

    secondaryBtn: { alignItems: 'center', justifyContent: 'center', minHeight: MIN_TOUCH_SIZE },
    secondaryBtnText: { fontSize: 14, color: t.textSecondary, fontWeight: '600' },
  });
