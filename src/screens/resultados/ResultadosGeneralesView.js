import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ResultadosGeneralesView() {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Métricas promedio de todos los bomberos en esta Capacitación</Text>
      
      <View style={styles.topCardsRow}>
        <TopCard title="Bomberos" value="10" icon="people-outline" color="#E85D27" tag="Total" />
        <TopCard title="Reportes" value="4" icon="pulse-outline" color="#27B8A1" tag="Completados" />
        <TopCard title="% Completado" value="40" icon="trending-up-outline" color="#3B82F6" tag="Progreso" />
        <TopCard title="bpm" value="78" icon="heart-outline" color="#A855F7" tag="Promedio" />
      </View>

      <Text style={styles.sectionTitle}>Promedios de Signos Vitales</Text>

      <View style={styles.metricsGrid}>
        <MetricAverageCard 
          title="Frecuencia Cardíaca Promedio" 
          value="78" 
          unit="bpm" 
          icon="heart-outline" 
          color="#E85D27" 
          progress={0.5} 
        />
        <MetricAverageCard 
          title="Temperatura Promedio" 
          value="36.9" 
          unit="°C" 
          icon="thermometer-outline" 
          color="#EF4444" 
          progress={0.6} 
        />
        <MetricAverageCard 
          title="Frecuencia Respiratoria Promedio" 
          value="17" 
          unit="rpm" 
          icon="leaf-outline" 
          color="#F97316" 
          progress={0.4} 
        />
        <MetricAverageCard 
          title="Nivel de Oxígeno Promedio" 
          value="97" 
          unit="%" 
          icon="water-outline" 
          color="#14B8A6" 
          progress={0.9} 
        />
      </View>
    </View>
  );
}

function TopCard({ title, value, icon, color, tag }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [animValue]);

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={[styles.topCard, { backgroundColor: color }]}>
      <View style={styles.topCardHeader}>
        <Animated.View style={{ transform: [{ scale }], opacity: animValue }}>
          <Ionicons name={icon} size={24} color="#fff" />
        </Animated.View>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
      <View style={styles.topCardBody}>
        <Text style={styles.topCardValue}>{value}</Text>
        <Text style={styles.topCardTitle}>{title}</Text>
      </View>
    </View>
  );
}

function MetricAverageCard({ title, value, unit, icon, color, progress }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, animValue]);

  const width = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconBox, { backgroundColor: color }]}>
          <Ionicons name={icon} size={18} color="#fff" />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBarFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#697282',
    marginBottom: 20,
  },
  topCardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  topCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  topCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tagBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  topCardBody: {
    marginTop: 8,
  },
  topCardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  topCardTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginTop: 4,
  },
  sectionTitle: {
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
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495565',
    flex: 1,
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
