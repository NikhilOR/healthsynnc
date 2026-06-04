import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { weightApi } from '../../src/api/weight';

export default function AddWeightScreen() {
  const [weight, setWeight] = React.useState('');
  const [bodyFat, setBodyFat] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const router = useRouter();

  const handleSave = async () => {
    if (!weight) {
      Alert.alert('Error', 'Please enter your weight');
      return;
    }

    try {
      await weightApi.logWeight({
        weight_kg: parseFloat(weight),
        body_fat_percent: bodyFat ? parseFloat(bodyFat) : undefined,
        notes,
      });
      Alert.alert('Success', 'Weight logged successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to log weight');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Weight</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your weight"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Body Fat % (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter body fat percentage"
            value={bodyFat}
            onChangeText={setBodyFat}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Weight</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
