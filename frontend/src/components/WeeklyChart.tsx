import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface Props {
  labels: string[];
  data: number[];
  color?: string;
  unit?: string;
  title?: string;
  type?: 'bar' | 'line';
}

export default function WeeklyChart({ labels, data, color = '#6366f1', unit = '', title, type = 'bar' }: Props) {
  const maxValue = Math.max(...data, 1);
  const chartWidth = width - 64;
  const chartHeight = 160;
  const barWidth = (chartWidth - 32) / Math.max(labels.length, 1) - 8;

  if (data.length === 0 || data.every((d) => d === 0)) {
    return (
      <View style={styles.empty}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>No data yet</Text>
          <Text style={styles.emptySubtext}>Start logging to see trends</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.chart, { height: chartHeight + 40 }]}>
        <View style={[styles.bars, { height: chartHeight }]}>
          {data.map((value, idx) => {
            const heightPercent = (value / maxValue) * 100;
            return (
              <View key={idx} style={[styles.barColumn, { width: barWidth }]}>
                <Text style={styles.valueLabel}>{value > 0 ? Math.round(value) : ''}</Text>
                <View style={[styles.barBg, { height: chartHeight - 40 }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${heightPercent}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.labels}>
          {labels.map((label, idx) => (
            <Text key={idx} style={[styles.label, { width: barWidth }]}>{label}</Text>
          ))}
        </View>
      </View>
      {unit && (
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Last 7 days ({unit})</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginVertical: 8 },
  empty: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginVertical: 8 },
  emptyBox: { alignItems: 'center', padding: 24 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  emptySubtext: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  chart: { paddingHorizontal: 8 },
  bars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', gap: 8 },
  barColumn: { alignItems: 'center', justifyContent: 'flex-end' },
  valueLabel: { fontSize: 10, color: '#6b7280', marginBottom: 4, fontWeight: '600' },
  barBg: { width: '100%', backgroundColor: '#f3f4f6', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 2 },
  labels: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, gap: 8 },
  label: { fontSize: 11, color: '#9ca3af', textAlign: 'center', fontWeight: '500' },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#6b7280' },
});
