import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { foodApi } from '../../src/api/food';

export default function AddFoodScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [foodItems, setFoodItems] = React.useState<any[]>([]);
  const [selectedMealType, setSelectedMealType] = React.useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showCustom, setShowCustom] = React.useState(false);
  // Custom food
  const [cName, setCName] = React.useState('');
  const [cCalories, setCCalories] = React.useState('');
  const [cProtein, setCProtein] = React.useState('');
  const [cCarbs, setCCarbs] = React.useState('');
  const [cFat, setCFat] = React.useState('');
  const [cServing, setCServing] = React.useState('1 serving');
  const router = useRouter();

  const searchFood = async (query: string) => {
    try {
      const items = await foodApi.searchFoodItems(query);
      setFoodItems(items);
    } catch (error) {
      console.error('Failed to search food:', error);
    }
  };

  React.useEffect(() => {
    searchFood(searchQuery);
  }, [searchQuery]);

  const logFood = async (foodItem: any) => {
    try {
      await foodApi.createFoodLog({
        food_item_id: foodItem._id,
        meal_type: selectedMealType,
        quantity: 1,
      });
      Alert.alert('✅ Logged', `${foodItem.name} added to ${selectedMealType}`);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to log food');
    }
  };

  const createCustomFood = async () => {
    if (!cName || !cCalories) {
      Alert.alert('Error', 'Name and calories are required');
      return;
    }
    try {
      const newFood = await foodApi.createFoodItem({
        name: cName,
        serving_size: cServing,
        calories: parseFloat(cCalories),
        protein: parseFloat(cProtein) || 0,
        carbs: parseFloat(cCarbs) || 0,
        fat: parseFloat(cFat) || 0,
      });
      // Log it immediately
      await foodApi.createFoodLog({
        food_item_id: newFood.id || newFood._id,
        meal_type: selectedMealType,
        quantity: 1,
      });
      Alert.alert('✅ Created & Logged', `${cName} added to ${selectedMealType}`);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create food');
    }
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', emoji: '☀️' },
    { key: 'lunch', label: 'Lunch', emoji: '🍽️' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙' },
    { key: 'snack', label: 'Snack', emoji: '🍪' },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food</Text>
        <TouchableOpacity onPress={() => setShowCustom(!showCustom)}>
          <Text style={styles.customToggle}>{showCustom ? 'Search' : 'Custom'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.mealTypeContainer}>
        {mealTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[styles.mealTypeButton, selectedMealType === type.key && styles.mealTypeButtonActive]}
            onPress={() => setSelectedMealType(type.key as any)}
          >
            <Text style={{ fontSize: 20 }}>{type.emoji}</Text>
            <Text style={[styles.mealTypeText, selectedMealType === type.key && styles.mealTypeTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showCustom ? (
        <ScrollView style={styles.customForm} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.formTitle}>🧪 Create Custom Food</Text>
          <Text style={styles.formSubtitle}>Enter your own food details</Text>

          <Text style={styles.label}>Food Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Homemade Pasta" value={cName} onChangeText={setCName} />

          <Text style={styles.label}>Serving Size</Text>
          <TextInput style={styles.input} placeholder="e.g. 1 plate (200g)" value={cServing} onChangeText={setCServing} />

          <Text style={styles.label}>Calories *</Text>
          <TextInput style={styles.input} placeholder="e.g. 350" value={cCalories} onChangeText={setCCalories} keyboardType="decimal-pad" />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput style={styles.input} placeholder="0" value={cProtein} onChangeText={setCProtein} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput style={styles.input} placeholder="0" value={cCarbs} onChangeText={setCCarbs} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput style={styles.input} placeholder="0" value={cFat} onChangeText={setCFat} keyboardType="decimal-pad" />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={createCustomFood}>
            <Text style={styles.saveBtnText}>Create & Log Food</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search food items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={foodItems}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.foodItem} onPress={() => logFood(item)}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodServing}>{item.serving_size}</Text>
                </View>
                <View style={styles.foodStats}>
                  <Text style={styles.foodCalories}>{item.calories}</Text>
                  <Text style={styles.foodCaloriesLabel}>cal</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={styles.empty}>No food items found</Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowCustom(true)}>
                  <Text style={styles.createBtnText}>+ Create Custom Food</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  backText: { fontSize: 24, color: '#333' },
  customToggle: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  mealTypeContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff' },
  mealTypeButton: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10, backgroundColor: '#f5f5f5', marginHorizontal: 3 },
  mealTypeButtonActive: { backgroundColor: '#6366f1' },
  mealTypeText: { fontSize: 11, color: '#666', marginTop: 4, fontWeight: '600' },
  mealTypeTextActive: { color: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, height: 46, fontSize: 15 },
  listContent: { padding: 16 },
  foodItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  foodServing: { fontSize: 12, color: '#9ca3af' },
  foodStats: { alignItems: 'flex-end', justifyContent: 'center' },
  foodCalories: { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  foodCaloriesLabel: { fontSize: 11, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', marginBottom: 16 },
  createBtn: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  createBtnText: { color: '#fff', fontWeight: '700' },
  customForm: { flex: 1 },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  formSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, fontSize: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
