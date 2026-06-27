import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/colors';
import api from '../../services/api';

const STEPS = { EMAIL: 'EMAIL', RESET: 'RESET', SUCCESS: 'SUCCESS' };

export default function ForgotPasswordScreen({ navigation }) {
  const [step,        setStep]        = useState(STEPS.EMAIL);
  const [email,       setEmail]       = useState('');
  const [token,       setToken]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  // ── Paso 1: solicitar token ──────────────────────────────────────────────────

  async function handleRequestReset() {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      const resetToken = res.data?.data?.resetToken ?? '';
      setToken(resetToken);
      setStep(STEPS.RESET);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Error al procesar la solicitud.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Paso 2: cambiar contraseña ───────────────────────────────────────────────

  async function handleResetPassword() {
    setErrorMsg('');
    if (!token.trim())       { setErrorMsg('Ingresa el token de restablecimiento.'); return; }
    if (!newPassword.trim()) { setErrorMsg('Ingresa la nueva contraseña.'); return; }
    if (newPassword.length < 8) { setErrorMsg('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (newPassword !== confirm) { setErrorMsg('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token:       token.trim(),
        newPassword: newPassword,
        confirmPassword: confirm,
      });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Token inválido o expirado.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Botón volver */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>

          {/* ── PASO: EMAIL ── */}
          {step === STEPS.EMAIL && (
            <>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.subtitle}>
                Ingresa tu correo y te enviaremos un token para restablecer tu contraseña.
              </Text>

              {!!errorMsg && <ErrorBanner message={errorMsg} />}

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color="#9AA3B0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={v => { setEmail(v); setErrorMsg(''); }}
                    placeholder="tu@correo.com"
                    placeholderTextColor="#B0B7C3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleRequestReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Enviar instrucciones</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* ── PASO: RESET ── */}
          {step === STEPS.RESET && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: '#EAF3FD' }]}>
                <Ionicons name="key-outline" size={32} color="#1E88E5" />
              </View>
              <Text style={styles.title}>Nueva contraseña</Text>
              <Text style={styles.subtitle}>
                Ingresa el token que recibiste y elige una nueva contraseña.
              </Text>

              {!!errorMsg && <ErrorBanner message={errorMsg} />}

              {/* Token — pre-llenado desde la respuesta (modo dev) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Token de restablecimiento</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="ticket-outline" size={18} color="#9AA3B0" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.tokenInput]}
                    value={token}
                    onChangeText={v => { setToken(v); setErrorMsg(''); }}
                    placeholder="Token recibido"
                    placeholderTextColor="#B0B7C3"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Nueva contraseña</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9AA3B0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={v => { setNewPassword(v); setErrorMsg(''); }}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#B0B7C3"
                    secureTextEntry={!showPwd}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={styles.eyeBtn}>
                    <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9AA3B0" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Confirmar contraseña</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9AA3B0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirm}
                    onChangeText={v => { setConfirm(v); setErrorMsg(''); }}
                    placeholder="Repite la contraseña"
                    placeholderTextColor="#B0B7C3"
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9AA3B0" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Cambiar contraseña</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => { setStep(STEPS.EMAIL); setErrorMsg(''); }}
              >
                <Text style={styles.secondaryBtnText}>Volver a ingresar correo</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── PASO: SUCCESS ── */}
          {step === STEPS.SUCCESS && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: '#E8FAF0' }]}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#08C65A" />
              </View>
              <Text style={styles.title}>¡Contraseña actualizada!</Text>
              <Text style={styles.subtitle}>
                Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.
              </Text>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation?.navigate('Login')}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Ir al inicio de sesión</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ErrorBanner({ message }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={16} color="#D83B35" />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 24, gap: 16 },

  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F4F6F8',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },

  iconCircle: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#FFF0EA',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start', marginBottom: 4,
  },

  title:    { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#697282', lineHeight: 20, marginBottom: 4 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5, borderColor: '#FECACA',
    borderRadius: 10, padding: 12,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#D83B35', fontWeight: '500' },

  fieldBlock: { gap: 6 },
  label:      { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E3EA', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#FAFAFA', gap: 8,
  },
  inputIcon: { width: 20 },
  input: {
    flex: 1, fontSize: 14, color: '#1A1A1A',
    paddingVertical: 0,
  },
  tokenInput: { fontSize: 12 },
  eyeBtn: { padding: 2 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '800' },

  secondaryBtn: { alignItems: 'center', paddingVertical: 8 },
  secondaryBtnText: { fontSize: 13, color: '#697282', fontWeight: '600' },
});
