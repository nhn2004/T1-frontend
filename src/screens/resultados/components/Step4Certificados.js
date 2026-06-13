import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CERTIFICADOS } from '../__mocks__/resultadosData';

export default function Step4Certificados() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Certificados Médicos</Text>
        <Text style={styles.asterisk}> *</Text>
      </View>

      <View style={styles.list}>
        {MOCK_CERTIFICADOS.map(cert => (
          <View key={cert.id} style={styles.certItem}>
            <View style={styles.certIcon}>
              <Ionicons name="document-text" size={22} color="#fff" />
            </View>

            <View style={styles.certInfo}>
              <Text style={styles.certTitle}>{cert.title}</Text>
              <Text style={styles.certMeta}>Fecha: {cert.date} • Tipo: {cert.type}</Text>
            </View>

            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={14} color="#E85D27" />
              <Text style={styles.downloadText}>Descargar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, gap: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  asterisk: { fontSize: 22, fontWeight: '700', color: '#C62828' },
  list: { gap: 12 },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  certIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E85D27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certInfo: { flex: 1, gap: 4 },
  certTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  certMeta: { fontSize: 12, color: '#697282' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E85D27',
  },
  downloadText: { fontSize: 13, fontWeight: '600', color: '#E85D27' },
});
