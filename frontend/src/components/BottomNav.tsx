import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = [
  { route: '/dashboard', label: 'Home', emoji: '🏠' },
  { route: '/food', label: 'Food', emoji: '🍽️' },
  { route: '/water', label: 'Water', emoji: '💧' },
  { route: '/weight', label: 'Weight', emoji: '⚖️' },
  { route: '/expenses', label: 'Expenses', emoji: '💰' },
  { route: '/more', label: 'More', emoji: '⋯' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const active = pathname === tab.route || (tab.route !== '/dashboard' && pathname.startsWith(tab.route));
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tab}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.emoji, active && styles.emojiActive]}>{tab.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
              {active && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  container: { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2 },
  emoji: { fontSize: 20, opacity: 0.5 },
  emojiActive: { opacity: 1 },
  label: { fontSize: 10, color: '#9ca3af', marginTop: 2, fontWeight: '600' },
  labelActive: { color: '#6366f1' },
  indicator: { position: 'absolute', top: 0, width: 24, height: 3, backgroundColor: '#6366f1', borderRadius: 2 },
});
