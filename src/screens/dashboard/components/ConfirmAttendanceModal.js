import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// Confirmation dialog shown before accepting a session invitation.

export default function ConfirmAttendanceModal({ visible, invitation, onConfirm, onCancel }) {
  const theme = useTheme();
  const { t } = useTranslation();
  if (!invitation) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.badge.success.bg }]}>
                <Ionicons name="checkmark-circle-outline" size={26} color={theme.badge.success.text} />
              </View>

              <Text style={[styles.title, { color: theme.textPrimary }]}>{t.confirmAttendanceModal.title}</Text>
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                {t.confirmAttendanceModal.messagePrefix}{' '}
                <Text style={[styles.bold, { color: theme.textPrimary }]}>{invitation.title}</Text>
                {' '}{t.confirmAttendanceModal.messageSuffix(invitation.date)}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={onCancel}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>{t.confirmAttendanceModal.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => onConfirm(invitation.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 18,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  bold: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDE1E7',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495565',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#00A63E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
