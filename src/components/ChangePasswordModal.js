import React, { useCallback, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { a11yButton, a11yModal } from '../constants/a11y';
import { authService } from '../services';
import FormField from '../screens/settings/components/FormField';

// Compartido entre ProfileScreen y (potencialmente) SettingsScreen — `t` debe traer
// las claves changePassword* / currentPasswordLabel / etc. y `cancel`.
export default function ChangePasswordModal({ visible, t, theme, onClose, onSuccess }) {
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
