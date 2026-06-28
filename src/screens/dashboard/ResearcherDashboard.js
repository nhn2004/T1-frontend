import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../hooks';
import { sessionService } from '../../services';
import { traineeService } from '../../services/traineeService';

const HERO_IMAGE = require('../../assets/fondocarro.jpg');
const BODY_IMAGE = require('../../assets/anatomy/full-body.png');

const DATASETS = [
  { id: 'DS-A42-2023', format: 'CSV', size: '2.4MB', date: '14 Oct 2023' },
  { id: 'DS-B09-2024', format: 'JSON', size: '812KB', date: '02 Ene 2024' },
  { id: 'DS-C15-AGG', format: 'XLSX', size: '5.1MB', date: '18 Mar 2024' },
];

const REPORT_TYPES = ['Estadistico', 'Comparativo', 'Tendencias'];
const GROUPS = ['Todos los Batallones', 'Quito Centro', 'Guayaquil Norte'];

function formatNumber(value, fallback, prefix = '') {
  return value === null || value === undefined ? `${prefix}${fallback}` : `${prefix}${value}`;
}

export default function ResearcherDashboard() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 920;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [traineeCount, setTraineeCount] = useState(null);
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [group, setGroup] = useState(GROUPS[0]);
  const [selectedTypes, setSelectedTypes] = useState({
    medica: true,
    fisica: false,
    psicologica: false,
    tecnica: false,
  });

  useEffect(() => {
    if (user?.isPreview) {
      setLoading(false);
      return;
    }

    Promise.allSettled([
      sessionService.getAll(),
      traineeService.getAll(),
    ]).then(([sessR, trainR]) => {
      if (sessR.status === 'fulfilled') setSessions(sessR.value);
      if (trainR.status === 'fulfilled') setTraineeCount(trainR.value.length);
    }).finally(() => setLoading(false));
  }, [user?.isPreview]);

  const completedSessions = useMemo(
    () => sessions.filter(s => s.status === 'COMPLETED').length,
    [sessions]
  );

  const stats = [
    {
      id: 'datasets',
      label: 'DATASETS\nDISPONIBLES',
      value: '82',
      icon: 'server-outline',
      color: '#E85D27',
      bg: '#FFE5DD',
    },
    {
      id: 'sample',
      label: 'ASPIRANTES EN\nMUESTRA',
      value: formatNumber(traineeCount, 1240, 'n='),
      icon: 'people-outline',
      color: '#00A7D8',
      bg: '#DDF5FF',
    },
    {
      id: 'sessions',
      label: 'SESIONES\nANALIZADAS',
      value: sessions.length ? String(completedSessions || sessions.length) : '456',
      icon: 'analytics-outline',
      color: '#6B86B8',
      bg: '#EAF1FF',
    },
    {
      id: 'export',
      label: 'ULTIMA EXPORTACION',
      value: 'Hace 2h',
      icon: 'download-outline',
      color: '#E85D27',
      bg: '#FFE5DD',
    },
  ];

  function cycleReportType() {
    const nextIndex = (REPORT_TYPES.indexOf(reportType) + 1) % REPORT_TYPES.length;
    setReportType(REPORT_TYPES[nextIndex]);
  }

  function cycleGroup() {
    const nextIndex = (GROUPS.indexOf(group) + 1) % GROUPS.length;
    setGroup(GROUPS[nextIndex]);
  }

  function toggleType(key) {
    setSelectedTypes(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function generateReport() {
    Alert.alert('Generar reporte', `Reporte ${reportType.toLowerCase()} preparado con datos anonimizados.`);
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroScanlines} />
          <Image source={BODY_IMAGE} style={styles.bodyImage} resizeMode="contain" />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>BIENVENIDO, INVESTIGADOR</Text>
            <Text style={styles.heroSubtitle}>Acceso a Datos Anonimizados | Sistema de Monitoreo de Aptitud Bomberil</Text>
          </View>
        </ImageBackground>

        <View style={styles.privacyBanner}>
          <Ionicons name="information-circle-outline" size={19} color="#27759E" />
          <Text style={styles.privacyText}>
            Datos anonimizados - No se incluye informacion personal identificable conforme a protocolos de privacidad de datos sensibles.
          </Text>
        </View>

        <View style={styles.statsRow}>
          {stats.map(stat => (
            <View key={stat.id} style={[styles.statCard, { borderLeftColor: stat.color }]}>
              <View style={styles.statTextBox}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{loading && stat.id !== 'datasets' && stat.id !== 'export' ? '-' : stat.value}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.mainGrid, isCompact && styles.mainGridCompact]}>
          <View style={styles.reportPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Generador de Reportes</Text>
              <Ionicons name="stats-chart-outline" size={18} color="#9A6B4E" />
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>TIPO DE REPORTE</Text>
                <TouchableOpacity style={styles.selectBox} onPress={cycleReportType} activeOpacity={0.8}>
                  <Text style={styles.selectText}>{reportType}</Text>
                  <Ionicons name="chevron-down" size={15} color="#8B96A5" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>RANGO DE FECHAS</Text>
                <TouchableOpacity style={styles.selectBox} activeOpacity={0.8}>
                  <Text style={styles.placeholderText}>mm/dd/yyyy</Text>
                  <Ionicons name="calendar-outline" size={15} color="#5C6470" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>TIPO DE EVALUACION</Text>
                <View style={styles.checkboxGrid}>
                  {[
                    { key: 'medica', label: 'MEDICA' },
                    { key: 'fisica', label: 'FISICA' },
                    { key: 'psicologica', label: 'PSICOLOGICA' },
                    { key: 'tecnica', label: 'TECNICA' },
                  ].map(item => {
                    const selected = selectedTypes[item.key];
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={styles.checkboxItem}
                        onPress={() => toggleType(item.key)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                          {selected && <Ionicons name="checkmark" size={11} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>GRUPO / BATALLON</Text>
                <TouchableOpacity style={styles.selectBox} onPress={cycleGroup} activeOpacity={0.8}>
                  <Text style={styles.selectText}>{group}</Text>
                  <Ionicons name="chevron-down" size={15} color="#8B96A5" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.generateButton} onPress={generateReport} activeOpacity={0.85}>
              <Ionicons name="sparkles-outline" size={17} color="#fff" />
              <Text style={styles.generateButtonText}>Generar Reporte</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.datasetsPanel}>
            <Text style={styles.panelTitle}>Datasets Anonimizados</Text>
            <View style={styles.datasetList}>
              {DATASETS.map(dataset => (
                <View key={dataset.id} style={styles.datasetCard}>
                  <View style={styles.datasetHeader}>
                    <Text style={styles.datasetId}>{dataset.id}</Text>
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatText}>{dataset.format}</Text>
                    </View>
                  </View>
                  <Text style={styles.datasetMeta}>Tamano: {dataset.size}</Text>
                  <Text style={styles.datasetMeta}>{dataset.date}</Text>
                  <TouchableOpacity
                    style={styles.exportButton}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Exportar dataset', `${dataset.id} listo para exportacion anonima.`)}
                  >
                    <Ionicons name="download-outline" size={13} color="#C96B3B" />
                    <Text style={styles.exportButtonText}>Exportar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F7F9' },
  content: { padding: 16, gap: 16 },

  hero: {
    minHeight: 190,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroImage: { borderRadius: 8 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 41, 49, 0.68)',
  },
  heroScanlines: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(99, 223, 231, 0.18)',
  },
  bodyImage: {
    position: 'absolute',
    right: 18,
    bottom: -18,
    width: 230,
    height: 230,
    opacity: 0.2,
  },
  heroContent: { paddingHorizontal: 32, paddingVertical: 28, gap: 8 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  heroSubtitle: { color: '#D5F6F8', fontSize: 14, fontWeight: '700' },

  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#D8EEFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFE4FF',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  privacyText: { flex: 1, color: '#2A5D79', fontSize: 12, fontWeight: '700', lineHeight: 17 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: 168,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderLeftWidth: 4,
    padding: 14,
  },
  statTextBox: { flex: 1 },
  statLabel: { color: '#7A8493', fontSize: 10, fontWeight: '900', lineHeight: 13 },
  statValue: { color: '#1A1A1A', fontSize: 26, fontWeight: '900', lineHeight: 31 },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainGrid: { flexDirection: 'row', gap: 18, alignItems: 'stretch' },
  mainGridCompact: { flexDirection: 'column' },
  reportPanel: {
    flex: 2.25,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    padding: 22,
    minHeight: 350,
  },
  datasetsPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    padding: 22,
    minHeight: 350,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  panelTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '900', lineHeight: 25 },

  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  formField: { width: '47%', minWidth: 220, gap: 8 },
  fieldLabel: { color: '#7C8797', fontSize: 10, fontWeight: '900' },
  selectBox: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#F0E2DC',
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 12,
  },
  selectText: { color: '#5B4D47', fontSize: 13, fontWeight: '700' },
  placeholderText: { color: '#8C7D76', fontSize: 13, fontWeight: '700' },

  checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  checkboxItem: {
    width: '47%',
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFF4F0',
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#D9C7BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#C95623',
    borderColor: '#C95623',
  },
  checkboxLabel: { color: '#5C514B', fontSize: 10, fontWeight: '900' },
  generateButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F25A26',
    borderRadius: 7,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 28,
  },
  generateButtonText: { color: '#fff', fontSize: 13, fontWeight: '900' },

  datasetList: { gap: 14, marginTop: 14 },
  datasetCard: {
    backgroundColor: '#FFF8F5',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#F2DFD6',
    padding: 14,
    gap: 6,
  },
  datasetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  datasetId: { color: '#34313A', fontSize: 14, fontWeight: '900' },
  formatBadge: { backgroundColor: '#FFE6DD', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  formatText: { color: '#C95623', fontSize: 9, fontWeight: '900' },
  datasetMeta: { color: '#7C8797', fontSize: 10, fontWeight: '700' },
  exportButton: {
    marginTop: 8,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D99372',
    backgroundColor: '#FFFDFB',
  },
  exportButtonText: { color: '#C96B3B', fontSize: 11, fontWeight: '900' },
});
