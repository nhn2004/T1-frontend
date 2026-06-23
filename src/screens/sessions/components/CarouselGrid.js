import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SessionCard from './SessionCard';

const COLS = 3;
const ROWS = 3;

export default function CarouselGrid({ sessions, onViewDetails }) {
  const [box, setBox]   = useState({ w: 0, h: 0 });
  const fadeAnim        = useRef(new Animated.Value(1)).current;
  const perPage         = COLS * ROWS;
  const totalPages      = Math.ceil(sessions.length / perPage);
  const [page, setPage] = useState(0);

  // Reset to page 0 whenever the session list changes (filter/search change)
  const firstId = sessions[0]?.id;
  React.useEffect(() => { setPage(0); }, [firstId, sessions.length]);

  const hasPrev    = page > 0;
  const hasNext    = page < totalPages - 1;
  const needArrows = totalPages > 1;

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  }, []);

  // Gaps en % del contenedor
  const colGap    = box.w * 0.012;
  const rowGap    = box.h * 0.02;
  // Flechas pequeñas — 4% del alto
  const arrowSize = Math.max(28, box.h * 0.04);
  const arrowRoom = needArrows ? arrowSize + colGap * 2 : 0;

  // Tamaño de cada card ocupando exactamente el espacio disponible
  const cardW = box.w > 0 ? (box.w - arrowRoom - colGap * (COLS - 1)) / COLS : 0;
  const cardH = box.h > 0 ? (box.h - rowGap  * (ROWS - 1)) / ROWS         : 0;

  function animateTo(next) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setPage(next);
  }

  const pageCards = sessions.slice(page * perPage, page * perPage + perPage);
  const gridRows  = [];
  for (let r = 0; r < ROWS; r++) {
    const row = pageCards.slice(r * COLS, r * COLS + COLS);
    if (row.length > 0) gridRows.push(row);
  }

  return (
    <View style={styles.outer} onLayout={onLayout}>
      {box.w > 0 && (
        <View style={[styles.row, { gap: colGap }]}>

          {/* Flecha izquierda — solo si hace falta */}
          {needArrows && (
            <Arrow direction="left" visible={hasPrev} size={arrowSize}
              onPress={() => animateTo(page - 1)} />
          )}

          {/* Grid */}
          <Animated.View style={[styles.grid, { gap: rowGap, opacity: fadeAnim }]}>
            {gridRows.map((rowCards, ri) => (
              <View key={ri} style={[styles.gridRow, { gap: colGap, height: cardH }]}>
                {rowCards.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onViewDetails={onViewDetails}
                    cardWidth={cardW}
                    cardHeight={cardH}
                  />
                ))}
                {rowCards.length < COLS &&
                  Array.from({ length: COLS - rowCards.length }).map((_, i) => (
                    <View key={i} style={{ width: cardW }} />
                  ))}
              </View>
            ))}
          </Animated.View>

          {/* Flecha derecha */}
          {needArrows && (
            <Arrow direction="right" visible={hasNext} size={arrowSize}
              onPress={() => animateTo(page + 1)} />
          )}

        </View>
      )}
    </View>
  );
}

function Arrow({ direction, visible, size, onPress }) {
  return (
    <View style={[styles.arrowWrap, { width: size }]}>
      {visible ? (
        <TouchableOpacity
          style={[styles.arrow, { width: size, height: size, borderRadius: size / 2 }]}
          onPress={onPress} activeOpacity={0.8}
        >
          <Ionicons
            name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
            size={size * 0.5}
            color="#E85D27"
          />
        </TouchableOpacity>
      ) : (
        <View style={{ width: size }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowWrap: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E85D27',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  grid: {
    flex: 1,
    alignSelf: 'stretch',
  },
  gridRow: {
    flexDirection: 'row',
  },
});
