import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { authApi } from '../src/api/auth';

export default function ProfileScreen() {
  const { user, logout, loadUser } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [calorieGoal, setCalorieGoal] = useState(String(user?.goals?.daily_calories || 2000));
  const [weightGoal, setWeightGoal] = useState(String(user?.goals?.goal_weight || 70));
  const [waterGoal, setWaterGoal] = useState(String(user?.goals?.daily_water_ml || 2000));

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCalorieGoal(String(user.goals?.daily_calories || 2000));
      setWeightGoal(String(user.goals?.goal_weight || 70));
      setWaterGoal(String(user.goals?.daily_water_ml || 2000));
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      await authApi.updateProfile({
        name,
        goals: {
          daily_calories: parseInt(calorieGoal),
          goal_weight: parseFloat(weightGoal),
          daily_water_ml: parseInt(waterGoal),
        },
      });
      await loadUser();
      setEditing(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => editing ? saveProfile() : setEditing(true)}>
          <Text style={styles.editText}>{editing ? '✓' : '✎'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          {editing ? (
            <TextInput style={styles.nameInput} value={name} onChangeText={setName} />
          ) : (
            <Text style={styles.userName}>{user?.name}</Text>
          )}
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Goals</Text>
          
          <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>🔥 Daily Calories</Text>
            {editing ? (
              <TextInput style={styles.goalInput} value={calorieGoal} onChangeText={setCalorieGoal} keyboardType="numeric" />
            ) : (
              <Text style={styles.goalValue}>{calorieGoal} cal</Text>
            )}
          </View>

          <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>⚖️ Goal Weight</Text>
            {editing ? (
              <TextInput style={styles.goalInput} value={weightGoal} onChangeText={setWeightGoal} keyboardType="decimal-pad" />
            ) : (
              <Text style={styles.goalValue}>{weightGoal} kg</Text>
            )}
          </View>

          <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>💧 Daily Water</Text>
            {editing ? (
              <TextInput style={styles.goalInput} value={waterGoal} onChangeText={setWaterGoal} keyboardType="numeric" />
            ) : (
              <Text style={styles.goalValue}>{waterGoal} ml</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/ai-coach')}>
            <Text style={styles.menuText}>🤖 AI Health Coach</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/analytics')}>
            <Text style={styles.menuText}>📊 Analytics</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

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
  editText: { fontSize: 24, color: '#667eea', fontWeight: 'bold' },
  avatarContainer: { alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  nameInput: { fontSize: 22, fontWeight: 'bold', color: '#333', borderBottomWidth: 1, borderBottomColor: '#667eea', minWidth: 200, textAlign: 'center' },
  userEmail: { fontSize: 14, color: '#999', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  goalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  goalLabel: { fontSize: 15, color: '#333' },
  goalValue: { fontSize: 15, fontWeight: 'bold', color: '#667eea' },
  goalInput: { fontSize: 15, fontWeight: 'bold', color: '#667eea', borderBottomWidth: 1, borderBottomColor: '#667eea', minWidth: 80, textAlign: 'right' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  menuText: { fontSize: 15, color: '#333' },
  menuArrow: { fontSize: 20, color: '#999' },
  logoutButton: { backgroundColor: '#ff6b6b', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
});
