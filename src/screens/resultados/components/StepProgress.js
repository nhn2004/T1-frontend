import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STEPS_CONFIG } from '../__mocks__/resultadosData';
import useTheme from '../../../hooks/useTheme';
import { a11yDecorative } from '../../../constants/a11y';

export default function StepProgress({ currentStep }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${currentStep} de ${STEPS_CONFIG.length}`}
      accessibilityValue={{ min: 1, max: STEPS_CONFIG.length, now: currentStep }}
    >
      {STEPS_CONFIG.map((step, index) => {
        const stepNum     = index + 1;
        const isActive    = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const isLast      = index === STEPS_CONFIG.length - 1;
        const showAsterisk = step.required && !isActive;

        const circleStyle = isActive
          ? { backgroundColor: theme.primarySolid }
          : isCompleted
            ? { backgroundColor: theme.status.success.solid }
            : { backgroundColor: theme.border };

        const iconColor = isActive
          ? theme.onPrimarySolid
          : isCompleted
            ? theme.status.success.onSolid
            : theme.iconMuted;

        return (
          <View key={step.key} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View style={[styles.circle, circleStyle]} {...a11yDecorative}>
                <Ionicons
                  name={isCompleted ? 'checkmark' : step.icon}
                  size={18}
                  color={iconColor}
                />
              </View>

              <View style={styles.labelBlock}>
                <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>
                  Paso {stepNum}
                </Text>
                <Text
                  style={[
                    styles.stepLabel,
                    (isActive || isCompleted) && styles.stepLabelDone,
                  ]}
                >
                  {step.label}{showAsterisk ? ' *' : ''}
                </Text>
              </View>
            </View>

            {!isLast && (
              <View
                style={[styles.line, isCompleted && styles.lineCompleted]}
                {...a11yDecorative}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      backgroundColor: t.card,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      elevation: 3,
      shadowColor: t.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity,
      shadowRadius: 4,
      zIndex: 10,
    },
    stepWrapper: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 150 },
    stepItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    labelBlock: { gap: 1, flexShrink: 1 },
    stepNum: { fontSize: 11, fontWeight: '600', color: t.textMuted },
    stepNumActive: { color: t.primaryText },
    stepLabel: { fontSize: 12, fontWeight: '700', color: t.textMuted },
    stepLabelDone: { color: t.textPrimary },
    line: { flex: 1, height: 2, backgroundColor: t.border, marginHorizontal: 10 },
    lineCompleted: { backgroundColor: t.status.success.solid },
  });
