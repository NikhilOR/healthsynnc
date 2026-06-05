import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import BottomNav from '../src/components/BottomNav';

const ITEMS = [
  { route: '/smoking', icon: '🚬', label: 'Smoking Tracker', desc: 'Track cigarettes & quit progress', color: '#ef4444' },
  { route: '/ai-coach', icon: '🤖', label: 'AI Health Coach', desc: 'Chat with Gemini AI', color: '#8b5cf6' },
  { route: '/analytics', icon: '📊', label: 'Analytics', desc: 'Health scores & insights', color: '#3b82f6' },
  { route: '/profile', icon: '👤', label: 'Profile', desc: 'Edit goals & settings', color: '#10b981' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>More</Text>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Features</Text>
        {ITEMS.map((item) => (
          <TouchableOpacity key={item.route} style={styles.item} onPress={() => router.push(item.route as any)}>
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  header: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#6366f1' },
  userName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  arrow: { fontSize: 24, color: '#9ca3af' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 12, letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemIcon: { fontSize: 22 },
  itemLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  logoutBtn: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, marginTop: 20, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
