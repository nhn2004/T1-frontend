import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color="#111" />
          <Text style={styles.backButtonText}>Volver a Capacitación</Text>
        </TouchableOpacity>
        
        <View style={styles.sessionInfo}>
          <View style={styles.sessionIconBox}>
            <Ionicons name="shield-outline" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.sessionTitle}>Capacitación: {data.sessionName}</Text>
            <Text style={styles.sessionDate}>{data.sessionDate}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.bodyHeader}>
          <View>
            <Text style={styles.pageTitle}>Resultados de {nameToDisplay}</Text>
            <Text style={styles.pageSubtitle}>Análisis fisiológico completo</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color="#111" />
            <Text style={styles.backButtonText}>Volver a Bomberos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentRow}>
          {/* Left Column: Human Body Mock */}
          <View style={styles.humanBodyContainer}>
            {/* Since we don't have the anatomical image, we use a placeholder or the provided image */}
            <View style={styles.humanBodyPlaceholder}>
               <Ionicons name="body-outline" size={200} color="#CBD5E1" />
               <Text style={styles.humanBodyText}>Modelo Fisiológico</Text>
            </View>
          </View>

          {/* Right Column: Metrics Grid */}
          <View style={styles.metricsContainer}>
            <Text style={styles.metricsTitle}>Métricas Detalladas</Text>
            <View style={styles.metricsGrid}>
              
              {/* Heart Rate */}
              <MetricCard metric={data.metrics.frecuenciaCardiaca} title="Frecuencia Cardíaca" />
              
              {/* Oxygen */}
              <MetricCard metric={data.metrics.nivelOxigeno} title="Nivel de Oxígeno SpO₂" />
              
              {/* Respiratory Rate */}
              <MetricCard metric={data.metrics.frecuenciaRespiratoria} title="Frecuencia Respiratoria" />
              
              {/* CO Level */}
              <MetricCard metric={data.metrics.nivelCO} title="Nivel de CO" />
              
              {/* Temperature */}
              <MetricCard metric={data.metrics.temperatura} title="Temperatura Corporal" />

            </View>
          </View>
        </View>
      </ScrollView>
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
  topHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 3,
    borderBottomColor: '#D83B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 16,
    gap: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DEE3EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  backButtonText: { fontSize: 13, fontWeight: '500', color: '#111' },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E85D27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  sessionDate: { fontSize: 12, color: '#697282', marginTop: 2 },
  
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 40, paddingTop: 30, paddingBottom: 40 },
  bodyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  pageTitle: { fontSize: 24, fontWeight: '600', color: '#2C323A', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#697282' },

  contentRow: {
    flexDirection: 'row',
    gap: 40,
  },
  humanBodyContainer: {
    width: 300,
    alignItems: 'center',
  },
  humanBodyPlaceholder: {
    width: 250,
    height: 500,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  humanBodyText: {
    marginTop: 20,
    color: '#64748B',
    fontWeight: '500',
  },
  
  metricsContainer: {
    flex: 1,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C323A',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 32,
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
