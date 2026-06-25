import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BodyDiagram2D from './components/BodyDiagram2D';
import { vitalSignsService } from '../../services/vitalSignsService';
import { COLORS } from '../../constants';

const EMPTY_METRICS = {
  frecuenciaCardiaca:     { value: '—', status: '—', color: '#E85D27', icon: 'heart-outline',       unit: 'bpm', progress: 0 },
  nivelOxigeno:           { value: '—', status: '—', color: '#27B8A1', icon: 'water-outline',        unit: '%',   progress: 0 },
  frecuenciaRespiratoria: { value: '—', status: '—', color: '#F18C00', icon: 'leaf-outline',         unit: 'rpm', progress: 0 },
  nivelCO:                { value: '—', status: '—', color: '#D83B35', icon: 'cloud-outline',        unit: 'ppm', progress: 0 },
  temperatura:            { value: '—', status: '—', color: '#E85D27', icon: 'thermometer-outline',  unit: '°C',  progress: 0 },
};

export default function ResultadosBomberoScreen({ route, navigation }) {
  const { bomberoId, bomberoName } = route.params || {};
  const nameToDisplay = bomberoName ?? 'Bombero';
  const [metrics,      setMetrics]      = useState(EMPTY_METRICS);
  const [loading,      setLoading]      = useState(true);
  const [activeMetric, setActiveMetric] = useState(null);

  useEffect(() => {
    if (!bomberoId) { setLoading(false); return; }
    vitalSignsService.getByParticipant(bomberoId)
      .then(({ metrics: m }) => { if (m) setMetrics(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bomberoId]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>Resultados de {nameToDisplay}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color="#111" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.contentRow}>
            <View style={styles.humanBodyContainer}>
              <BodyDiagram2D
                metrics={metrics}
                activeMetric={activeMetric}
                onSelectMetric={(key) => setActiveMetric(prev => prev === key ? null : key)}
              />
            </View>

            <View style={styles.metricsContainer}>
              <Text style={styles.metricsTitle}>Métricas Detalladas</Text>
              <View style={styles.metricsGrid}>
                <MetricCard metric={metrics.frecuenciaCardiaca}     title="Frecuencia Cardíaca" />
                <MetricCard metric={metrics.nivelOxigeno}           title="Nivel de Oxígeno SpO₂" />
                <MetricCard metric={metrics.frecuenciaRespiratoria} title="Frecuencia Respiratoria" />
                <MetricCard metric={metrics.nivelCO}                title="Nivel de CO" />
                <MetricCard metric={metrics.temperatura}            title="Temperatura Corporal" />
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function MetricCard({ metric, title }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={styles.metricTitleRow}>
          <Ionicons name={metric.icon} size={18} color={metric.color} />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <Text style={[styles.metricStatus, { color: metric.status === 'Normal' || metric.status === 'Seguro' ? '#27B8A1' : metric.color }]}>
          {metric.status}
        </Text>
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{metric.value}</Text>
        <Text style={styles.metricUnit}>{metric.unit}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${metric.progress * 100}%`, backgroundColor: metric.color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F4F8' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  headerLeft: { gap: 4 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  sessionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionTitle: { fontSize: 13, fontWeight: '600', color: '#2C323A' },
  sessionDot: { fontSize: 13, color: '#B0B7C3' },
  sessionDate: { fontSize: 12, color: '#697282' },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#DEE3EA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  backButtonText: { fontSize: 13, fontWeight: '600', color: '#111' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: 20, paddingVertical: 16 },

  contentRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
  },
  humanBodyContainer: {
    width: 280,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },

  metricsContainer: {
    flex: 1,
  },
  metricsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C323A',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#495565',
  },
  metricStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E9399',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F4F8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
