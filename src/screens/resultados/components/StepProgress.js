import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STEPS_CONFIG } from '../__mocks__/resultadosData';

export default function StepProgress({ currentStep }) {
  return (
    <View style={styles.container}>
      {STEPS_CONFIG.map((step, index) => {
        const stepNum  = index + 1;
        const isActive    = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const isPending   = stepNum > currentStep;
        const isLast      = index === STEPS_CONFIG.length - 1;
        const showAsterisk = step.required && !isActive;

        return (
          <View key={step.key} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View style={[
                styles.circle,
                isActive    && styles.circleActive,
                isCompleted && styles.circleCompleted,
                isPending   && styles.circlePending,
              ]}>
                {isCompleted
                  ? <Ionicons name="checkmark" size={18} color="#fff" />
                  : <Ionicons name={step.icon} size={18} color={isActive ? '#fff' : '#9AA3B0'} />
                }
              </View>

              <View style={styles.labelBlock}>
                <Text style={[
                  styles.stepNum,
                  isActive    && styles.stepNumActive,
                  isCompleted && styles.stepNumDone,
                ]}>
                  Paso {stepNum}
                </Text>
                <Text style={[
                  styles.stepLabel,
                  isActive    && styles.stepLabelActive,
                  isCompleted && styles.stepLabelDone,
                ]}>
                  {step.label}{showAsterisk ? ' *' : ''}
                </Text>
              </View>
            </View>

            {!isLast && (
              <View style={[styles.line, isCompleted && styles.lineCompleted]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    zIndex: 10,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: '#E85D27',
  },
  circleCompleted: {
    backgroundColor: '#2E7D32',
  },
  circlePending: {
    backgroundColor: '#E5E7EB',
  },
  labelBlock: {
    gap: 1,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9AA3B0',
  },
  stepNumActive: {
    color: '#E85D27',
  },
  stepNumDone: {
    color: '#6A7282',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9AA3B0',
  },
  stepLabelActive: {
    color: '#1A1A1A',
  },
  stepLabelDone: {
    color: '#1A1A1A',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  lineCompleted: {
    backgroundColor: '#2E7D32',
  },
});
