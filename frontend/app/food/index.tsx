import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { foodApi } from '../../src/api/food';

export default function FoodScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchLogs = async () => {
    try {
      const data = await foodApi.getFoodLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch food logs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const deleteLog = async (id: string) => {
    try {
      await foodApi.deleteFoodLog(id);
      fetchLogs();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const groupedLogs = logs.reduce((acc: any, log) => {
    const meal = log.meal_type;
    if (!acc[meal]) acc[meal] = [];
    acc[meal].push(log);
    return acc;
  }, {});

  const totalCalories = logs.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  const mealIcons: any = { breakfast: '☀️', lunch: '🍽️', dinner: '🌙', snack: '🍪' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Diary</Text>
        <TouchableOpacity onPress={() => router.push('/food/add')}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
        <Text style={styles.summaryLabel}>Total Calories Today</Text>
      </View>

      <FlatList
        data={['breakfast', 'lunch', 'dinner', 'snack']}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLogs(); }} />}
        renderItem={({ item: mealType }) => {
          const mealLogs = groupedLogs[mealType] || [];
          const mealCalories = mealLogs.reduce((sum: number, log: any) => sum + (log.total_calories || 0), 0);
          return (
            <View style={styles.mealSection}>
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
        }}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/food/add')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  backText: { fontSize: 24, color: '#333' },
  addText: { fontSize: 28, color: '#667eea', fontWeight: 'bold' },
  summary: { backgroundColor: '#667eea', padding: 24, alignItems: 'center' },
  summaryValue: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  mealSection: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mealTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  mealCalories: { fontSize: 14, color: '#667eea', fontWeight: '600' },
  foodLog: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  foodName: { fontSize: 14, color: '#333', fontWeight: '500' },
  foodMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  deleteText: { fontSize: 18, color: '#ff6b6b', padding: 8 },
  emptyText: { fontSize: 13, color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
});
