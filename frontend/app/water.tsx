import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { waterApi } from '../src/api/water';
import { chartsApi } from '../src/api/charts';
import BottomNav from '../src/components/BottomNav';
import WeeklyChart from '../src/components/WeeklyChart';

export default function WaterScreen() {
  const [totalWater, setTotalWater] = React.useState(0);
  const [goal, setGoal] = React.useState(2000);
  const [chartData, setChartData] = React.useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [customAmount, setCustomAmount] = React.useState('');
  const [showCustom, setShowCustom] = React.useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [progress, chart] = await Promise.all([
        waterApi.getDailyProgress(),
        chartsApi.waterWeekly(),
      ]);
      setTotalWater(progress.total);
      setGoal(progress.goal);
      setChartData(chart);
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
  };

  React.useEffect(() => { fetchData(); }, []);

  const logWater = async (amount: number) => {
    try {
      await waterApi.logWater(amount);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to log water');
    }
  };

  const logCustom = async () => {
    const amt = parseInt(customAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    await logWater(amt);
    setCustomAmount('');
    setShowCustom(false);
  };

  const percentage = Math.min(100, (totalWater / goal) * 100);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💧 Water</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressCircle, { borderColor: percentage >= 100 ? '#10b981' : '#3b82f6' }]}>
            <Text style={styles.progressValue}>{totalWater}ml</Text>
            <Text style={styles.progressLabel}>of {goal}ml</Text>
            <Text style={[styles.progressPercentage, { color: percentage >= 100 ? '#10b981' : '#3b82f6' }]}>
              {Math.round(percentage)}%
            </Text>
          </View>
        </View>

        <View style={styles.quickAddContainer}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.buttonGrid}>
            {[250, 500, 750, 1000].map((amt) => (
              <TouchableOpacity key={amt} style={styles.waterButton} onPress={() => logWater(amt)}>
                <Text style={{ fontSize: 32 }}>💧</Text>
                <Text style={styles.buttonText}>{amt}ml</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.customBtn} onPress={() => setShowCustom(!showCustom)}>
            <Text style={styles.customBtnText}>{showCustom ? '✕ Cancel' : '+ Add Custom Amount'}</Text>
          </TouchableOpacity>

          {showCustom && (
            <View style={styles.customForm}>
              <TextInput
                style={styles.customInput}
                placeholder="Enter ml (e.g. 350)"
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.customSave} onPress={logCustom}>
                <Text style={styles.customSaveText}>Log Water</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <WeeklyChart
            labels={chartData.labels}
            data={chartData.data}
            color="#3b82f6"
            unit="ml"
            title="📊 Last 7 Days"
          />
        </View>
      </ScrollView>
      <BottomNav />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  backText: { fontSize: 24, color: '#333' },
  progressContainer: { padding: 24, alignItems: 'center' },
  progressCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 10 },
  progressValue: { fontSize: 32, fontWeight: '800', color: '#111827' },
  progressLabel: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  progressPercentage: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  quickAddContainer: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  waterButton: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 6 },
  customBtn: { backgroundColor: '#eff6ff', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  customBtnText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  customForm: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginTop: 8, flexDirection: 'row', gap: 8 },
  customInput: { flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, fontSize: 15 },
  customSave: { backgroundColor: '#3b82f6', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  customSaveText: { color: '#fff', fontWeight: '700' },
});
