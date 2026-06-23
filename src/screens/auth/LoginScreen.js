import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import useAuthStore from '../../store/authStore';

// ── Demo credentials — reemplazar con api.post('/auth/login') en Sprint 2 ────
const DEMO_USERS = [
  { token: 'admin-001',    password: '1234', role: 'ADMIN',               name: 'Sara Flores'    },
  { token: 'medical-001',  password: '1234', role: 'MEDICAL',             name: 'Michael Poveda' },
  { token: 'trainee-001',  password: '1234', role: 'FIREFIGHTER_TRAINEE', name: 'Carlos Ruiz'    },
  { token: 'research-001', password: '1234', role: 'RESEARCHER',          name: 'Ana Torres'     },
  { token: 'sysadmin-001', password: '1234', role: 'SYSTEM_ADMIN',        name: 'Admin Sistema'  },
  { token: 'capacitator-001', password: '1234', role: 'CAPACITATOR',      name: 'Capacitador'    },
];

export default function LoginScreen({ navigation }) {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [token,    setToken]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  function handleLogin() {
    if (!token.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa el token de invitación y tu contraseña.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const user = DEMO_USERS.find(
        (u) => u.token === token.trim() && u.password === password
      );
      if (user) {
        setAuth({ user: { name: user.name, email: `${user.token}@smab.app` }, role: user.role, token: user.token });
      } else {
        Alert.alert('Credenciales incorrectas', 'Token o contraseña inválidos.');
      }
      setLoading(false);
    }, 300);
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
          Ingresa con tu token de invitación para acceder al sistema.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Token de invitación</Text>
          <View style={styles.inputBox}>
            <Ionicons name="key-outline" size={18} color="#9AA3B0" />
            <TextInput
              style={styles.input}
              placeholder="ej. medical-001"
              placeholderTextColor="#BDBDBD"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
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

        {/* Tokens de prueba — quitar en producción */}
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>TOKENS DE PRUEBA  (contraseña: 1234)</Text>
          {DEMO_USERS.map((u) => (
            <TouchableOpacity key={u.token} onPress={() => { setToken(u.token); setPassword('1234'); }}>
              <Text style={styles.hintItem}>
                <Text style={styles.hintToken}>{u.token}</Text>
                {'   '}{u.role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

  hintBox: {
    backgroundColor: '#F8F9FA', borderRadius: 10,
    padding: 12, gap: 5, marginTop: 4,
    borderWidth: 1, borderColor: '#E0E4EA',
  },
  hintTitle: { fontSize: 10, fontWeight: '700', color: '#9AA3B0', marginBottom: 2 },
  hintItem: { fontSize: 11, color: '#697282' },
  hintToken: { color: COLORS.primary, fontWeight: '700' },
});
