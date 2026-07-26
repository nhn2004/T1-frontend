import React, { useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { a11yButton, a11yDecorative, a11yModal, MIN_TOUCH_SIZE } from '../constants/a11y';

// Modal genérico de confirmación Sí/No — Alert.alert es un no-op en web
// (react-native-web entrega un stub vacío), así que cualquier confirmación que deba
// funcionar en todas las plataformas pasa por este Modal.

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const tone = destructive ? theme.status.danger : theme.status.success;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.card} {...a11yModal(title)}>
              <View style={[styles.iconBox, { backgroundColor: tone.bg }]} {...a11yDecorative}>
                <Ionicons
                  name={destructive ? 'alert-circle-outline' : 'help-circle-outline'}
                  size={26}
                  color={tone.fg}
                />
              </View>

              <Text style={styles.title} accessibilityRole="header">{title}</Text>
              {!!message && <Text style={styles.message}>{message}</Text>}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onCancel}
                  activeOpacity={0.8}
                  {...a11yButton(cancelLabel)}
                >
                  <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: tone.solid }]}
                  onPress={onConfirm}
                  activeOpacity={0.85}
                  {...a11yButton(confirmLabel, {
                    hint: destructive ? message : undefined,
                  })}
                >
                  <Text style={[styles.confirmBtnText, { color: tone.onSolid }]}>
                    {confirmLabel}
                  </Text>
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
    title: {
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 8,
      color: t.textPrimary,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 18,
      color: t.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    cancelBtn: {
      flex: 1,
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center',
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: 'center',
      borderColor: t.borderStrong,
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: t.textSecondary,
    },
    confirmBtn: {
      flex: 1,
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center',
      borderRadius: 10,
      alignItems: 'center',
    },
    confirmBtnText: {
      fontSize: 15,
      fontWeight: '700',
    },
  });
