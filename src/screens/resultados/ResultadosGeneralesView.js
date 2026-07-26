import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vitalSignsService } from '../../services/vitalSignsService';

/** Promedio de los valores no nulos; `null` si no hay ninguno. */
function average(values, decimals = 0) {
  const nums = values.filter((v) => v !== null && v !== undefined && Number.isFinite(v));
  if (!nums.length) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Number(avg.toFixed(decimals));
}

/**
 * Métricas agregadas de la capacitación.
 *
 * Antes todos los valores de esta vista eran constantes escritas a mano ("10 bomberos",
 * "78 bpm", progress 0.5…) que el usuario no podía distinguir de datos reales. Ahora se
 * calculan a partir de las mediciones de los participantes; lo que el backend no puede
 * entregar (frecuencia respiratoria) se muestra como «—».
 */
export default function ResultadosGeneralesView({ participants = [] }) {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    if (!participants.length) {
      setLoading(false);
      setMeasurements([]);
      return () => { alive = false; };
    }

    Promise.allSettled(
      participants.map((p) => vitalSignsService.getByParticipant(p.id)),
    ).then((results) => {
      if (!alive) return;
      const rows = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value.raw ?? []);
      setMeasurements(rows);
    }).finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [participants]);

  const stats = useMemo(() => {
    const num = (v) => (v === null || v === undefined ? null : Number(v));
    const withReports = new Set(measurements.map((m) => m.sessionParticipantId)).size;
    const total = participants.length;

    return {
      total,
      withReports,
      pct: total > 0 ? Math.round((withReports / total) * 100) : null,
      hr:   average(measurements.map((m) => num(m.heartRate))),
      temp: average(measurements.map((m) => num(m.temperatureC)), 1),
      spo2: average(measurements.map((m) => num(m.spo2))),
    };
  }, [measurements, participants.length]);

  const show = (v, suffix = '') => (v === null || v === undefined ? '—' : `${v}${suffix}`);
  const ratio = (v, max) => (v === null ? 0 : Math.min(1, Math.max(0, v / max)));

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#C94E1B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Métricas promedio de todos los bomberos en esta Capacitación
      </Text>

      <View style={styles.topCardsRow}>
        <TopCard title="Bomberos"     value={show(stats.total)}      icon="people-outline"     color="#C94E1B" tag="Total" />
        <TopCard title="Reportes"     value={show(stats.withReports)} icon="pulse-outline"     color="#0E7C74" tag="Completados" />
        <TopCard title="% Completado" value={show(stats.pct)}         icon="trending-up-outline" color="#1565C0" tag="Progreso" />
        <TopCard title="bpm"          value={show(stats.hr)}          icon="heart-outline"     color="#7B3FBF" tag="Promedio" />
      </View>

      <Text style={styles.sectionTitle}>Promedios de Signos Vitales</Text>

      <View style={styles.metricsGrid}>
        <MetricAverageCard
          title="Frecuencia Cardíaca Promedio"
          value={show(stats.hr)} unit="bpm"
          icon="heart-outline" color="#C94E1B"
          progress={ratio(stats.hr, 200)}
        />
        <MetricAverageCard
          title="Temperatura Promedio"
          value={show(stats.temp)} unit="°C"
          icon="thermometer-outline" color="#B3261E"
          progress={ratio(stats.temp, 45)}
        />
        <MetricAverageCard
          title="Nivel de Oxígeno Promedio"
          value={show(stats.spo2)} unit="%"
          icon="water-outline" color="#0E7C74"
          progress={ratio(stats.spo2, 100)}
        />
        {/* El backend no almacena frecuencia respiratoria: se declara explícitamente
            en lugar de mostrar un promedio inventado. */}
        <MetricAverageCard
          title="Frecuencia Respiratoria Promedio"
          value="—" unit="rpm"
          icon="leaf-outline" color="#667085"
          progress={0}
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
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
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
