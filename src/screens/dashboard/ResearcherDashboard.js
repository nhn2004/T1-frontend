import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { a11yButton, a11yDecorative, a11yGroup, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import Toast from '../../components/Toast';
import { reportsService, sessionService } from '../../services';
import { traineeService } from '../../services/traineeService';

const HERO_IMAGE = require('../../assets/fondocarro.jpg');
const BODY_IMAGE = require('../../assets/anatomy/full-body.png');

const REPORT_TYPES = ['Estadístico', 'Comparativo', 'Tendencias'];
const GROUPS = ['Todos los Batallones', 'Quito Centro', 'Guayaquil Norte'];

const EVALUATION_TYPES = [
  { key: 'medica',      label: 'MÉDICA' },
  { key: 'fisica',      label: 'FÍSICA' },
  { key: 'psicologica', label: 'PSICOLÓGICA' },
  { key: 'tecnica',     label: 'TÉCNICA' },
];

export default function ResearcherDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 920;
  const styles = useMemo(() => makeStyles(theme, isCompact), [theme, isCompact]);

  const [loading,       setLoading]       = useState(true);
  const [sessions,      setSessions]      = useState([]);
  const [traineeCount,  setTraineeCount]  = useState(null);
  const [reportType,    setReportType]    = useState(REPORT_TYPES[0]);
  const [group,         setGroup]         = useState(GROUPS[0]);
  const [toast,         setToast]         = useState(null);
  const [selectedTypes, setSelectedTypes] = useState({
    medica: true, fisica: false, psicologica: false, tecnica: false,
  });

  const [generating,   setGenerating]   = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [exporting,    setExporting]    = useState(false);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      sessionService.getAll(),
      traineeService.getAll(),
    ]).then(([sessR, trainR]) => {
      if (!alive) return;
      if (sessR.status  === 'fulfilled') setSessions(sessR.value);
      if (trainR.status === 'fulfilled') setTraineeCount(trainR.value.length);
    }).finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'COMPLETED').length,
    [sessions],
  );

  // Solo métricas que provienen de datos reales. Las cifras que antes se mostraban
  // (82 datasets, n=1240, 456 sesiones, "Hace 2h") eran constantes inventadas que el
  // investigador no podía distinguir de datos verdaderos.
  const stats = useMemo(() => {
    const fmt = (v, prefix = '') => (loading || v === null ? '—' : `${prefix}${v}`);
    return [
      {
        id: 'sample', label: 'ASPIRANTES EN\nMUESTRA',
        value: fmt(traineeCount, 'n='), icon: 'people-outline', tone: 'info',
      },
      {
        id: 'sessions', label: 'SESIONES\nANALIZADAS',
        value: fmt(completedSessions), icon: 'analytics-outline', tone: 'neutral',
      },
      {
        id: 'total', label: 'SESIONES\nREGISTRADAS',
        value: fmt(sessions.length), icon: 'server-outline', tone: 'primary',
      },
    ];
  }, [loading, traineeCount, completedSessions, sessions.length]);

  const toggleType = useCallback((key) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleGenerateReport = useCallback(async () => {
    setGenerating(true);
    try {
      const summary = await reportsService.getSummary();
      setReportResult(summary);
    } catch (e) {
      setToast({ message: e?.response?.data?.message ?? 'No se pudo generar el reporte.', tone: 'error' });
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleExportDataset = useCallback(async () => {
    setExporting(true);
    try {
      const rows = await reportsService.getAnonymizedExport();
      if (rows.length === 0) {
        setToast({ message: 'No hay mediciones para exportar todavía.', tone: 'warning' });
        return;
      }

      if (Platform.OS === 'web') {
        // Descarga directa vía Blob/URL — solo existen en el navegador; en nativo
        // se usa expo-file-system + expo-sharing (rama de abajo).
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export-anonimizado-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setToast({ message: `${rows.length} registros exportados.`, tone: 'success' });
      } else {
        // En nativo no hay una carpeta de "Descargas" accesible sin permisos extra:
        // se escribe el JSON al sandbox de la app y se abre la hoja de compartir para
        // que el usuario lo guarde o lo envíe a donde necesite.
        const fileUri = `${FileSystem.documentDirectory}export-anonimizado-${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(rows, null, 2), {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Exportar dataset anonimizado',
          });
        }
        setToast({ message: `${rows.length} registros exportados.`, tone: 'success' });
      }
    } catch (e) {
      setToast({ message: e?.response?.data?.message ?? 'No se pudo exportar el dataset.', tone: 'error' });
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ImageBackground
          source={HERO_IMAGE}
          style={styles.hero}
          imageStyle={styles.heroImage}
          accessible={false}
        >
          <View style={styles.heroOverlay} {...a11yDecorative} />
          <Image source={BODY_IMAGE} style={styles.bodyImage} resizeMode="contain" accessible={false} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} accessibilityRole="header">
              BIENVENIDO, {(user?.name ?? 'INVESTIGADOR').toUpperCase()}
            </Text>
            <Text style={styles.heroSubtitle}>
              Acceso a Datos Anonimizados · Sistema de Monitoreo de Aptitud Bomberil
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.privacyBanner} accessibilityRole="text">
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={theme.status.info.fg}
            {...a11yDecorative}
          />
          <Text style={styles.privacyText}>
            Datos anonimizados — No se incluye información personal identificable conforme
            a los protocolos de privacidad de datos sensibles.
          </Text>
        </View>

        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        <View style={styles.statsRow}>
          {stats.map((stat) => {
            const tone = stat.tone === 'primary'
              ? { bg: theme.primarySoft, fg: theme.primaryText, solid: theme.primarySolid }
              : theme.status[stat.tone];

            return (
              <View
                key={stat.id}
                style={[styles.statCard, { borderLeftColor: tone.solid }]}
                {...a11yGroup(`${stat.label.replace('\n', ' ')}: ${stat.value}`)}
              >
                <View style={styles.statTextBox}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
                <View style={[styles.statIcon, { backgroundColor: tone.bg }]} {...a11yDecorative}>
                  <Ionicons name={stat.icon} size={20} color={tone.fg} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.mainGrid}>
          {/* ── Generador de reportes ── */}
          <View style={styles.reportPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle} accessibilityRole="header">
                Generador de Reportes
              </Text>
              <Ionicons
                name="stats-chart-outline"
                size={18}
                color={theme.icon}
                {...a11yDecorative}
              />
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>TIPO DE REPORTE</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setReportType((c) => REPORT_TYPES[(REPORT_TYPES.indexOf(c) + 1) % REPORT_TYPES.length])}
                  activeOpacity={0.8}
                  {...a11yButton(`Tipo de reporte: ${reportType}`, { hint: 'Cambia al siguiente tipo' })}
                >
                  <Text style={styles.selectText}>{reportType}</Text>
                  <Ionicons name="chevron-down" size={15} color={theme.icon} {...a11yDecorative} />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>TIPO DE EVALUACIÓN</Text>
                <View style={styles.checkboxGrid}>
                  {EVALUATION_TYPES.map((item) => {
                    const selected = selectedTypes[item.key];
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={styles.checkboxItem}
                        onPress={() => toggleType(item.key)}
                        activeOpacity={0.8}
                        accessible
                        accessibilityRole="checkbox"
                        accessibilityLabel={item.label}
                        accessibilityState={{ checked: selected }}
                      >
                        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                          {selected && (
                            <Ionicons
                              name="checkmark"
                              size={12}
                              color={theme.onPrimarySolid}
                              {...a11yDecorative}
                            />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>GRUPO / BATALLÓN</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setGroup((c) => GROUPS[(GROUPS.indexOf(c) + 1) % GROUPS.length])}
                  activeOpacity={0.8}
                  {...a11yButton(`Grupo: ${group}`, { hint: 'Cambia al siguiente grupo' })}
                >
                  <Text style={styles.selectText}>{group}</Text>
                  <Ionicons name="chevron-down" size={15} color={theme.icon} {...a11yDecorative} />
                </TouchableOpacity>
              </View>
            </View>

            {/* El servidor todavía calcula el resumen sobre TODOS los datos: tipo de
                reporte/grupo/tipo de evaluación son selectores listos para cuando el
                backend soporte filtrar por ellos, pero hoy no acotan el resultado. */}
            <Text style={styles.filterDisclosure}>
              El resumen generado cubre todos los datos disponibles; los filtros de
              arriba aún no acotan el resultado en el servidor.
            </Text>

            <TouchableOpacity
              style={[styles.generateButton, generating && styles.generateButtonDisabled]}
              onPress={handleGenerateReport}
              activeOpacity={0.85}
              disabled={generating}
              {...a11yButton('Generar reporte', { disabled: generating, busy: generating })}
            >
              {generating
                ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                : <Ionicons name="sparkles-outline" size={17} color={theme.onPrimarySolid} {...a11yDecorative} />}
              <Text style={styles.generateButtonText}>
                {generating ? 'Generando…' : 'Generar Reporte'}
              </Text>
            </TouchableOpacity>

            {!!reportResult && (
              <View style={styles.reportResultBox} {...a11yGroup('Resumen generado')}>
                <Text style={styles.reportResultTitle}>Resumen generado</Text>
                <Text style={styles.reportResultLine}>
                  Sesiones registradas: {reportResult.totalSessions} · Participantes: {reportResult.totalParticipants}
                </Text>
                <Text style={styles.reportResultLine}>
                  Bomberos en muestra: {reportResult.totalTrainees} · Mediciones de vitales: {reportResult.totalVitalSignsMeasurements}
                </Text>
                {reportResult.avgHeartRate != null && (
                  <Text style={styles.reportResultLine}>FC promedio: {reportResult.avgHeartRate} bpm</Text>
                )}
                {reportResult.avgSpo2 != null && (
                  <Text style={styles.reportResultLine}>SpO₂ promedio: {reportResult.avgSpo2}%</Text>
                )}
                {reportResult.avgTemperatureC != null && (
                  <Text style={styles.reportResultLine}>Temperatura promedio: {reportResult.avgTemperatureC}°C</Text>
                )}
                <Text style={styles.reportResultHint}>
                  Generado el {new Date(reportResult.generatedAt).toLocaleString('es-ES')}
                </Text>
              </View>
            )}
          </View>

          {/* ── Datasets ── */}
          <View style={styles.datasetsPanel}>
            <Text style={styles.panelTitle} accessibilityRole="header">
              Datasets Anonimizados
            </Text>

            <Text style={styles.datasetDescription}>
              Exporta todas las mediciones de signos vitales identificadas solo por
              código de aspirante — sin nombre, correo ni otro dato personal.
            </Text>

            <TouchableOpacity
              style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
              onPress={handleExportDataset}
              activeOpacity={0.85}
              disabled={exporting}
              {...a11yButton('Exportar dataset anonimizado', { disabled: exporting, busy: exporting })}
            >
              {exporting
                ? <ActivityIndicator size="small" color={theme.primaryText} />
                : <Ionicons name="download-outline" size={17} color={theme.primaryText} {...a11yDecorative} />}
              <Text style={styles.exportButtonText}>
                {exporting ? 'Exportando…' : 'Exportar Signos Vitales (JSON)'}
              </Text>
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <Text style={styles.datasetEmptyText}>
                La descarga del archivo solo está disponible en la versión web por ahora;
                en esta plataforma se muestra el conteo de registros obtenidos.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t, isCompact) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    content: { padding: 16, gap: 16 },

    hero: { minHeight: 190, borderRadius: 8, overflow: 'hidden', justifyContent: 'center' },
    heroImage: { borderRadius: 8 },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 12, 24, 0.72)' },
    bodyImage: {
      position: 'absolute', right: 24, top: 10, bottom: 10,
      width: 110, opacity: 0.22,
    },
    heroContent: { paddingHorizontal: isCompact ? 20 : 32, paddingVertical: 28, gap: 8 },
    heroTitle: { color: '#FFFFFF', fontSize: isCompact ? 22 : 30, fontWeight: '900' },
    heroSubtitle: { color: '#D5DCE5', fontSize: isCompact ? 13 : 15, fontWeight: '600' },

    privacyBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: t.status.info.bg,
      borderWidth: 1, borderColor: t.status.info.border,
      borderRadius: 8, padding: 12,
    },
    privacyText: { flex: 1, color: t.status.info.fg, fontSize: 13, lineHeight: 18 },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flex: 1, minWidth: 180,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border, borderLeftWidth: 4,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    statTextBox: { flex: 1 },
    statLabel: { color: t.textMuted, fontSize: 11, fontWeight: '900', lineHeight: 14 },
    statValue: { color: t.textPrimary, fontSize: 25, fontWeight: '900', lineHeight: 30 },
    statIcon: { width: 42, height: 42, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

    mainGrid: { flexDirection: isCompact ? 'column' : 'row', gap: 16, alignItems: 'stretch' },
    reportPanel: {
      flex: isCompact ? undefined : 1.4,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border, padding: 18, gap: 16,
    },
    datasetsPanel: {
      flex: isCompact ? undefined : 1,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border, padding: 18, gap: 12,
    },
    panelHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 12,
    },
    panelTitle: { color: t.textPrimary, fontSize: 18, fontWeight: '900' },

    formGrid: { gap: 14 },
    formField: { gap: 6 },
    fieldLabel: { color: t.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    selectBox: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      gap: 10, borderRadius: 8, borderWidth: 1, borderColor: t.border,
      backgroundColor: t.cardAlt, paddingHorizontal: 12, minHeight: MIN_TOUCH_SIZE,
    },
    selectText: { color: t.textPrimary, fontSize: 14, fontWeight: '600' },

    checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    checkboxItem: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      minWidth: '45%', minHeight: MIN_TOUCH_SIZE, paddingVertical: 4,
    },
    checkbox: {
      width: 20, height: 20, borderRadius: 5,
      borderWidth: 1.5, borderColor: t.borderStrong,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.card,
    },
    checkboxChecked: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    checkboxLabel: { color: t.textSecondary, fontSize: 12, fontWeight: '700' },

    generateButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: t.primarySolid, borderRadius: 8, minHeight: MIN_TOUCH_SIZE + 4,
    },
    generateButtonText: { color: t.onPrimarySolid, fontSize: 15, fontWeight: '800' },
    generateButtonDisabled: { opacity: 0.75 },

    filterDisclosure: { color: t.textMuted, fontSize: 11, lineHeight: 15, fontStyle: 'italic' },

    reportResultBox: {
      gap: 4, padding: 14, borderRadius: 8,
      backgroundColor: t.status.info.bg, borderWidth: 1, borderColor: t.status.info.border,
    },
    reportResultTitle: { color: t.status.info.fg, fontSize: 13, fontWeight: '900', marginBottom: 2 },
    reportResultLine: { color: t.status.info.fg, fontSize: 12.5 },
    reportResultHint: { color: t.status.info.fg, fontSize: 11, marginTop: 4, opacity: 0.85 },

    datasetDescription: { color: t.textSecondary, fontSize: 13, lineHeight: 19 },
    exportButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 8, minHeight: MIN_TOUCH_SIZE, borderWidth: 1.5, borderColor: t.primarySolid,
      backgroundColor: t.card,
    },
    exportButtonDisabled: { opacity: 0.75 },
    exportButtonText: { color: t.primaryText, fontSize: 14, fontWeight: '700' },
    datasetEmptyText: { color: t.textSecondary, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 4 },
  });
