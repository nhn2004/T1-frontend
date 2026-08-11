import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TouchableWithoutFeedback, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import { a11yButton, a11yDecorative, a11yModal, ICON_HIT_SLOP, MIN_TOUCH_SIZE } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../../constants/typography';

// Dos vistas internas:
//   'options' → Aprobar / Rechazar
//   'reject'  → campo de texto con el motivo del rechazo

export default function ConfirmApprovalModal({ visible, item, onApprove, onReject, onCancel, busy }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [view, setView]     = useState('options');
  const [reason, setReason] = useState('');

  const reset = useCallback(() => {
    setView('options');
    setReason('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const handleApprove = useCallback(() => {
    // No se limpia el estado aquí: la pantalla cierra el modal cuando la llamada al
    // servidor termina. Limpiar antes haría parpadear la vista si la petición falla.
    onApprove(item.id);
  }, [onApprove, item]);

  const handleSendReject = useCallback(() => {
    if (!reason.trim()) return;
    onReject(item.id, reason.trim());
  }, [onReject, item, reason]);

  if (!item) return null;

  const isReject = view === 'reject';
  const tone = isReject ? theme.status.danger : theme.status.warning;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView style={styles.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={busy ? undefined : handleClose} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.card} {...a11yModal(isReject ? 'Motivo de rechazo' : 'Revisar solicitud')}>
              <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: tone.bg }]} {...a11yDecorative}>
                  <Ionicons
                    name={isReject ? 'close-circle' : 'document-text'}
                    size={22}
                    color={tone.fg}
                  />
                </View>
                <Text style={styles.title} accessibilityRole="header">
                  {isReject ? 'Motivo de rechazo' : 'Revisar Solicitud'}
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={ICON_HIT_SLOP}
                  disabled={busy}
                  {...a11yButton('Cerrar', { disabled: busy })}
                >
                  <Ionicons name="close" size={22} color={theme.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} {...a11yDecorative} />

              {/* En pantallas bajas (poco alto disponible) el contenido de esta sección
                  podía superar el `maxHeight: '90%'` de la tarjeta sin forma de
                  desplazarse, dejando los botones de Aprobar/Rechazar inalcanzables. */}
              <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>PERSONAL MÉDICO</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person-circle-outline" size={16} color={theme.icon} {...a11yDecorative} />
                  <Text style={styles.infoText} numberOfLines={2}>{item.doctorName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="medical-outline" size={16} color={theme.icon} {...a11yDecorative} />
                  <Text style={styles.infoText} numberOfLines={2}>{item.specialty}</Text>
                </View>

                <View style={styles.spacer} />

                <Text style={styles.sectionLabel}>JEFE A CARGO</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="shield-outline" size={16} color={theme.icon} {...a11yDecorative} />
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoText}>{item.requestedBy?.name}</Text>
                    <Text style={styles.infoSubtext}>{item.requestedBy?.role}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.divider} {...a11yDecorative} />

              {!isReject && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => setView('reject')}
                    activeOpacity={0.8}
                    disabled={busy}
                    {...a11yButton('Rechazar', { disabled: busy })}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={16}
                      color={theme.status.danger.fg}
                      {...a11yDecorative}
                    />
                    <Text style={styles.rejectBtnText}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.approveBtn, busy && styles.btnBusy]}
                    onPress={handleApprove}
                    activeOpacity={0.8}
                    disabled={busy}
                    {...a11yButton('Aprobar', { disabled: busy, busy })}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={theme.status.success.onSolid} />
                    ) : (
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={16}
                        color={theme.status.success.onSolid}
                        {...a11yDecorative}
                      />
                    )}
                    <Text style={styles.approveBtnText}>Aprobar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isReject && (
                <View style={styles.rejectView}>
                  <Text style={styles.rejectLabel} nativeID="rejectReasonLabel">
                    Escribe el motivo del rechazo:
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Motivo…"
                    placeholderTextColor={theme.textPlaceholder}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    autoFocus
                    editable={!busy}
                    accessibilityLabel="Motivo del rechazo"
                    accessibilityLabelledBy="rejectReasonLabel"
                  />
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setView('options')}
                      activeOpacity={0.8}
                      disabled={busy}
                      {...a11yButton('Volver', { disabled: busy })}
                    >
                      <Text style={styles.cancelBtnText}>Volver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveBtn, (!reason.trim() || busy) && styles.btnDisabled]}
                      onPress={handleSendReject}
                      activeOpacity={0.8}
                      disabled={!reason.trim() || busy}
                      {...a11yButton('Enviar rechazo', {
                        disabled: !reason.trim() || busy,
                        busy,
                      })}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={theme.status.success.onSolid} />
                      ) : (
                        <Ionicons
                          name="send"
                          size={14}
                          color={theme.status.success.onSolid}
                          {...a11yDecorative}
                        />
                      )}
                      <Text style={styles.approveBtnText}>Enviar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    kbAvoid: { flex: 1 },
    overlay: {
      flex: 1,
      backgroundColor: t.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 18,
      padding: 22,
      width: '100%',
      maxWidth: 440,
      maxHeight: '90%',
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: t.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: t.shadowOpacity * 3,
      shadowRadius: 20,
      elevation: 12,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    iconBox: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    title: { flex: 1, ...TEXT_STYLES.modalTitle, color: t.textPrimary },
    // flexShrink permite que este bloque ceda espacio al resto de la tarjeta (header,
    // botones) y se vuelva desplazable en vez de forzar overflow fuera de la tarjeta.
    scrollBody: { flexShrink: 1 },
    divider: { height: 1, backgroundColor: t.divider, marginVertical: 14 },
    spacer: { height: 10 },
    sectionLabel: {
      fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: t.textMuted,
      letterSpacing: 1, marginBottom: 8,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
    infoBlock: { flex: 1, minWidth: 0 },
    infoText: { flex: 1, minWidth: 0, fontSize: FONT_SIZE.lg, color: t.textPrimary, fontWeight: FONT_WEIGHT.medium },
    infoSubtext: { fontSize: FONT_SIZE.md, color: t.textSecondary, marginTop: 1 },

    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: {
      flex: 1, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center', borderRadius: 10,
      borderWidth: 1.5, borderColor: t.borderStrong, alignItems: 'center',
    },
    cancelBtnText: { ...TEXT_STYLES.button, color: t.textSecondary },
    approveBtn: {
      flex: 1, flexDirection: 'row', gap: 6,
      minHeight: MIN_TOUCH_SIZE, borderRadius: 10,
      backgroundColor: t.status.success.solid,
      alignItems: 'center', justifyContent: 'center',
    },
    approveBtnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.status.success.onSolid },
    rejectBtn: {
      flex: 1, flexDirection: 'row', gap: 6,
      minHeight: MIN_TOUCH_SIZE, borderRadius: 10,
      backgroundColor: t.card, borderWidth: 1.5, borderColor: t.status.danger.border,
      alignItems: 'center', justifyContent: 'center',
    },
    rejectBtnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.status.danger.fg },
    btnDisabled: { backgroundColor: t.disabledBg },
    btnBusy: { opacity: 0.85 },

    rejectView: { gap: 10 },
    rejectLabel: { ...TEXT_STYLES.bodyBold, color: t.textSecondary },
    textInput: {
      borderWidth: 1.5, borderColor: t.border, borderRadius: 10,
      padding: 12, fontSize: FONT_SIZE.lg, color: t.textPrimary,
      minHeight: 80, backgroundColor: t.cardAlt,
    },
  });
