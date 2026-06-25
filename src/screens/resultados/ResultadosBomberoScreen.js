import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BodyDiagram2D from './components/BodyDiagram2D';

const BODY_PANEL_WIDTH = 380;
const BODY_IMAGE_HEIGHT = 630;

// Mock data
const MOCK_RESULTS = {
  'firefighter-002': {
    name: 'Juan Pérez',
    sessionName: 'Chequeo Rutinario',
    sessionDate: '2 Nov 2025 - 09:00 AM',
    metrics: {
      frecuenciaCardiaca: { value: 82, status: 'Normal', color: '#E85D27', icon: 'heart-outline', unit: 'bpm', progress: 0.3 },
      nivelOxigeno: { value: 98, status: 'Normal', color: '#27B8A1', icon: 'water-outline', unit: '%', progress: 0.9 },
      frecuenciaRespiratoria: { value: 18, status: 'Normal', color: '#F18C00', icon: 'leaf-outline', unit: 'rpm', progress: 0.2 },
      nivelCO: { value: 0.2, status: 'Seguro', color: '#D83B35', icon: 'cloud-outline', unit: 'CO%', progress: 0.1 },
      temperatura: { value: 36.8, status: 'Normal', color: '#E85D27', icon: 'thermometer-outline', unit: '°C', progress: 0.4 },
    },
    image: require('../../assets/people/bombero.png')
  },
  'default': {
    name: 'Maria Espinoza',
    sessionName: 'Chequeo Rutinario',
    sessionDate: '2 Nov 2025 - 09:00 AM',
    metrics: {
      frecuenciaCardiaca: { value: 78, status: 'Normal', color: '#E85D27', icon: 'heart-outline', unit: 'bpm', progress: 0.25 },
      nivelOxigeno: { value: 99, status: 'Normal', color: '#27B8A1', icon: 'water-outline', unit: '%', progress: 0.95 },
      frecuenciaRespiratoria: { value: 16, status: 'Normal', color: '#F18C00', icon: 'leaf-outline', unit: 'rpm', progress: 0.15 },
      nivelCO: { value: 0.1, status: 'Seguro', color: '#D83B35', icon: 'cloud-outline', unit: 'CO%', progress: 0.05 },
      temperatura: { value: 36.5, status: 'Normal', color: '#E85D27', icon: 'thermometer-outline', unit: '°C', progress: 0.35 },
    },
    image: require('../../assets/people/bombero.png')
  }
};

export default function ResultadosBomberoScreen({ route, navigation }) {
  const { bomberoId, bomberoName } = route.params || {};
  const data = MOCK_RESULTS[bomberoId] || MOCK_RESULTS['default'];
  const nameToDisplay = bomberoName || data.name;
  const [activeMetric, setActiveMetric] = useState(null);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>Resultados de {nameToDisplay}</Text>
          <View style={styles.sessionInfoRow}>
            <Ionicons name="shield-outline" size={14} color="#E85D27" />
            <Text style={styles.sessionTitle}>{data.sessionName}</Text>
            <Text style={styles.sessionDot}>·</Text>
            <Ionicons name="calendar-outline" size={13} color="#697282" />
            <Text style={styles.sessionDate}>{data.sessionDate}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color="#111" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <Pressable style={styles.body} onPress={() => setActiveMetric(null)}>
        <View style={styles.contentRow}>
          {/* Left Column: Body Diagram */}
          <View style={styles.humanBodyContainer}>
            <Text style={styles.columnTitle}> </Text>
            <BodyDiagram2D
              metrics={data.metrics}
              activeMetric={activeMetric}
              onSelectMetric={(key) => setActiveMetric(prev => prev === key ? null : key)}
            />
          </View>

          {/* Right Column: Metrics Grid */}
          <View style={styles.metricsContainer}>
            <Text style={styles.columnTitle}>Métricas Detalladas</Text>
            <View style={styles.metricsGrid}>
              <MetricCard
                metric={data.metrics.frecuenciaCardiaca}
                title="Frecuencia Cardíaca"
                active={activeMetric === 'frecuenciaCardiaca'}
              />
              <MetricCard
                metric={data.metrics.nivelOxigeno}
                title="Nivel de Oxígeno SpO₂"
                active={activeMetric === 'nivelOxigeno'}
              />
              <MetricCard
                metric={data.metrics.frecuenciaRespiratoria}
                title="Frecuencia Respiratoria"
                active={activeMetric === 'frecuenciaRespiratoria'}
              />
              <MetricCard
                metric={data.metrics.nivelCO}
                title="Nivel de CO"
                active={activeMetric === 'nivelCO'}
              />
              <MetricCard
                metric={data.metrics.temperatura}
                title="Temperatura Corporal"
                active={activeMetric === 'temperatura'}
              />
            </View>
          </View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

function metricSoftColor(color) {
  if (typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    return `${color}18`;
  }
  return 'rgba(39, 184, 161, 0.1)';
}

function MetricCard({ metric, title, active }) {
  const statusColor = metric.status === 'Normal' || metric.status === 'Seguro' ? '#27B8A1' : metric.color;

  return (
    <View style={[styles.metricCard, active && { borderColor: metric.color }]}>
      <View style={styles.metricMainRow}>
        <View style={[styles.metricIconBox, { backgroundColor: metricSoftColor(metric.color) }]}>
          <Ionicons name={metric.icon} size={20} color={metric.color} />
        </View>

        <View style={styles.metricTextBlock}>
          <Text style={styles.metricTitle} numberOfLines={1}>{title}</Text>
          <View style={[styles.metricStatusBadge, { backgroundColor: metricSoftColor(statusColor) }]}>
            <Text style={[styles.metricStatus, { color: statusColor }]}>{metric.status}</Text>
          </View>
        </View>

        <View style={styles.metricValueBlock}>
          <Text style={styles.metricValue}>{metric.value}</Text>
          <Text style={styles.metricUnit}>{metric.unit}</Text>
        </View>
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

  body: { flex: 1, paddingHorizontal: 26, paddingTop: 14, paddingBottom: 22 },

  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 42,
  },
  humanBodyContainer: {
    width: BODY_PANEL_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  metricsContainer: {
    width: BODY_PANEL_WIDTH,
  },
  columnTitle: {
    height: 24,
    fontSize: 16,
    fontWeight: '700',
    color: '#2C323A',
    marginBottom: 8,
  },
  metricsGrid: {
    height: BODY_IMAGE_HEIGHT,
    flexDirection: 'column',
    gap: 10,
  },
  metricCard: {
    width: '100%',
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    justifyContent: 'space-between',
  },
  metricMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C323A',
  },
  metricStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metricStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricValueBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 5,
    minWidth: 96,
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
