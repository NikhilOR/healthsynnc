import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { expensesApi } from '../src/api/expenses';
import { chartsApi } from '../src/api/charts';
import BottomNav from '../src/components/BottomNav';
import WeeklyChart from '../src/components/WeeklyChart';

const CATEGORIES = ['food', 'groceries', 'fruits', 'vegetables', 'supplements', 'restaurant', 'drinks', 'other'];
const CATEGORY_ICONS: any = {
  food: '🍲', groceries: '🛒', fruits: '🍎', vegetables: '🥦',
  supplements: '💊', restaurant: '🍽️', drinks: '🥤', other: '💰'
};

export default function ExpensesScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<any>('food');
  const [notes, setNotes] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [logsData, summaryData, chart] = await Promise.all([
        expensesApi.getExpenseLogs(undefined, 'monthly'),
        expensesApi.getSummary('monthly'),
        chartsApi.expensesWeekly(),
      ]);
      setLogs(logsData);
      setSummary(summaryData);
      setChartData(chart);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addExpense = async () => {
    if (!itemName || !amount) {
      Alert.alert('Error', 'Please fill in item name and amount');
      return;
    }
    try {
      await expensesApi.logExpense({
        item_name: itemName,
        amount: parseFloat(amount),
        category,
        notes,
      });
      setItemName(''); setAmount(''); setNotes(''); setShowAdd(false);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💰 Expenses</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addText}>{showAdd ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={styles.summary}>
          <Text style={styles.summaryValue}>₹{summary?.total || 0}</Text>
          <Text style={styles.summaryLabel}>This Month • {summary?.count || 0} entries</Text>
        </View>

        {showAdd && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Add Expense</Text>
            <TextInput style={styles.input} placeholder="Item name (e.g. Vegetables)" value={itemName} onChangeText={setItemName} />
            <TextInput style={styles.input} placeholder="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.categoryChip, category === cat && styles.categoryChipActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.categoryText, category === cat && { color: '#fff' }]}>{CATEGORY_ICONS[cat]} {cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={styles.input} placeholder="Notes (optional)" value={notes} onChangeText={setNotes} />
            <TouchableOpacity style={styles.saveBtn} onPress={addExpense}>
              <Text style={styles.saveBtnText}>Save Expense</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ paddingHorizontal: 16 }}>
          <WeeklyChart
            labels={chartData.labels}
            data={chartData.data}
            color="#10b981"
            unit="₹"
            title="📊 Last 7 Days Spending"
          />
        </View>

        <Text style={[styles.sectionTitle, { marginLeft: 16 }]}>Recent Expenses</Text>
        {logs.length === 0 ? (
          <Text style={styles.empty}>No expenses yet. Tap + to add.</Text>
        ) : (
          logs.map((item) => (
            <View key={item._id} style={styles.logItem}>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item.category]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemMeta}>{item.category} • {item.date}</Text>
              </View>
              <Text style={styles.amount}>₹{item.amount}</Text>
            </View>
          ))
        )}
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
  addText: { fontSize: 28, color: '#10b981', fontWeight: 'bold' },
  summary: { backgroundColor: '#10b981', padding: 24, alignItems: 'center' },
  summaryValue: { fontSize: 42, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 13, color: '#fff', opacity: 0.9, marginTop: 4 },
  addForm: { backgroundColor: '#fff', padding: 16, margin: 12, borderRadius: 14 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  input: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, marginBottom: 8, fontSize: 14 },
  categoryRow: { marginVertical: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
  categoryChipActive: { backgroundColor: '#10b981' },
  categoryText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  saveBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 8 },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, marginHorizontal: 12, marginTop: 8, borderRadius: 12 },
  categoryIcon: { fontSize: 26, marginRight: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 24, fontStyle: 'italic' },
});
