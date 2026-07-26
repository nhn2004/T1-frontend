import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SessionCard from './SessionCard';
import useTheme from '../../../hooks/useTheme';
import { a11yButton, MIN_TOUCH_SIZE } from '../../../constants/a11y';

const COLS_WIDE = 3;
const ROWS_WIDE = 3;

export default function CarouselGrid({ sessions, onViewDetails }) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // En pantallas angostas la rejilla 3x3 deja tarjetas ilegibles; se reduce a 1 o 2
  // columnas y se apilan verticalmente en vez de paginar en horizontal.
  const cols = screenWidth < 640 ? 1 : screenWidth < 1000 ? 2 : COLS_WIDE;
  const rows = screenWidth < 640 ? 2 : screenWidth < 1000 ? 3 : ROWS_WIDE;

  const [box, setBox]   = useState({ w: 0, h: 0 });
  const [page, setPage] = useState(0);

  const perPage    = cols * rows;
  const totalPages = Math.max(1, Math.ceil(sessions.length / perPage));

  // Si cambia el filtro (o el tamaño de página) la página actual puede quedar fuera
  // de rango y la rejilla se vería vacía.
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  useEffect(() => { setPage(0); }, [sessions.length]);

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  }, []);

  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  const colGap    = Math.max(8, box.w * 0.012);
  const rowGap    = Math.max(8, box.h * 0.02);
  const arrowSize = Math.max(MIN_TOUCH_SIZE, box.h * 0.04);
  const gridW     = box.w > 0 ? box.w - 2 * (arrowSize + colGap) : 0;
  const cardW     = gridW > 0 ? (gridW - colGap * (cols - 1)) / cols : 0;
  const cardH     = box.h > 0 ? (box.h - rowGap * (rows - 1)) / rows : 0;

  const pageCards = sessions.slice(page * perPage, page * perPage + perPage);
  const gridRows  = [];
  for (let r = 0; r < rows; r++) {
    const row = pageCards.slice(r * cols, r * cols + cols);
    if (row.length > 0) gridRows.push(row);
  }

  return (
    <View style={styles.outer} onLayout={onLayout}>
      {box.w > 0 && (
        <View style={[styles.row, { gap: colGap }]}>
          <View style={[styles.arrowWrap, { width: arrowSize }]}>
            {hasPrev && (
              <TouchableOpacity
                style={[styles.arrow, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                onPress={() => setPage((p) => p - 1)}
                activeOpacity={0.8}
                {...a11yButton(`Página anterior, ${page} de ${totalPages}`)}
              >
                <Ionicons name="chevron-back" size={arrowSize * 0.5} color={theme.primaryText} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.grid, { gap: rowGap, width: gridW }]}>
            {gridRows.map((rowCards, ri) => (
              <View
                // Índice de fila como clave: las filas son posicionales dentro de la
                // página, no entidades con identidad propia.
                key={`row-${ri}`}
                style={[styles.gridRow, { gap: colGap, height: cardH }]}
              >
                {rowCards.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onViewDetails={onViewDetails}
                    cardWidth={cardW}
                    cardHeight={cardH}
                  />
                ))}
                {rowCards.length < cols
                  && Array.from({ length: cols - rowCards.length }).map((_, i) => (
                    <View key={`filler-${ri}-${i}`} style={{ width: cardW }} />
                  ))}
              </View>
            ))}
          </View>

          <View style={[styles.arrowWrap, { width: arrowSize }]}>
            {hasNext && (
              <TouchableOpacity
                style={[styles.arrow, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                onPress={() => setPage((p) => p + 1)}
                activeOpacity={0.8}
                {...a11yButton(`Página siguiente, ${page + 2} de ${totalPages}`)}
              >
                <Ionicons name="chevron-forward" size={arrowSize * 0.5} color={theme.primaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    outer: { flex: 1 },
    row: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    arrowWrap: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
    arrow: {
      backgroundColor: t.card,
      borderWidth: 1.5,
      borderColor: t.primaryBorder,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
    grid: { alignSelf: 'stretch' },
    gridRow: { flexDirection: 'row' },
  });
