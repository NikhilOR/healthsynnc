import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { weightApi } from '../../src/api/weight';
import { chartsApi } from '../../src/api/charts';
import BottomNav from '../../src/components/BottomNav';
import WeeklyChart from '../../src/components/WeeklyChart';

export default function WeightScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [logsData, progressData, chart] = await Promise.all([
        weightApi.getWeightLogs(30),
        weightApi.getProgress(),
        chartsApi.weightHistory(),
      ]);
      setLogs(logsData);
      setProgress(progressData);
      setChartData(chart);
    } catch (error) {
      console.error('Failed to fetch weight data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚖️ Weight</Text>
        <TouchableOpacity onPress={() => router.push('/weight/add')}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListHeaderComponent={
          <View>
            <View style={styles.summary}>
              <Text style={styles.currentWeight}>{progress?.current_weight || 0} kg</Text>
              <Text style={styles.goalText}>Goal: {progress?.goal_weight || 70} kg</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress?.progress_percentage || 0}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress?.progress_percentage || 0}% to goal</Text>
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              <WeeklyChart
                labels={chartData.labels}
                data={chartData.data}
                color="#f97316"
                unit="kg"
                title="📊 Weight Trend"
              />
              <Text style={styles.sectionTitle}>Recent Entries</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View>
              <Text style={styles.logWeight}>{item.weight_kg} kg</Text>
              <Text style={styles.logDate}>{item.date} at {item.time}</Text>
            </View>
            <View style={styles.bmiContainer}>
              <Text style={styles.bmiValue}>{item.bmi || 'N/A'}</Text>
              <Text style={styles.bmiLabel}>BMI</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No weight entries yet. Tap + to add.</Text>}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  backText: { fontSize: 24, color: '#333' },
  addText: { fontSize: 28, color: '#f97316', fontWeight: 'bold' },
  summary: { backgroundColor: '#f97316', padding: 24, alignItems: 'center' },
  currentWeight: { fontSize: 42, fontWeight: '800', color: '#fff' },
  goalText: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  progressBar: { width: '80%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  progressText: { fontSize: 12, color: '#fff', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 8 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginTop: 8, borderRadius: 12 },
  logWeight: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  logDate: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  bmiContainer: { alignItems: 'center' },
  bmiValue: { fontSize: 18, fontWeight: 'bold', color: '#f97316' },
  bmiLabel: { fontSize: 11, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 24, fontStyle: 'italic' },
});
