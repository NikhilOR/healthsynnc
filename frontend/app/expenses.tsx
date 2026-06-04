import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { expensesApi } from '../src/api/expenses';

const CATEGORIES = ['food', 'groceries', 'fruits', 'vegetables', 'supplements', 'restaurant', 'drinks', 'other'];
const CATEGORY_ICONS: any = {
  food: '🍲', groceries: '🛒', fruits: '🍎', vegetables: '🥦',
  supplements: '💊', restaurant: '🍽️', drinks: '🥤', other: '💰'
};

export default function ExpensesScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<any>('food');
  const [notes, setNotes] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [logsData, summaryData] = await Promise.all([
        expensesApi.getExpenseLogs(undefined, 'monthly'),
        expensesApi.getSummary('monthly'),
      ]);
      setLogs(logsData);
      setSummary(summaryData);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addText}>{showAdd ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryValue}>₹{summary?.total || 0}</Text>
        <Text style={styles.summaryLabel}>This Month ({summary?.count || 0} entries)</Text>
      </View>

      {showAdd && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.addForm}>
          <TextInput style={styles.input} placeholder="Item name" value={itemName} onChangeText={setItemName} />
          <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
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
        </KeyboardAvoidingView>
      )}

      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item.category]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.item_name}</Text>
              <Text style={styles.itemMeta}>{item.category} • {item.date}</Text>
            </View>
            <Text style={styles.amount}>₹{item.amount}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No expenses yet. Tap + to add.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  backText: { fontSize: 24, color: '#333' },
  addText: { fontSize: 28, color: '#51cf66', fontWeight: 'bold' },
  summary: { backgroundColor: '#51cf66', padding: 24, alignItems: 'center' },
  summaryValue: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  addForm: { backgroundColor: '#fff', padding: 16, margin: 12, borderRadius: 12 },
  input: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', marginVertical: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f5f5f5', borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: '#51cf66' },
  categoryText: { fontSize: 13, color: '#333' },
  saveBtn: { backgroundColor: '#51cf66', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 12, marginTop: 8, borderRadius: 12 },
  categoryIcon: { fontSize: 28, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#51cf66' },
  empty: { textAlign: 'center', color: '#999', padding: 24, fontStyle: 'italic' },
});
