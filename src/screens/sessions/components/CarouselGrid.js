import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SessionCard from './SessionCard';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// Alto mínimo para que una SessionCard quepa completa (título+badge, 3 filas de
// detalle y el botón) sin que "overflow: hidden" recorte el botón al fondo.
const MIN_CARD_HEIGHT = 190;

// Columnas según el ancho real del contenedor (no el de la ventana), para que el
// grid se acomode igual aunque el sidebar esté colapsado o expandido.
function columnsForWidth(w) {
  if (w < 420) return 1;
  if (w < 760) return 2;
  return 3;
}

// Filas según el alto real del contenedor — si la ventana del navegador es más
// baja, se muestran menos filas por página (con flechas para paginar) en vez de
// aplastar cada tarjeta hasta recortar el botón "Ver Detalles".
function rowsForHeight(h) {
  return Math.max(1, Math.floor(h / MIN_CARD_HEIGHT));
}

export default function CarouselGrid({ sessions = [], onViewDetails }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [box, setBox]   = useState({ w: 0, h: 0 });
  const fadeAnim        = useRef(new Animated.Value(1)).current;
  const COLS            = useMemo(() => columnsForWidth(box.w), [box.w]);
  const ROWS            = useMemo(() => rowsForHeight(box.h), [box.h]);
  const isSingleColumn  = COLS === 1;
  const perPage         = COLS * ROWS;
  const totalPages      = Math.ceil((sessions?.length || 0) / perPage);
  const [page, setPage] = useState(0);

  // Si cambia el filtro/lista o el número de columnas reduce el total de páginas,
  // evita quedar "atascado" en una página vacía fuera de rango.
  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

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

  // En una sola columna (teléfono) no tiene sentido forzar la altura de cada
  // tarjeta a "alto disponible / filas": con pocas filas eso deja muchísimo
  // espacio vacío entre el contenido y el botón. En ese caso se vuelve una
  // lista vertical normal, con scroll, donde cada tarjeta mide según su
  // contenido — sin paginar ni forzar alto.
  if (isSingleColumn) {
    return (
      <View style={styles.outer} onLayout={onLayout}>
        {box.w > 0 && (
          <ScrollView style={styles.singleColumnScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.singleColumnList}>
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onViewDetails={onViewDetails}
                cardWidth={box.w}
              />
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.outer} onLayout={onLayout}>
      {box.w > 0 && (
        <View style={[styles.row, { gap: colGap }]}>

          {/* Flecha izquierda — solo si hace falta */}
          {needArrows && (
            <Arrow direction="left" visible={hasPrev} size={arrowSize}
              onPress={() => animateTo(page - 1)} cardColor={theme.card} label={t.sessions.pagePrev} />
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
              onPress={() => animateTo(page + 1)} cardColor={theme.card} label={t.sessions.pageNext} />
          )}

        </View>
      )}
    </View>
  );
}

function Arrow({ direction, visible, size, onPress, cardColor, label }) {
  return (
    <View style={[styles.arrowWrap, { width: size }]}>
      {visible ? (
        <TouchableOpacity
          style={[styles.arrow, { width: size, height: size, borderRadius: size / 2, backgroundColor: cardColor }]}
          onPress={onPress} activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={label}
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
  singleColumnScroll: { flex: 1 },
  singleColumnList: { gap: 12, paddingBottom: 12 },
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
