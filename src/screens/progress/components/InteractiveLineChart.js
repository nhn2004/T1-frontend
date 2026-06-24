import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import useTheme from '../../../hooks/useTheme';

const CHART_HEIGHT = 220;
const TOP_PAD = 16;
const BOTTOM_PAD = 28;
const MIN_POINT_SPACING = 64;
const GRID_LINES = 4;
const DOT_RADIUS = 5;
// El primer punto arranca a 32px (no 12) para que no quede pegado a las
// etiquetas del eje Y, que también viven en el borde izquierdo.
const LEFT_INSET = 32;
const RIGHT_INSET = 16;

// Gráfico de línea multi-serie construido solo con Views (sin librería de
// gráficos ni react-native-svg, que no están instalados): por eso funciona
// igual en web, tablet y móvil. Cada punto es táctil (muestra un tooltip) y
// la leyenda permite ocultar/mostrar series — si no caben todos los puntos
// en el ancho disponible, el área entera scrollea horizontalmente en vez de
// aplastar los puntos hasta volverlos ilegibles.
export default function InteractiveLineChart({ series, points, emptyLabel }) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(() => new Set());
  const [selected, setSelected] = useState(null); // { pointIndex, seriesKey }
  const [boxWidth, setBoxWidth] = useState(0);

  const visibleSeries = series.filter((s) => !hidden.has(s.key));

  const toggleSeries = useCallback((key) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setSelected(null);
  }, []);

  const { min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    points.forEach((p) => {
      visibleSeries.forEach((s) => {
        const v = p.values[s.key];
        if (typeof v === 'number') {
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      });
    });
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1 };
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.15;
    return { min: lo - pad, max: hi + pad };
  }, [points, visibleSeries]);

  if (!points.length) {
    return (
      <View style={[styles.emptyBox, { backgroundColor: theme.pill }]}>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>{emptyLabel}</Text>
      </View>
    );
  }

  const innerWidth = Math.max(boxWidth, MIN_POINT_SPACING * (points.length - 1) + LEFT_INSET + RIGHT_INSET);
  const usableWidth = innerWidth - LEFT_INSET - RIGHT_INSET;
  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : 0;
  const plotHeight = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;

  const valueToY = (v) => {
    const ratio = (v - min) / (max - min);
    return TOP_PAD + (1 - ratio) * plotHeight;
  };

  return (
    <View>
      {/* Leyenda — tocar oculta/muestra la serie */}
      <View style={styles.legendRow}>
        {series.map((s) => {
          const isHidden = hidden.has(s.key);
          return (
            <TouchableOpacity
              key={s.key}
              style={styles.legendItem}
              onPress={() => toggleSeries(s.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: !isHidden }}
            >
              <View style={[styles.legendDot, { backgroundColor: isHidden ? theme.textMuted : s.color }]} />
              <Text style={[styles.legendText, { color: isHidden ? theme.textMuted : theme.textSecondary }, isHidden && styles.legendTextHidden]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}
      >
        <View style={{ width: innerWidth, height: CHART_HEIGHT }}>
          {/* Líneas de cuadrícula horizontales con su valor */}
          {Array.from({ length: GRID_LINES + 1 }).map((_, i) => {
            const ratio = i / GRID_LINES;
            const value = max - ratio * (max - min);
            const y = TOP_PAD + ratio * plotHeight;
            return (
              <View key={i} style={[styles.gridLine, { top: y, width: innerWidth, backgroundColor: theme.divider }]}>
                <Text style={[styles.gridLabel, { color: theme.textMuted, backgroundColor: theme.card }]}>
                  {Math.round(value)}
                </Text>
              </View>
            );
          })}

          {/* Series: líneas + puntos táctiles */}
          {visibleSeries.map((s) => {
            const coords = points.map((p, i) => ({
              x: LEFT_INSET + i * stepX,
              y: valueToY(p.values[s.key]),
              alert: Boolean(p.alert?.[s.key]),
            }));

            return (
              <View key={s.key} style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {coords.slice(0, -1).map((c, i) => {
                  const next = coords[i + 1];
                  const dx = next.x - c.x;
                  const dy = next.y - c.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx);
                  return (
                    <View
                      key={i}
                      style={{
                        position: 'absolute',
                        left: c.x,
                        top: c.y - 1,
                        width: length,
                        height: 2,
                        backgroundColor: s.color,
                        opacity: 0.85,
                        transform: [{ rotate: `${angle}rad` }],
                        transformOrigin: '0% 50%',
                      }}
                    />
                  );
                })}

                {coords.map((c, i) => {
                  const isSelected = selected?.pointIndex === i && selected?.seriesKey === s.key;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={{
                        position: 'absolute',
                        left: c.x - DOT_RADIUS - 6,
                        top: c.y - DOT_RADIUS - 6,
                        width: (DOT_RADIUS + 6) * 2,
                        height: (DOT_RADIUS + 6) * 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => setSelected(isSelected ? null : { pointIndex: i, seriesKey: s.key })}
                      accessibilityRole="button"
                      accessibilityLabel={`${s.label}: ${points[i].values[s.key]}${s.unit} — ${points[i].xLabel}`}
                    >
                      <View
                        style={[
                          styles.dot,
                          {
                            width: DOT_RADIUS * 2, height: DOT_RADIUS * 2, borderRadius: DOT_RADIUS,
                            backgroundColor: c.alert ? theme.badge.danger.text : s.color,
                            borderColor: theme.card,
                          },
                          isSelected && { width: (DOT_RADIUS + 2) * 2, height: (DOT_RADIUS + 2) * 2, borderRadius: DOT_RADIUS + 2 },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}

          {/* Etiquetas del eje X — se saltan si no caben todas */}
          <View style={[styles.xLabelsRow, { width: innerWidth }]}>
            {points.map((p, i) => {
              const skip = stepX < 46 && i % 2 === 1 && i !== points.length - 1;
              return (
                <View key={p.id ?? i} style={{ position: 'absolute', left: LEFT_INSET + i * stepX - 24, width: 48, alignItems: 'center' }}>
                  {!skip && (
                    <Text style={[styles.xLabel, { color: theme.textMuted }]} numberOfLines={1}>{p.xLabel}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Tooltip flotante del punto seleccionado */}
          {selected && (() => {
            const point = points[selected.pointIndex];
            const x = LEFT_INSET + selected.pointIndex * stepX;
            const tooltipLeft = Math.min(Math.max(x - 70, 0), innerWidth - 150);
            // Fondo oscuro fijo (no theme.textPrimary): el texto del tooltip es blanco
            // fijo, y en modo oscuro theme.textPrimary es casi blanco — esa combinación
            // dejaba el texto invisible sobre fondo claro.
            return (
              <View style={[styles.tooltip, { left: tooltipLeft, backgroundColor: '#1A1A1A' }]}>
                <Text style={styles.tooltipTitle} numberOfLines={1}>{point.title}</Text>
                <Text style={styles.tooltipDate}>{point.date}</Text>
                {visibleSeries.map((s) => (
                  <Text key={s.key} style={styles.tooltipValue}>
                    <Text style={{ color: s.color }}>● </Text>
                    {s.label}: {point.values[s.key]}{s.unit}
                  </Text>
                ))}
              </View>
            );
          })()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    height: 160,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendTextHidden: {
    textDecorationLine: 'line-through',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    left: 0,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    marginTop: -8,
  },
  dot: {
    borderWidth: 2,
  },
  xLabelsRow: {
    position: 'absolute',
    bottom: 0,
    height: BOTTOM_PAD,
  },
  xLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tooltip: {
    position: 'absolute',
    top: 4,
    width: 150,
    borderRadius: 10,
    padding: 10,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tooltipDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginBottom: 4,
  },
  tooltipValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
