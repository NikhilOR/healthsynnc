import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { waterApi } from '../src/api/water';

export default function WaterScreen() {
  const [totalWater, setTotalWater] = React.useState(0);
  const [goal, setGoal] = React.useState(2000);
  const router = useRouter();

  const fetchWaterProgress = async () => {
    try {
      const data = await waterApi.getDailyProgress();
      setTotalWater(data.total);
      setGoal(data.goal);
    } catch (error) {
      console.error('Failed to fetch water progress:', error);
    }
  };

  React.useEffect(() => {
    fetchWaterProgress();
  }, []);

  const logWater = async (amount) => {
    try {
      await waterApi.logWater(amount);
      fetchWaterProgress();
    } catch (error) {
      console.error('Failed to log water:', error);
    }
  };

  const percentage = Math.min(100, (totalWater / goal) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: '#333' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Water Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Progress Circle */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressValue}>{totalWater}ml</Text>
            <Text style={styles.progressLabel}>of {goal}ml</Text>
            <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddContainer}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => logWater(250)}
            >
              <Text style={{ fontSize: 36 }}>💧</Text>
              <Text style={styles.buttonText}>250ml</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => logWater(500)}
            >
              <Text style={{ fontSize: 36 }}>💧</Text>
              <Text style={styles.buttonText}>500ml</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => logWater(750)}
            >
              <Text style={{ fontSize: 36 }}>💧</Text>
              <Text style={styles.buttonText}>750ml</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => logWater(1000)}
            >
              <Text style={{ fontSize: 36 }}>💧</Text>
              <Text style={styles.buttonText}>1000ml</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    padding: 32,
    alignItems: 'center',
  },
  progressCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 12,
    borderColor: '#4dabf7',
  },
  progressValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4dabf7',
    marginTop: 8,
  },
  quickAddContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  waterButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
});
