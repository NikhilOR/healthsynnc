import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { weightApi } from '../../src/api/weight';

export default function WeightScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [logsData, progressData] = await Promise.all([
        weightApi.getWeightLogs(30),
        weightApi.getProgress(),
      ]);
      setLogs(logsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to fetch weight data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weight Tracking</Text>
        <TouchableOpacity onPress={() => router.push('/weight/add')}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.currentWeight}>{progress?.current_weight || 0} kg</Text>
            <Text style={styles.goalText}>Goal: {progress?.goal_weight || 70} kg</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress?.progress_percentage || 0}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress?.progress_percentage || 0}% to goal</Text>
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
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  backText: { fontSize: 24, color: '#333' },
  addText: { fontSize: 28, color: '#ffa94d', fontWeight: 'bold' },
  summary: { backgroundColor: '#ffa94d', padding: 24, alignItems: 'center' },
  currentWeight: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  goalText: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  progressBar: { width: '80%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  progressText: { fontSize: 12, color: '#fff', marginTop: 8 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 12, marginTop: 8, borderRadius: 12 },
  logWeight: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  logDate: { fontSize: 12, color: '#999', marginTop: 4 },
  bmiContainer: { alignItems: 'center' },
  bmiValue: { fontSize: 18, fontWeight: 'bold', color: '#ffa94d' },
  bmiLabel: { fontSize: 11, color: '#999' },
  empty: { textAlign: 'center', color: '#999', padding: 24, fontStyle: 'italic' },
});
