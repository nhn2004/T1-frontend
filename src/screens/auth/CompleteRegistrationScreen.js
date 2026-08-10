import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants/routes';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { a11yAlert, a11yButton, a11yDecorative, ICON_HIT_SLOP, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { authService } from '../../services/authService';
import useTheme from '../../hooks/useTheme';

const MIN_PASSWORD_LENGTH = 8;
const SEX_OPTIONS = ['M', 'F', 'Otro'];
const PROFESSION_OPTIONS = ['Médico', 'Enfermero', 'Nutricionista'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Este enlace llega por correo (ver InvitationService/RegistrationService en el
// backend) en dos variantes:
//   ?type=invite   → cuenta nueva a partir de una invitación (cualquier rol)
//   ?type=activate → primera contraseña de una cuenta ya creada directamente
//                     (ej. "Agregar Personal", que antes no dejaba forma de entrar)
export default function CompleteRegistrationScreen({ navigation, route }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const token = route?.params?.token ?? '';
  const type  = route?.params?.type === 'activate' ? 'activate' : 'invite';

  const [loadingPreview, setLoadingPreview] = useState(type === 'invite');
  const [previewError,   setPreviewError]   = useState('');
  const [targetEmail,    setTargetEmail]    = useState('');
  const [roleCode,       setRoleCode]       = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Aspirante a bombero — el código de aspirante lo genera el backend solo, no tiene
  // sentido pedirle a la persona que se invente un identificador interno.
  const [birthDate,     setBirthDate]     = useState('');
  const [sex,           setSex]           = useState('');
  const [bloodType,     setBloodType]     = useState('');
  const [emergencyContactName,  setEmergencyContactName]  = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Personal médico
  const [profession,    setProfession]    = useState('');
  const [specialty,     setSpecialty]     = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [done,       setDone]       = useState(false);

  useEffect(() => {
    if (!token) {
      setPreviewError('Este enlace no incluye un token válido.');
      setLoadingPreview(false);
      return;
    }
    if (type !== 'invite') return;

    let alive = true;
    authService.invitationPreview(token)
      .then((data) => {
        if (!alive) return;
        setTargetEmail(data.targetEmail);
        setRoleCode(data.roleCode ?? null);
      })
      .catch((err) => {
        if (!alive) return;
        setPreviewError(err.response?.data?.message ?? 'El enlace es inválido o ya expiró.');
      })
      .finally(() => { if (alive) setLoadingPreview(false); });
    return () => { alive = false; };
  }, [token, type]);

  const handleSubmit = useCallback(async () => {
    setErrorMsg('');
    if (!password) { setErrorMsg('Ingresa una contraseña.'); return; }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) { setErrorMsg('Las contraseñas no coinciden.'); return; }

    if (type === 'activate') {
      setSubmitting(true);
      try {
        await authService.activateAccount(token, password);
        setDone(true);
      } catch (err) {
        setErrorMsg(err.response?.data?.message ?? 'No se pudo activar la cuenta.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!firstName.trim() || !lastName.trim()) { setErrorMsg('Nombre y apellido son obligatorios.'); return; }

    if (roleCode === ROLES.FIREFIGHTER_TRAINEE) {
      if (!DATE_RE.test(birthDate.trim()) || !sex) {
        setErrorMsg('Fecha de nacimiento (AAAA-MM-DD) y sexo son obligatorios.');
        return;
      }
    } else if (roleCode === ROLES.MEDICAL) {
      if (!profession) { setErrorMsg('Selecciona una profesión.'); return; }
    }

    setSubmitting(true);
    try {
      await authService.completeRegistration({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        password,
        birthDate: birthDate.trim() || null,
        sex: sex || null,
        bloodType: bloodType.trim() || null,
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
        profession: profession || null,
        specialty: specialty.trim() || null,
        licenseNumber: licenseNumber.trim() || null,
      });
      setDone(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'No se pudo completar el registro.');
    } finally {
      setSubmitting(false);
    }
  }, [type, token, password, confirm, firstName, lastName, phone, roleCode,
      birthDate, sex, bloodType, emergencyContactName, emergencyContactPhone,
      profession, specialty, licenseNumber]);

  const ErrorBanner = useCallback(
    ({ message }) => (
      <View style={styles.errorBanner} {...a11yAlert(message)}>
        <Ionicons name="alert-circle-outline" size={18} color={theme.status.danger.fg} {...a11yDecorative} />
        <Text style={styles.errorBannerText}>{message}</Text>
      </View>
    ),
    [styles, theme],
  );

  if (loadingPreview) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (previewError) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.centerFill}>
          <View style={[styles.iconCircle, { backgroundColor: theme.status.danger.bg }]} {...a11yDecorative}>
            <Ionicons name="close-circle-outline" size={32} color={theme.status.danger.fg} />
          </View>
          <Text style={styles.title} accessibilityRole="header">Enlace inválido</Text>
          <Text style={styles.subtitle}>{previewError}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation?.navigate(ROUTES.LOGIN)} activeOpacity={0.85}>
            <Text style={styles.btnText}>Ir al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.centerFill}>
          <View style={[styles.iconCircle, { backgroundColor: theme.status.success.bg }]} {...a11yDecorative}>
            <Ionicons name="checkmark-circle-outline" size={40} color={theme.status.success.fg} />
          </View>
          <Text style={styles.title} accessibilityRole="header" {...a11yAlert('Cuenta lista')}>
            ¡Listo!
          </Text>
          <Text style={styles.subtitle}>
            {type === 'activate'
              ? 'Tu cuenta quedó activada. Ya puedes iniciar sesión con tu contraseña nueva.'
              : 'Tu cuenta se creó exitosamente. Ya puedes iniciar sesión.'}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation?.navigate(ROUTES.LOGIN)} activeOpacity={0.85}>
            <Ionicons name="log-in-outline" size={18} color={theme.onPrimarySolid} {...a11yDecorative} />
            <Text style={styles.btnText}>Ir al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const roleLabel = roleCode ? (ROLE_LABELS[roleCode] ?? roleCode) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.iconCircle} {...a11yDecorative}>
            <Ionicons name={type === 'activate' ? 'key-outline' : 'person-add-outline'} size={32} color={theme.primaryText} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {type === 'activate' ? 'Activa tu cuenta' : 'Completa tu registro'}
          </Text>
          <Text style={styles.subtitle}>
            {type === 'activate'
              ? 'Elige tu contraseña para empezar a usar FireHealth App.'
              : `Te invitaron a FireHealth App${targetEmail ? ` como ${targetEmail}` : ''}${roleLabel ? ` (${roleLabel})` : ''}.`}
          </Text>

          {!!errorMsg && <ErrorBanner message={errorMsg} />}

          {type === 'invite' && (
            <>
              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="crName">Nombres</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor={theme.textPlaceholder}
                    accessibilityLabel="Nombres"
                    accessibilityLabelledBy="crName"
                  />
                </View>
              </View>
              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="crLastName">Apellidos</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholderTextColor={theme.textPlaceholder}
                    accessibilityLabel="Apellidos"
                    accessibilityLabelledBy="crLastName"
                  />
                </View>
              </View>
              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="crPhone">Teléfono (opcional)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.textPlaceholder}
                    accessibilityLabel="Teléfono"
                    accessibilityLabelledBy="crPhone"
                  />
                </View>
              </View>

              {roleCode === ROLES.FIREFIGHTER_TRAINEE && (
                <>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label} nativeID="crBirth">Fecha de nacimiento (AAAA-MM-DD)</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={birthDate}
                        onChangeText={setBirthDate}
                        placeholder="2000-01-31"
                        placeholderTextColor={theme.textPlaceholder}
                        accessibilityLabel="Fecha de nacimiento"
                        accessibilityLabelledBy="crBirth"
                      />
                    </View>
                  </View>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Sexo</Text>
                    <View style={styles.chipRow}>
                      {SEX_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.chip, sex === opt && styles.chipActive]}
                          onPress={() => setSex(opt)}
                          {...a11yButton(opt, { selected: sex === opt })}
                        >
                          <Text style={[styles.chipText, sex === opt && styles.chipTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label} nativeID="crBlood">Tipo de sangre (opcional)</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={bloodType}
                        onChangeText={setBloodType}
                        placeholder="O+"
                        placeholderTextColor={theme.textPlaceholder}
                        accessibilityLabel="Tipo de sangre"
                        accessibilityLabelledBy="crBlood"
                      />
                    </View>
                  </View>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label} nativeID="crEmName">Contacto de emergencia (opcional)</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={emergencyContactName}
                        onChangeText={setEmergencyContactName}
                        placeholderTextColor={theme.textPlaceholder}
                        accessibilityLabel="Contacto de emergencia"
                        accessibilityLabelledBy="crEmName"
                      />
                    </View>
                  </View>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label} nativeID="crEmPhone">Teléfono de emergencia (opcional)</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={emergencyContactPhone}
                        onChangeText={setEmergencyContactPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor={theme.textPlaceholder}
                        accessibilityLabel="Teléfono de emergencia"
                        accessibilityLabelledBy="crEmPhone"
                      />
                    </View>
                  </View>
                </>
              )}

              {roleCode === ROLES.MEDICAL && (
                <>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Profesión</Text>
                    <View style={styles.chipRow}>
                      {PROFESSION_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.chip, profession === opt && styles.chipActive]}
                          onPress={() => setProfession(opt)}
                          {...a11yButton(opt, { selected: profession === opt })}
                        >
                          <Text style={[styles.chipText, profession === opt && styles.chipTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label} nativeID="crSpecialty">Especialidad (opcional)</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={specialty}
                        onChangeText={setSpecialty}
                        placeholderTextColor={theme.textPlaceholder}
                        accessibilityLabel="Especialidad"
                        accessibilityLabelledBy="crSpecialty"
                      />
                    </View>
                  </View>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label} nativeID="crLicense">Número de licencia (opcional)</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={licenseNumber}
                        onChangeText={setLicenseNumber}
                        placeholderTextColor={theme.textPlaceholder}
                        accessibilityLabel="Número de licencia"
                        accessibilityLabelledBy="crLicense"
                      />
                    </View>
                  </View>
                </>
              )}
            </>
          )}

          <View style={styles.fieldBlock}>
            <Text style={styles.label} nativeID="crPwd">Contraseña</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.iconMuted} {...a11yDecorative} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                placeholderTextColor={theme.textPlaceholder}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                autoComplete="new-password"
                accessibilityLabel="Contraseña"
                accessibilityLabelledBy="crPwd"
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
            <Text style={styles.label} nativeID="crConfirm">Confirmar contraseña</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.iconMuted} {...a11yDecorative} />
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repite la contraseña"
                placeholderTextColor={theme.textPlaceholder}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                accessibilityLabel="Confirmar contraseña"
                accessibilityLabelledBy="crConfirm"
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
            style={[styles.btn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
            {...a11yButton(type === 'activate' ? 'Activar cuenta' : 'Crear cuenta', { disabled: submitting, busy: submitting })}
          >
            {submitting
              ? <ActivityIndicator color={theme.onPrimarySolid} size="small" />
              : <Text style={styles.btnText}>{type === 'activate' ? 'Activar cuenta' : 'Crear cuenta'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root:   { flex: 1, backgroundColor: t.card, minHeight: 0 },
    flex:   { flex: 1, minHeight: 0 },
    // `flex:1` no basta en web: por default un hijo flex no se encoge por debajo del
    // alto de su propio contenido (min-height:auto), así que con un formulario más
    // alto que la pantalla el navegador lo dejaba desbordar en vez de activar el
    // scroll interno — como el documento en sí no hace scroll (así está configurado
    // el resto de la app), ese contenido quedaba inalcanzable. `minHeight: 0` es lo
    // que le permite ceder ese espacio y dejar que el ScrollView haga overflow-y:auto.
    scrollFlex: { flex: 1, minHeight: 0 },
    scroll: { flexGrow: 1, padding: 24, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, maxWidth: 480, alignSelf: 'center' },

    iconCircle: {
      width: 72, height: 72, borderRadius: 20,
      backgroundColor: t.primarySoft,
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'flex-start', marginBottom: 4,
    },

    title:    { fontSize: 26, fontWeight: '900', color: t.textPrimary, textAlign: 'center' },
    subtitle: { fontSize: 15, color: t.textSecondary, lineHeight: 21, marginBottom: 4, textAlign: 'center' },

    errorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.status.danger.bg,
      borderWidth: 1.5, borderColor: t.status.danger.border,
      borderRadius: 10, padding: 12,
    },
    errorBannerText: { flex: 1, fontSize: 14, color: t.status.danger.fg, fontWeight: '600' },

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

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
      borderWidth: 1.5, borderColor: t.border, backgroundColor: t.cardAlt,
    },
    chipActive: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    chipText: { fontSize: 13, color: t.textPrimary, fontWeight: '600' },
    chipTextActive: { color: t.onPrimarySolid },

    btn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: t.primarySolid, borderRadius: 14,
      minHeight: MIN_TOUCH_SIZE + 8, marginTop: 4,
    },
    btnDisabled: { backgroundColor: t.disabledBg },
    btnText:     { color: t.onPrimarySolid, fontSize: 16, fontWeight: '800' },
  });
