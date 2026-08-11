import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { a11yDecorative, a11yGroup } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT } from '../../../constants/typography';

// Línea de tiempo vertical de la agenda. Puramente presentacional.
//
// `items === null` significa "el servidor no expone la agenda todavía";
// `items === []` significa "esta sesión no tiene actividades cargadas".
// Se distinguen porque para el usuario no son lo mismo: antes ambos casos mostraban
// una sección vacía que parecía un error de carga.

export default function AgendaTimeline({ items }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isUnavailable = items === null || items === undefined;
  const list = Array.isArray(items) ? items : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={18} color={theme.icon} {...a11yDecorative} />
        <Text style={styles.headerText} accessibilityRole="header">
          {t.sessionDetail.agenda}
        </Text>
      </View>

      {isUnavailable ? (
        <View style={styles.emptyBox}>
          <Ionicons name="time-outline" size={20} color={theme.iconMuted} {...a11yDecorative} />
          <Text style={styles.emptyText}>
            La agenda detallada aún no está disponible en el servidor.
          </Text>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-clear-outline" size={20} color={theme.iconMuted} {...a11yDecorative} />
          <Text style={styles.emptyText}>Esta capacitación no tiene actividades registradas.</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {list.map((item, index) => {
            const isLast = index === list.length - 1;
            return (
              <View
                key={item.id}
                style={styles.row}
                {...a11yGroup([item.time, item.title, item.description].filter(Boolean).join(', '))}
              >
                <View style={styles.timeColumn}>
                  <Text style={styles.time}>{item.time}</Text>
                  <View style={styles.dotWrapper} {...a11yDecorative}>
                    <View style={styles.dot} />
                    {!isLast && <View style={styles.line} />}
                  </View>
                </View>

                <View style={styles.content}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {!!item.description && (
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    container: { gap: 10 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerText: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },

    emptyBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.cardAlt, borderRadius: 10,
      borderWidth: 1, borderColor: t.border, padding: 12,
    },
    emptyText: { flex: 1, fontSize: FONT_SIZE.md, color: t.textMuted, lineHeight: 18 },

    timeline: { gap: 0 },
    row: { flexDirection: 'row', gap: 12, minHeight: 64 },
    timeColumn: { width: 48, alignItems: 'flex-end', gap: 2 },
    time: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: t.textSecondary, marginTop: 2 },
    dotWrapper: { alignItems: 'center', flex: 1 },
    dot: {
      width: 12, height: 12, borderRadius: 6,
      borderWidth: 2, borderColor: t.primary, backgroundColor: t.card,
    },
    line: { flex: 1, width: 2, backgroundColor: t.border, marginTop: 2 },
    content: { flex: 1, paddingBottom: 16 },
    itemTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary, marginTop: 2, marginBottom: 3 },
    itemDesc: { fontSize: FONT_SIZE.md, color: t.textSecondary, lineHeight: 18 },
  });
