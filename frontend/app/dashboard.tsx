import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboardApi } from '../src/api/dashboard';
import { useAuthStore } from '../src/store/authStore';
import BottomNav from '../src/components/BottomNav';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const cardWidth = (width - 40 - CARD_GAP) / 2;

export default function DashboardScreen() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const fetchSummary = async () => {
    try {
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const score = summary?.health_score || 0;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const caloriePercent = summary?.calories?.goal > 0 ? Math.min(100, (summary.calories.consumed / summary.calories.goal) * 100) : 0;
  const waterPercent = summary?.water?.percentage || 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#6366f1', '#8b5cf6', '#ec4899']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{greeting} 👋</Text>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileBtn}>
                <Text style={styles.profileInitial}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* Health Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreLeft}>
                <Text style={styles.scoreLabel}>HEALTH SCORE</Text>
                <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text>
                <Text style={styles.scoreSubtext}>
                  {score >= 80 ? '🌟 Excellent!' : score >= 60 ? '👍 Good progress' : '💪 Keep going!'}
                </Text>
              </View>
              <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreRingText, { color: scoreColor }]}>{score}</Text>
                <Text style={styles.scoreRingLabel}>/100</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Stats Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Stats</Text>
          <TouchableOpacity onPress={() => router.push('/analytics')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {/* Calories */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardWidth }]}
            onPress={() => router.push('/food')}
            activeOpacity={0.8}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#fef2f2' }]}>
                <Text style={styles.statIcon}>🔥</Text>
              </View>
              <Text style={styles.statBadge}>{Math.round(caloriePercent)}%</Text>
            </View>
            <Text style={styles.statValue}>{Math.round(summary?.calories?.consumed || 0)}</Text>
            <Text style={styles.statUnit}>kcal eaten</Text>
            <View style={styles.statBar}>
              <View style={[styles.statBarFill, { width: `${caloriePercent}%`, backgroundColor: '#ef4444' }]} />
            </View>
            <Text style={styles.statFooter}>Goal: {summary?.calories?.goal || 0}</Text>
          </TouchableOpacity>

          {/* Water */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardWidth }]}
            onPress={() => router.push('/water')}
            activeOpacity={0.8}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}>
                <Text style={styles.statIcon}>💧</Text>
              </View>
              <Text style={styles.statBadge}>{Math.round(waterPercent)}%</Text>
            </View>
            <Text style={styles.statValue}>{summary?.water?.consumed || 0}</Text>
            <Text style={styles.statUnit}>ml water</Text>
            <View style={styles.statBar}>
              <View style={[styles.statBarFill, { width: `${waterPercent}%`, backgroundColor: '#3b82f6' }]} />
            </View>
            <Text style={styles.statFooter}>Goal: {summary?.water?.goal || 0}ml</Text>
          </TouchableOpacity>

          {/* Weight */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardWidth }]}
            onPress={() => router.push('/weight')}
            activeOpacity={0.8}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#fff7ed' }]}>
                <Text style={styles.statIcon}>⚖️</Text>
              </View>
              <Text style={styles.statBadge}>BMI {summary?.weight?.bmi || '—'}</Text>
            </View>
            <Text style={styles.statValue}>{summary?.weight?.current || 0}</Text>
            <Text style={styles.statUnit}>kg current</Text>
            <View style={styles.statBar}>
              <View style={[styles.statBarFill, { width: '70%', backgroundColor: '#f97316' }]} />
            </View>
            <Text style={styles.statFooter}>Goal: {summary?.weight?.goal || 0}kg</Text>
          </TouchableOpacity>

          {/* Expenses */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardWidth }]}
            onPress={() => router.push('/expenses')}
            activeOpacity={0.8}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Text style={styles.statIcon}>💰</Text>
              </View>
              <Text style={styles.statBadge}>Today</Text>
            </View>
            <Text style={styles.statValue}>₹{summary?.expenses?.today || 0}</Text>
            <Text style={styles.statUnit}>spent</Text>
            <View style={styles.statBar}>
              <View style={[styles.statBarFill, { width: '40%', backgroundColor: '#22c55e' }]} />
            </View>
            <Text style={styles.statFooter}>View details →</Text>
          </TouchableOpacity>
        </View>

        {/* Smoking Banner */}
        <TouchableOpacity style={styles.smokingBanner} onPress={() => router.push('/smoking')} activeOpacity={0.9}>
          <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.smokingGradient}>
            <View style={styles.smokingLeft}>
              <Text style={styles.smokingEmoji}>🚬</Text>
              <View>
                <Text style={styles.smokingLabel}>Smoking Today</Text>
                <Text style={styles.smokingCount}>{summary?.smoking?.cigarettes_today || 0} cigarettes</Text>
              </View>
            </View>
            <View style={styles.smokingRight}>
              <Text style={styles.smokingCost}>₹{summary?.smoking?.cost_today || 0}</Text>
              <Text style={styles.smokingCostLabel}>spent</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12, paddingHorizontal: 20 }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/food/add')} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: '#fef2f2' }]}>
              <Text style={styles.actionEmoji}>🍽️</Text>
            </View>
            <Text style={styles.actionText}>Log{'\n'}Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/water')} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Text style={styles.actionEmoji}>💧</Text>
            </View>
            <Text style={styles.actionText}>Add{'\n'}Water</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/weight/add')} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: '#fff7ed' }]}>
              <Text style={styles.actionEmoji}>⚖️</Text>
            </View>
            <Text style={styles.actionText}>Log{'\n'}Weight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/ai-coach')} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: '#f5f3ff' }]}>
              <Text style={styles.actionEmoji}>🤖</Text>
            </View>
            <Text style={styles.actionText}>AI{'\n'}Coach</Text>
          </TouchableOpacity>
        </View>

        {/* AI Coach Banner */}
        <TouchableOpacity style={styles.aiBanner} onPress={() => router.push('/ai-coach')} activeOpacity={0.9}>
          <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.aiGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>🤖 AI Health Coach</Text>
              <Text style={styles.aiSubtitle}>Get personalized health advice powered by Gemini AI</Text>
              <View style={styles.aiBtn}>
                <Text style={styles.aiBtnText}>Chat Now →</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerGradient: { paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { paddingHorizontal: 20, paddingTop: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#fff', opacity: 0.9, fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  profileInitial: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  
  scoreCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
  scoreLeft: { flex: 1 },
  scoreLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2 },
  scoreValue: { fontSize: 42, fontWeight: '800', marginVertical: 2 },
  scoreSubtext: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  scoreRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  scoreRingText: { fontSize: 22, fontWeight: '800' },
  scoreRingLabel: { fontSize: 10, color: '#9ca3af', marginTop: -2 },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  seeAll: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: CARD_GAP },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: CARD_GAP, borderWidth: 1, borderColor: '#f3f4f6' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statIcon: { fontSize: 18 },
  statBadge: { fontSize: 10, fontWeight: '700', color: '#6b7280', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statUnit: { fontSize: 12, color: '#6b7280', marginTop: -2, marginBottom: 8 },
  statBar: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  statBarFill: { height: '100%', borderRadius: 3 },
  statFooter: { fontSize: 10, color: '#9ca3af', fontWeight: '500' },
  
  smokingBanner: { marginHorizontal: 20, marginTop: 8, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  smokingGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smokingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  smokingEmoji: { fontSize: 32, marginRight: 12 },
  smokingLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  smokingCount: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  smokingRight: { alignItems: 'flex-end' },
  smokingCost: { fontSize: 20, fontWeight: '800', color: '#fff' },
  smokingCostLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  actionCard: { alignItems: 'center', flex: 1 },
  actionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 26 },
  actionText: { fontSize: 12, color: '#374151', textAlign: 'center', fontWeight: '600', lineHeight: 16 },
  
  aiBanner: { marginHorizontal: 20, marginTop: 24, borderRadius: 20, overflow: 'hidden', elevation: 6 },
  aiGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  aiTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  aiSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 12, lineHeight: 18 },
  aiBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  aiBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
