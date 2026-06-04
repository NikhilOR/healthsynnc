import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { dashboardApi } from '../src/api/dashboard';
import { gamificationApi } from '../src/api/gamification';
import { expensesApi } from '../src/api/expenses';
import { smokingApi } from '../src/api/smoking';

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [streaks, setStreaks] = useState<any>(null);
  const [expenseSummary, setExpenseSummary] = useState<any>(null);
  const [smokingStats, setSmokingStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [summary, streaksData, expenses, smoking] = await Promise.all([
        dashboardApi.getSummary(),
        gamificationApi.getStreaks(),
        expensesApi.getSummary('monthly'),
        smokingApi.getStatistics(),
      ]);
      setData(summary);
      setStreaks(streaksData);
      setExpenseSummary(expenses);
      setSmokingStats(smoking);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (!data) return <View style={styles.container}><Text style={{ padding: 20 }}>Loading...</Text></View>;

  const scores = [
    { name: 'Nutrition', score: Math.min(100, (data.calories.consumed / data.calories.goal) * 100), color: '#ff6b6b', emoji: '🍎' },
    { name: 'Hydration', score: data.water.percentage, color: '#4dabf7', emoji: '💧' },
    { name: 'Weight', score: data.weight.current > 0 ? 75 : 0, color: '#ffa94d', emoji: '⚖️' },
    { name: 'Expense', score: Math.max(0, 100 - (expenseSummary?.total || 0) / 100), color: '#51cf66', emoji: '💰' },
    { name: 'Smoke-Free', score: Math.max(0, 100 - (smokingStats?.today?.count || 0) * 20), color: '#ee5a6f', emoji: '🚭' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <View style={styles.overallCard}>
          <Text style={styles.overallTitle}>Overall Wellness Score</Text>
          <Text style={styles.overallScore}>{data.health_score}</Text>
          <Text style={styles.overallLabel}>out of 100</Text>
        </View>

        <Text style={styles.sectionTitle}>Health Scores</Text>
        {scores.map((s) => (
          <View key={s.name} style={styles.scoreCard}>
            <Text style={styles.scoreEmoji}>{s.emoji}</Text>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.scoreName}>{s.name}</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreFill, { width: `${Math.min(100, s.score)}%`, backgroundColor: s.color }]} />
              </View>
            </View>
            <Text style={[styles.scoreValue, { color: s.color }]}>{Math.round(s.score)}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>🔥 Streaks</Text>
        <View style={styles.streaksRow}>
          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>{streaks?.calorie_streak || 0}</Text>
            <Text style={styles.streakLabel}>Days Logging</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>{streaks?.water_streak || 0}</Text>
            <Text style={styles.streakLabel}>Water Goal</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>{streaks?.smoke_free_streak || 0}</Text>
            <Text style={styles.streakLabel}>Smoke-Free</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>💡 Recommendations</Text>
        <View style={styles.recCard}>
          {data.water.percentage < 50 && (
            <Text style={styles.recText}>💧 Drink more water! You're at {data.water.percentage}%</Text>
          )}
          {data.calories.consumed < data.calories.goal * 0.5 && (
            <Text style={styles.recText}>🍎 You're under your calorie goal by {data.calories.remaining} cal</Text>
          )}
          {smokingStats?.today?.count > 0 && (
            <Text style={styles.recText}>🚭 Try to reduce smoking - you've had {smokingStats.today.count} today</Text>
          )}
          {data.health_score > 80 && (
            <Text style={styles.recText}>🌟 Great job! You're doing amazing today!</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  backText: { fontSize: 24, color: '#333' },
  overallCard: { backgroundColor: '#667eea', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  overallTitle: { fontSize: 14, color: '#fff', opacity: 0.9 },
  overallScore: { fontSize: 64, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  overallLabel: { fontSize: 12, color: '#fff', opacity: 0.8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  scoreEmoji: { fontSize: 28 },
  scoreName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  scoreBar: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 4 },
  scoreValue: { fontSize: 20, fontWeight: 'bold', minWidth: 40, textAlign: 'right' },
  streaksRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  streakCard: { flex: 1, backgroundColor: '#fff', padding: 16, marginHorizontal: 4, borderRadius: 12, alignItems: 'center' },
  streakValue: { fontSize: 32, fontWeight: 'bold', color: '#ff6b6b' },
  streakLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' },
  recCard: { backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 12 },
  recText: { fontSize: 14, color: '#333', marginBottom: 8, lineHeight: 20 },
});
