import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import useAuthStore from '../../store/authStore';
import { authService } from '../../services';

export default function LoginScreen({ navigation }) {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const authData = await authService.login(email.trim().toLowerCase(), password);
      setAuth(authData);
    } catch (error) {
      const status  = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 401) {
        Alert.alert('Credenciales incorrectas', 'Correo o contraseña inválidos.');
      } else if (status === 422) {
        Alert.alert('Acceso denegado', message ?? 'Cuenta inactiva o bloqueada.');
      } else if (status === 400) {
        Alert.alert('Datos inválidos', message ?? 'Revisa los campos e intenta de nuevo.');
      } else {
        Alert.alert('Error de conexión', 'No se pudo conectar al servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>

      {/* ── Panel izquierdo: branding ── */}
      <View style={styles.leftPanel}>
        <View style={styles.logoCircle}>
          <Ionicons name="shield" size={52} color="#fff" />
        </View>
        <Text style={styles.appName}>FireHealth</Text>
        <Text style={styles.appSub}>SMAB · Sistema de Monitoreo{'\n'}y Análisis de Bomberos</Text>
        <View style={styles.dividerLine} />
        <Text style={styles.tagline}>
          Monitoreo fisiológico en tiempo real{'\n'}para bomberos en entrenamiento.
        </Text>
        <Text style={styles.countries}>🇪🇨 Ecuador  ·  🇫🇷 Francia</Text>
      </View>

      {/* ── Panel derecho: formulario ── */}
      <KeyboardAvoidingView
        style={styles.rightPanel}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.welcomeTitle}>Bienvenido</Text>
        <Text style={styles.welcomeSub}>
          Ingresa con tu correo electrónico y contraseña.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color="#9AA3B0" />
            <TextInput
              style={styles.input}
              placeholder="usuario@smab.app"
              placeholderTextColor="#BDBDBD"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#9AA3B0" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#BDBDBD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} hitSlop={8}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9AA3B0" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation?.navigate('ForgotPassword')}
          style={styles.forgotRow}
        >
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Ionicons name="log-in-outline" size={18} color="#fff" />
          <Text style={styles.loginBtnText}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F4F6F8',
  },

  // Left panel
  leftPanel: {
    flex: 0.42,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  appName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  appSub: { fontSize: 12, color: '#9AA3B0', textAlign: 'center', lineHeight: 18 },
  dividerLine: {
    width: 40, height: 2, backgroundColor: COLORS.primary,
    borderRadius: 2, marginVertical: 8,
  },
  tagline: { fontSize: 13, color: '#B0B0B0', textAlign: 'center', lineHeight: 20 },
  countries: { fontSize: 13, color: '#6B6B6B', marginTop: 4 },

  // Right panel
  rightPanel: {
    flex: 0.58,
    backgroundColor: '#fff',
    padding: 40,
    justifyContent: 'center',
    gap: 16,
  },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  welcomeSub: { fontSize: 13, color: '#697282', lineHeight: 19, marginBottom: 4 },

  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#495565' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F9FA', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E4EA',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  input: { flex: 1, fontSize: 14, color: '#1A1A1A' },

  forgotRow: { alignSelf: 'flex-end', marginTop: -6 },
  forgotText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, marginTop: 4,
  },
  loginBtnDisabled: { backgroundColor: '#BDBDBD' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
