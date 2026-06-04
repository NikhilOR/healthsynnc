import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { isAuthenticated, loadUser } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      await loadUser();
      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
