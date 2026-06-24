import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SessionCard from './SessionCard';

const COLS = 3;
const ROWS = 3;

export default function CarouselGrid({ sessions, onViewDetails }) {
  const [box, setBox]   = useState({ w: 0, h: 0 });
  const perPage         = COLS * ROWS;
  const totalPages      = Math.ceil(sessions.length / perPage);
  const [page, setPage] = useState(0);

  React.useEffect(() => { setPage(0); }, [sessions.length]);

  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  }, []);

  // outer has flex:1 and no padding — box.w/h already reflect the true available area
  const colGap    = box.w * 0.012;
  const rowGap    = box.h * 0.02;
  const arrowSize = Math.max(28, box.h * 0.04);
  const gridW     = box.w > 0 ? box.w - 2 * (arrowSize + colGap) : 0;
  const cardW     = gridW > 0 ? (gridW - colGap * (COLS - 1)) / COLS : 0;
  const cardH     = box.h > 0 ? (box.h - rowGap * (ROWS - 1)) / ROWS : 0;

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

          {/* Flecha izquierda — siempre ocupa espacio, visible solo si hasPrev */}
          <View style={[styles.arrowWrap, { width: arrowSize }]}>
            {hasPrev && (
              <TouchableOpacity
                style={[styles.arrow, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                onPress={() => setPage(page - 1)}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={arrowSize * 0.5} color="#E85D27" />
              </TouchableOpacity>
            )}
          </View>

          {/* Grid — ancho fijo siempre igual */}
          <View style={[styles.grid, { gap: rowGap, width: gridW }]}>
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
          </View>

          {/* Flecha derecha — siempre ocupa espacio, visible solo si hasNext */}
          <View style={[styles.arrowWrap, { width: arrowSize }]}>
            {hasNext && (
              <TouchableOpacity
                style={[styles.arrow, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                onPress={() => setPage(page + 1)}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={arrowSize * 0.5} color="#E85D27" />
              </TouchableOpacity>
            )}
          </View>

        </View>
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
    alignSelf: 'stretch',
  },
  gridRow: {
    flexDirection: 'row',
  },
});
