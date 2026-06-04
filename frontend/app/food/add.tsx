import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { foodApi } from '../../src/api/food';

export default function AddFoodScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [foodItems, setFoodItems] = React.useState<any[]>([]);
  const [selectedMealType, setSelectedMealType] = React.useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
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
    searchFood(searchQuery.length > 0 ? searchQuery : '');
  }, [searchQuery]);

  const logFood = async (foodItem: any) => {
    try {
      await foodApi.createFoodLog({
        food_item_id: foodItem._id,
        meal_type: selectedMealType,
        quantity: 1,
      });
      Alert.alert('Success', 'Food logged successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to log food');
    }
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', emoji: '☀️' },
    { key: 'lunch', label: 'Lunch', emoji: '🍽️' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙' },
    { key: 'snack', label: 'Snack', emoji: '🍪' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food</Text>
        <View style={{ width: 24 }} />
      </View>

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
              {item.brand && <Text style={styles.foodBrand}>{item.brand}</Text>}
              <Text style={styles.foodServing}>{item.serving_size}</Text>
            </View>
            <View style={styles.foodStats}>
              <Text style={styles.foodCalories}>{item.calories}</Text>
              <Text style={styles.foodCaloriesLabel}>cal</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No food items found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  backText: { fontSize: 24, color: '#333' },
  mealTypeContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', marginBottom: 8 },
  mealTypeButton: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12, backgroundColor: '#f5f5f5', marginHorizontal: 4 },
  mealTypeButtonActive: { backgroundColor: '#667eea' },
  mealTypeText: { fontSize: 11, color: '#666', marginTop: 4, fontWeight: '600' },
  mealTypeTextActive: { color: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 16, borderRadius: 12, elevation: 2 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16 },
  listContent: { padding: 16 },
  foodItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  foodBrand: { fontSize: 13, color: '#666', marginBottom: 2 },
  foodServing: { fontSize: 12, color: '#999' },
  foodStats: { alignItems: 'flex-end', justifyContent: 'center' },
  foodCalories: { fontSize: 20, fontWeight: 'bold', color: '#ff6b6b' },
  foodCaloriesLabel: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', color: '#999', padding: 24, fontStyle: 'italic' },
});
