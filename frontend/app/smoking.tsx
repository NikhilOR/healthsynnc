import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { smokingApi } from '../src/api/smoking';

export default function SmokingScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('10');
  const [notes, setNotes] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [logsData, statsData, progressData] = await Promise.all([
        smokingApi.getCigaretteLogs(),
        smokingApi.getStatistics(),
        smokingApi.getQuitProgress(),
      ]);
      setLogs(logsData);
      setStats(statsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to fetch smoking data:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addCigarette = async () => {
    try {
      await smokingApi.logCigarette({
        brand: brand || 'Unknown',
        cost_per_cigarette: parseFloat(cost) || 10,
        notes,
      });
      setBrand(''); setCost('10'); setNotes(''); setShowAdd(false);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to log cigarette');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smoking Tracker</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addText}>{showAdd ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.today?.count || 0}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.week?.count || 0}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.month?.count || 0}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        <View style={styles.quitCard}>
          <Text style={styles.quitTitle}>🏆 Quit Progress</Text>
          <View style={styles.quitRow}>
            <View style={styles.quitItem}>
              <Text style={styles.quitValue}>{progress?.smoke_free_hours || 0}h</Text>
              <Text style={styles.quitLabel}>Smoke-Free</Text>
            </View>
            <View style={styles.quitItem}>
              <Text style={styles.quitValue}>{progress?.cigarettes_avoided || 0}</Text>
              <Text style={styles.quitLabel}>Avoided</Text>
            </View>
            <View style={styles.quitItem}>
              <Text style={styles.quitValue}>₹{progress?.money_saved || 0}</Text>
              <Text style={styles.quitLabel}>Saved</Text>
            </View>
          </View>
        </View>

        <View style={styles.costCard}>
          <Text style={styles.costTitle}>💸 Total Cost</Text>
          <Text style={styles.costValue}>₹{stats?.month?.cost || 0}</Text>
          <Text style={styles.costSubtext}>This month • Avg {stats?.average_per_day || 0}/day</Text>
        </View>

        {showAdd && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.addForm}>
            <Text style={styles.formTitle}>Log Cigarette</Text>
            <TextInput style={styles.input} placeholder="Brand (e.g. Marlboro)" value={brand} onChangeText={setBrand} />
            <TextInput style={styles.input} placeholder="Cost per cigarette (₹)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
            <TextInput style={styles.input} placeholder="Notes" value={notes} onChangeText={setNotes} />
            <TouchableOpacity style={styles.saveBtn} onPress={addCigarette}>
              <Text style={styles.saveBtnText}>Log It</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}

        <Text style={styles.sectionTitle}>Recent Logs</Text>
        {logs.slice(0, 10).map((item) => (
          <View key={item._id} style={styles.logItem}>
            <Text style={{ fontSize: 24 }}>🚬</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemName}>{item.brand || 'Unknown'}</Text>
              <Text style={styles.itemMeta}>{item.date} at {item.time}</Text>
            </View>
            <Text style={styles.amount}>₹{item.cost_per_cigarette || 0}</Text>
          </View>
        ))}
        {logs.length === 0 && <Text style={styles.empty}>No logs yet</Text>}
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
  addText: { fontSize: 28, color: '#ff6b6b', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#ff6b6b' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  quitCard: { backgroundColor: '#10b981', margin: 12, padding: 20, borderRadius: 16 },
  quitTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  quitRow: { flexDirection: 'row', justifyContent: 'space-around' },
  quitItem: { alignItems: 'center' },
  quitValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  quitLabel: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 4 },
  costCard: { backgroundColor: '#ff6b6b', margin: 12, padding: 20, borderRadius: 16 },
  costTitle: { fontSize: 16, color: '#fff', opacity: 0.9 },
  costValue: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  costSubtext: { fontSize: 12, color: '#fff', opacity: 0.8, marginTop: 4 },
  addForm: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  input: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 8 },
  saveBtn: { backgroundColor: '#ff6b6b', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 16, marginHorizontal: 16, marginBottom: 8 },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 12, marginTop: 8, borderRadius: 12 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#ff6b6b' },
  empty: { textAlign: 'center', color: '#999', padding: 24, fontStyle: 'italic' },
});
