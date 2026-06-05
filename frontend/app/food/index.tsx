import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { foodApi } from '../../src/api/food';
import { chartsApi } from '../../src/api/charts';
import BottomNav from '../../src/components/BottomNav';
import WeeklyChart from '../../src/components/WeeklyChart';

export default function FoodScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [data, chart] = await Promise.all([
        foodApi.getFoodLogs(),
        chartsApi.foodWeekly(),
      ]);
      setLogs(data);
      setChartData(chart);
    } catch (error) {
      console.error('Failed to fetch food logs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteLog = async (id: string) => {
    try {
      await foodApi.deleteFoodLog(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const groupedLogs = logs.reduce((acc: any, log) => {
    if (!acc[log.meal_type]) acc[log.meal_type] = [];
    acc[log.meal_type].push(log);
    return acc;
  }, {});

  const totalCalories = logs.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  const mealIcons: any = { breakfast: '☀️', lunch: '🍽️', dinner: '🌙', snack: '🍪' };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🍽️ Food Diary</Text>
        <TouchableOpacity onPress={() => router.push('/food/add')}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View style={styles.summary}>
          <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
          <Text style={styles.summaryLabel}>Calories Today</Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <WeeklyChart
            labels={chartData.labels}
            data={chartData.data}
            color="#ef4444"
            unit="kcal"
            title="📊 Last 7 Days Calories"
          />
        </View>

        {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
          const mealLogs = groupedLogs[mealType] || [];
          const mealCalories = mealLogs.reduce((sum: number, log: any) => sum + (log.total_calories || 0), 0);
          return (
            <View key={mealType} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>{mealIcons[mealType]} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                <Text style={styles.mealCalories}>{Math.round(mealCalories)} cal</Text>
              </View>
              {mealLogs.length === 0 ? (
                <Text style={styles.emptyText}>No items logged</Text>
              ) : (
                mealLogs.map((log: any) => (
                  <View key={log._id} style={styles.foodLog}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.foodName}>{log.food_name}</Text>
                      <Text style={styles.foodMeta}>Qty: {log.quantity} • {Math.round(log.total_calories)} cal</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteLog(log._id)}>
                      <Text style={styles.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/food/add')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  backText: { fontSize: 24, color: '#333' },
  addText: { fontSize: 28, color: '#ef4444', fontWeight: 'bold' },
  summary: { backgroundColor: '#ef4444', padding: 24, alignItems: 'center' },
  summaryValue: { fontSize: 42, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 13, color: '#fff', opacity: 0.9, marginTop: 4 },
  mealSection: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 14 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mealTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  mealCalories: { fontSize: 13, color: '#ef4444', fontWeight: '700' },
  foodLog: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  foodName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  foodMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  deleteText: { fontSize: 18, color: '#ef4444', padding: 8 },
  emptyText: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', paddingVertical: 6 },
  fab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
});
