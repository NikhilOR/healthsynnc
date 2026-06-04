import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardApi } from '../src/api/dashboard';
import { useAuthStore } from '../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function DashboardScreen() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuthStore();
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

  useEffect(() => {
    fetchSummary();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return ['#10b981', '#059669'];
    if (score >= 60) return ['#f59e0b', '#d97706'];
    return ['#ef4444', '#dc2626'];
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Health Score Ring */}
        <View style={styles.healthScoreContainer}>
          <LinearGradient
            colors={getHealthScoreColor(summary?.health_score || 0)}
            style={styles.healthScoreRing}
          >
            <View style={styles.healthScoreInner}>
              <Text style={styles.healthScoreValue}>{summary?.health_score || 0}</Text>
              <Text style={styles.healthScoreLabel}>Health Score</Text>
            </View>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        {/* Calories Card */}
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: '#ffe5e5' }]}
          onPress={() => router.push('/food')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#ff6b6b' }]}>
            <Ionicons name="flame" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{summary?.calories?.consumed || 0}</Text>
          <Text style={styles.statLabel}>Calories</Text>
          <Text style={styles.statSubtext}>
            Goal: {summary?.calories?.goal || 0}
          </Text>
        </TouchableOpacity>

        {/* Water Card */}
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: '#e5f3ff' }]}
          onPress={() => router.push('/water')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#4dabf7' }]}>
            <Ionicons name="water" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{summary?.water?.consumed || 0}ml</Text>
          <Text style={styles.statLabel}>Water</Text>
          <Text style={styles.statSubtext}>
            {summary?.water?.percentage || 0}%
          </Text>
        </TouchableOpacity>

        {/* Weight Card */}
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: '#fff4e5' }]}
          onPress={() => router.push('/weight')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#ffa94d' }]}>
            <Ionicons name="fitness" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{summary?.weight?.current || 0}kg</Text>
          <Text style={styles.statLabel}>Weight</Text>
          <Text style={styles.statSubtext}>
            Goal: {summary?.weight?.goal || 0}kg
          </Text>
        </TouchableOpacity>

        {/* Expenses Card */}
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: '#e5ffe5' }]}
          onPress={() => router.push('/expenses')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#51cf66' }]}>
            <Ionicons name="wallet" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>₹{summary?.expenses?.today || 0}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statSubtext}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Smoking Card */}
      {(summary?.smoking?.cigarettes_today > 0 || true) && (
        <TouchableOpacity 
          style={styles.fullWidthCard}
          onPress={() => router.push('/smoking')}
        >
          <LinearGradient
            colors={['#ff6b6b', '#ee5a6f']}
            style={styles.smokingGradient}
          >
            <View style={styles.smokingContent}>
              <Ionicons name="close-circle" size={32} color="#fff" />
              <View style={styles.smokingStats}>
                <Text style={styles.smokingValue}>
                  {summary?.smoking?.cigarettes_today || 0}
                </Text>
                <Text style={styles.smokingLabel}>Cigarettes Today</Text>
              </View>
              <View style={styles.smokingCost}>
                <Text style={styles.smokingCostValue}>₹{summary?.smoking?.cost_today || 0}</Text>
                <Text style={styles.smokingCostLabel}>Spent</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/food/add')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#ff6b6b' }]}>
              <Ionicons name="add" size={24} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Log Meal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/weight/add')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#ffa94d' }]}>
              <Ionicons name="add" size={24} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Log Weight</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/ai-coach')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#667eea' }]}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>AI Coach</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/analytics')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#51cf66' }]}>
              <Ionicons name="stats-chart" size={24} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  healthScoreContainer: {
    alignItems: 'center',
  },
  healthScoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    marginTop: -20,
  },
  statCard: {
    width: cardWidth,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
  },
  fullWidthCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  smokingGradient: {
    padding: 20,
  },
  smokingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smokingStats: {
    flex: 1,
    marginLeft: 16,
  },
  smokingValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  smokingLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  smokingCost: {
    alignItems: 'flex-end',
  },
  smokingCostValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  smokingCostLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
