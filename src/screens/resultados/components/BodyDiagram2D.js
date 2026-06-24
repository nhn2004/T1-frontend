import React, { useEffect, useRef } from 'react';
import { View, Image, Pressable, Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HIGHLIGHT = '#F15A00';
const NORMAL_COLOR = '#4CAF50';
const ALERT_COLOR = '#D32F2F';
const NORMAL_STATUSES = ['Normal', 'Seguro'];
const IMAGE_ASPECT_RATIO = 446 / 740;

const METRIC_LABELS = {
  nivelOxigeno: 'Nivel de Oxígeno SpO₂',
  frecuenciaCardiaca: 'Frecuencia Cardíaca',
  frecuenciaRespiratoria: 'Frecuencia Respiratoria',
  temperatura: 'Temperatura Corporal',
  nivelCO: 'Nivel de CO',
};

// Licensed full-body anatomical photo (see assets/anatomy/README.md) with
// tap zones positioned over the matching part of the image, as a percentage
// of the image's own width/height (measured against the actual photo) so
// the whole diagram scales responsively with its container.
//
// Only parts whose metric is out of range are interactive — a calm body has
// nothing to tap, so there's never a dead zone pretending to be clickable.
// An alert pulses red with a warning icon on its own, no tap required;
// tapping it opens the info strip below with the real value.
function PulsingRing() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />;
}

function Hotspot({ style, alert, selected, onPress }) {
  return (
    <Pressable
      style={[styles.hotspot, style, selected && styles.hotspotSelected]}
      onPress={onPress}
    >
      <View style={styles.markerWrapper}>
        {alert && <PulsingRing />}
        <View style={[styles.marker, alert ? styles.markerAlert : styles.markerNormal]}>
          <Ionicons
            name={alert ? 'warning' : 'checkmark'}
            size={10}
            color="#fff"
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function BodyDiagram2D({ metrics = {}, activeMetric, onSelectMetric }) {
  const isAlert = (key) => {
    const status = metrics[key]?.status;
    return Boolean(status) && !NORMAL_STATUSES.includes(status);
  };
  const isSelected = (key) => key === activeMetric;

  const parts = [
    { key: 'nivelOxigeno', style: styles.headHotspot },
    { key: 'frecuenciaRespiratoria', style: styles.respiratoriaHotspot },
    { key: 'frecuenciaCardiaca', style: styles.heartHotspot },
    { key: 'temperatura', style: styles.torsoHotspot },
    { key: 'nivelCO', style: styles.handHotspot },
  ];

  const selectedData = activeMetric ? metrics[activeMetric] : null;
  const selectedAlert = activeMetric ? isAlert(activeMetric) : false;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/anatomy/full-body.png')}
          style={styles.bodyImage}
          resizeMode="contain"
        />

        {parts.map(({ key, style }, index) => (
          <Hotspot
            key={`${key}-${index}`}
            style={style}
            alert={isAlert(key)}
            selected={isSelected(key)}
            onPress={() => onSelectMetric(key)}
          />
        ))}
      </View>

      {selectedData && (
        <View style={[styles.infoStrip, selectedAlert && styles.infoStripAlert]}>
          <Ionicons
            name={selectedAlert ? 'warning' : 'checkmark-circle'}
            size={16}
            color={selectedAlert ? ALERT_COLOR : NORMAL_COLOR}
          />
          <Text style={styles.infoLabel}>{METRIC_LABELS[activeMetric]}</Text>
          <Text style={[styles.infoValue, selectedAlert && styles.infoValueAlert]}>
            {selectedData.value}{selectedData.unit} · {selectedData.status}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 260,
  },
  container: {
    width: '100%',
    aspectRatio: IMAGE_ASPECT_RATIO,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  bodyImage: {
    width: '100%',
    height: '100%',
  },
  hotspot: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotSelected: {
    backgroundColor: 'rgba(241, 90, 0, 0.2)',
    borderColor: HIGHLIGHT,
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ALERT_COLOR,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerNormal: {
    backgroundColor: NORMAL_COLOR,
  },
  markerAlert: {
    backgroundColor: ALERT_COLOR,
  },
  infoStrip: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F8F2',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoStripAlert: {
    backgroundColor: '#FDECEA',
  },
  infoLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#2C323A',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: NORMAL_COLOR,
  },
  infoValueAlert: {
    color: ALERT_COLOR,
  },
  // All positions are % of the image's own box, measured against the actual
  // photo — see src/assets/anatomy/full-body.png.
  headHotspot: {
    left: '42%', top: '1%', width: '18%', height: '14%',
  },
  // Trachea/upper sternum — single marker for Frecuencia Respiratoria
  // (both lungs breathe together, so one mark represents the pair).
  respiratoriaHotspot: {
    left: '44%', top: '13%', width: '14%', height: '7%',
  },
  // Right pectoral, where the heart sits behind the sternum.
  heartHotspot: {
    left: '50%', top: '21%', width: '11%', height: '9%',
  },
  torsoHotspot: {
    left: '40%', top: '29%', width: '18%', height: '11%', borderRadius: 16,
  },
  handHotspot: {
    left: '4%', top: '37%', width: '14%', height: '9%',
  },
});
