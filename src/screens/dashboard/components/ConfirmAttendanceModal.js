import React, { useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { a11yButton, a11yDecorative, a11yModal, MIN_TOUCH_SIZE } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../../constants/typography';

// Diálogo de confirmación antes de aceptar una invitación de sesión.

export default function ConfirmAttendanceModal({ visible, invitation, onConfirm, onCancel, busy }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (!invitation) return null;

  const tone = theme.status.success;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={busy ? undefined : onCancel} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.card} {...a11yModal(t.confirmAttendanceModal.title)}>
              <View style={[styles.iconBox, { backgroundColor: tone.bg }]} {...a11yDecorative}>
                <Ionicons name="checkmark-circle-outline" size={26} color={tone.fg} />
              </View>

              <Text style={styles.title} accessibilityRole="header">
                {t.confirmAttendanceModal.title}
              </Text>
              <Text style={styles.message}>
                {t.confirmAttendanceModal.messagePrefix}{' '}
                <Text style={styles.bold}>{invitation.title}</Text>
                {' '}{t.confirmAttendanceModal.messageSuffix(invitation.date)}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onCancel}
                  activeOpacity={0.8}
                  disabled={busy}
                  {...a11yButton(t.confirmAttendanceModal.cancel, { disabled: busy })}
                >
                  <Text style={styles.cancelBtnText}>{t.confirmAttendanceModal.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, busy && styles.confirmBtnBusy]}
                  onPress={() => onConfirm(invitation.id)}
                  activeOpacity={0.85}
                  disabled={busy}
                  {...a11yButton(t.confirmAttendanceModal.confirm, { disabled: busy, busy })}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={tone.onSolid} />
                  ) : (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color={tone.onSolid}
                      {...a11yDecorative}
                    />
                  )}
                  <Text style={styles.confirmBtnText}>{t.confirmAttendanceModal.confirm}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: t.overlay,
    },
    card: {
      borderRadius: 18,
      padding: 22,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: t.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: t.shadowOpacity * 3,
      shadowRadius: 20,
      elevation: 12,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    title: { ...TEXT_STYLES.modalTitle, marginBottom: 8, color: t.textPrimary, textAlign: 'center' },
    message: { ...TEXT_STYLES.body, textAlign: 'center', lineHeight: 20, marginBottom: 18, color: t.textSecondary },
    bold: { fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },

    actions: { flexDirection: 'row', gap: 10, width: '100%' },
    cancelBtn: {
      flex: 1,
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center',
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.borderStrong,
      alignItems: 'center',
    },
    cancelBtnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: t.textSecondary },
    confirmBtn: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      minHeight: MIN_TOUCH_SIZE,
      borderRadius: 10,
      backgroundColor: t.status.success.solid,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnBusy: { opacity: 0.8 },
    confirmBtnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.status.success.onSolid },
  });
