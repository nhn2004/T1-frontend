import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, TouchableWithoutFeedback, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Dos estados internos:
//   'options'  → muestra Aprobar y Rechazar
//   'reject'   → muestra campo de texto para el motivo

export default function ConfirmApprovalModal({ visible, item, onApprove, onReject, onCancel }) {
  const [view, setView]     = useState('options'); // 'options' | 'reject'
  const [reason, setReason] = useState('');

  if (!item) return null;

  function handleClose() {
    setView('options');
    setReason('');
    onCancel();
  }

  function handleApprove() {
    setView('options');
    setReason('');
    onApprove(item.id);
  }

  function handleSendReject() {
    if (!reason.trim()) return;
    setView('options');
    const r = reason;
    setReason('');
    onReject(item.id, r);
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>

              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.iconBox, view === 'reject' && styles.iconBoxRed]}>
                  <Ionicons
                    name={view === 'reject' ? 'close-circle' : 'document-text'}
                    size={22}
                    color={view === 'reject' ? '#C62828' : '#F57C00'}
                  />
                </View>
                <Text style={styles.title}>
                  {view === 'reject' ? 'Motivo de rechazo' : 'Revisar Solicitud'}
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#697282" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Info del doctor — siempre visible */}
              <Text style={styles.sectionLabel}>PERSONAL MÉDICO</Text>
              <View style={styles.infoRow}>
                <Ionicons name="person-circle-outline" size={16} color="#495565" />
                <Text style={styles.infoText}>{item.doctorName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="medical-outline" size={16} color="#495565" />
                <Text style={styles.infoText}>{item.specialty}</Text>
              </View>

              <View style={styles.spacer} />

              <Text style={styles.sectionLabel}>JEFE A CARGO</Text>
              <View style={styles.infoRow}>
                <Ionicons name="shield-outline" size={16} color="#495565" />
                <View>
                  <Text style={styles.infoText}>{item.requestedBy?.name}</Text>
                  <Text style={styles.infoSubtext}>{item.requestedBy?.role}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Vista opciones */}
              {view === 'options' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => setView('reject')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#C62828" />
                    <Text style={styles.rejectBtnText}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={handleApprove}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={styles.approveBtnText}>Aprobar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Vista rechazo */}
              {view === 'reject' && (
                <View style={styles.rejectView}>
                  <Text style={styles.rejectLabel}>Escribe el motivo del rechazo:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Motivo..."
                    placeholderTextColor="#BDBDBD"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    autoFocus
                  />
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setView('options')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Volver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveBtn, !reason.trim() && styles.btnDisabled]}
                      onPress={handleSendReject}
                      activeOpacity={0.8}
                      disabled={!reason.trim()}
                    >
                      <Ionicons name="send" size={14} color="#fff" />
                      <Text style={styles.approveBtnText}>Enviar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxRed: { backgroundColor: '#FFEBEE' },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 14 },
  spacer: { height: 10 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#9AA3B0',
    letterSpacing: 1, marginBottom: 8,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, color: '#2E2E2E', fontWeight: '500' },
  infoSubtext: { fontSize: 11, color: '#697282', marginTop: 1 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#DDE1E7', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#495565' },
  approveBtn: {
    flex: 1, flexDirection: 'row', gap: 6,
    paddingVertical: 11, borderRadius: 10,
    backgroundColor: '#00A63E',
    alignItems: 'center', justifyContent: 'center',
  },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  rejectBtn: {
    flex: 1, flexDirection: 'row', gap: 6,
    paddingVertical: 11, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#C62828',
    alignItems: 'center', justifyContent: 'center',
  },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: '#C62828' },
  btnDisabled: { backgroundColor: '#D0D0D0' },

  rejectView: { gap: 10 },
  rejectLabel: { fontSize: 13, color: '#495565', fontWeight: '600' },
  textInput: {
    borderWidth: 1.5, borderColor: '#DDE1E7', borderRadius: 10,
    padding: 12, fontSize: 13, color: '#2E2E2E',
    minHeight: 80, backgroundColor: '#FAFAFA',
  },
});
