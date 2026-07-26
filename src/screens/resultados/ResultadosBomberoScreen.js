import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BodyDiagram2D from './components/BodyDiagram2D';
import { vitalSignsService } from '../../services/vitalSignsService';
import { useAuditOnMount } from '../../hooks/useAuditTrail';
import useTheme from '../../hooks/useTheme';
import Toast from '../../components/Toast';
import { a11yButton, a11yDecorative } from '../../constants/a11y';

const BODY_PANEL_WIDTH = 380;
const BODY_IMAGE_HEIGHT = 630;

// Estado inicial "sin datos". `hasValue: false` es lo que evita que el diagrama
// corporal pinte los cinco puntos en alerta roja cuando aún no hay mediciones.
const EMPTY_METRICS = {
  frecuenciaCardiaca:     { value: null, hasValue: false, supported: true,  icon: 'heart-outline',       unit: 'bpm', progress: 0 },
  nivelOxigeno:           { value: null, hasValue: false, supported: true,  icon: 'water-outline',       unit: '%',   progress: 0 },
  temperatura:            { value: null, hasValue: false, supported: true,  icon: 'thermometer-outline', unit: '°C',  progress: 0 },
  frecuenciaRespiratoria: { value: null, hasValue: false, supported: false, icon: 'leaf-outline',        unit: 'rpm', progress: 0 },
  nivelCO:                { value: null, hasValue: false, supported: false, icon: 'cloud-outline',       unit: 'ppm', progress: 0 },
};

export default function ResultadosBomberoScreen({ route, navigation }) {
  const { bomberoId, bomberoName } = route.params || {};
  const nameToDisplay = bomberoName ?? 'Bombero';
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Requisito de auditoría: se están consultando datos médicos de un bombero.
  useAuditOnMount('MEDICAL_RECORD', bomberoId, 'READ');

  const [metrics,      setMetrics]      = useState(EMPTY_METRICS);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);

  useEffect(() => {
    if (!bomberoId) { setLoading(false); return undefined; }
    let alive = true;

    vitalSignsService.getByParticipant(bomberoId)
      .then(({ metrics: m }) => { if (alive && m) setMetrics(m); })
      .catch(() => {
        if (alive) setLoadError('No se pudieron cargar las mediciones de este bombero.');
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [bomberoId]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>Resultados de {nameToDisplay}</Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          {...a11yButton('Volver')}
        >
          <Ionicons name="arrow-back" size={16} color={theme.textPrimary} {...a11yDecorative} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {!!loadError && (
        <View style={styles.noticeWrap}>
          <Toast message={loadError} tone="error" />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <Pressable style={styles.body} onPress={() => setActiveMetric(null)}>
          <View style={styles.contentRow}>
            <View style={styles.humanBodyContainer}>
              <Text style={styles.columnTitle}> </Text>
              <BodyDiagram2D
                metrics={metrics}
                activeMetric={activeMetric}
                onSelectMetric={(key) => setActiveMetric(prev => prev === key ? null : key)}
              />
            </View>
            <View style={styles.metricsContainer}>
              <Text style={styles.columnTitle}>Métricas Detalladas</Text>
              <View style={styles.metricsGrid}>
                <MetricCard metric={metrics.frecuenciaCardiaca}     title="Frecuencia Cardíaca"       active={activeMetric === 'frecuenciaCardiaca'} styles={styles} theme={theme} />
                <MetricCard metric={metrics.nivelOxigeno}           title="Nivel de Oxígeno SpO₂"     active={activeMetric === 'nivelOxigeno'} styles={styles} theme={theme} />
                <MetricCard metric={metrics.frecuenciaRespiratoria} title="Frecuencia Respiratoria"   active={activeMetric === 'frecuenciaRespiratoria'} styles={styles} theme={theme} />
                <MetricCard metric={metrics.nivelCO}                title="Nivel de CO"               active={activeMetric === 'nivelCO'} styles={styles} theme={theme} />
                <MetricCard metric={metrics.temperatura}            title="Temperatura Corporal"      active={activeMetric === 'temperatura'} styles={styles} theme={theme} />
              </View>
            </View>
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

/**
 * Tarjeta de métrica.
 *
 * Lee el contrato actual de `vitalSignsService.toMetrics`: `hasValue` indica si hay
 * medición y `supported` si el backend puede entregar ese dato. Distinguirlos evita
 * el bug anterior, en el que una métrica sin datos se pintaba como alerta crítica.
 */
function MetricCard({ metric, title, active, styles, theme }) {
  const unavailable = metric.supported === false;
  const noData      = !metric.hasValue;

  const tone = unavailable || noData ? theme.status.neutral : theme.status.success;
  const statusLabel = unavailable ? 'Sin soporte' : noData ? 'Sin datos' : 'Normal';

  return (
    <View style={[styles.metricCard, active && { borderColor: tone.solid }]}>
      <View style={styles.metricMainRow}>
        <View style={[styles.metricIconBox, { backgroundColor: tone.bg }]} {...a11yDecorative}>
          <Ionicons name={metric.icon} size={20} color={tone.fg} />
        </View>

        <View style={styles.metricTextBlock}>
          <Text style={styles.metricTitle} numberOfLines={2}>{title}</Text>
          <View style={[styles.metricStatusBadge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.metricStatus, { color: tone.fg }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.metricValueBlock}>
          <Text style={styles.metricValue}>{metric.hasValue ? metric.value : '—'}</Text>
          <Text style={styles.metricUnit}>{metric.unit}</Text>
        </View>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(100, Math.max(0, (metric.progress ?? 0) * 100))}%`,
              backgroundColor: tone.solid,
            },
          ]}
        />
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: t.background },
  noticeWrap: { paddingHorizontal: 20, paddingBottom: 8 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
    elevation: 2,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: t.shadowOpacity,
    shadowRadius: 3,
  },
  headerLeft: { gap: 4 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: t.textPrimary },
  sessionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionTitle: { fontSize: 13, fontWeight: '600', color: t.textPrimary },
  sessionDot: { fontSize: 13, color: t.textFaint },
  sessionDate: { fontSize: 12, color: t.textMuted },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: t.card,
  },
  backButtonText: { fontSize: 13, fontWeight: '600', color: t.textPrimary },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    color: t.textPrimary,
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
    backgroundColor: t.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    shadowColor: t.shadowColor,
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
    color: t.textPrimary,
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
    color: t.textPrimary,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: t.textMuted,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: t.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
