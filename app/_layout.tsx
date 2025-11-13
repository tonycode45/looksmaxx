import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { theme } from '@/config/theme';
import { strings } from '@/config/strings';
import { useStore } from '@/state/useStore';
import { OnboardingModal } from '@/components/OnboardingModal';

export default function RootLayout() {
  const { init, hasConsented } = useStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    init()
      .then(() => {
        setIsInitializing(false);
        if (!hasConsented) {
          setShowOnboarding(true);
        }
      })
      .catch((error) => {
        console.error('Error initializing app:', error);
        setIsInitializing(false);
        // Don't block the UI if initialization fails
      });
  }, []);

  useEffect(() => {
    if (hasConsented) {
      setShowOnboarding(false);
    }
  }, [hasConsented]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading MirrorMe...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: strings.nav.home,
            tabBarIcon: ({ color }) => (
              <TabIcon name="home" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: strings.nav.progress,
            tabBarIcon: ({ color }) => (
              <TabIcon name="progress" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: strings.nav.settings,
            tabBarIcon: ({ color }) => (
              <TabIcon name="settings" color={color} />
            ),
          }}
        />
      </Tabs>
      <OnboardingModal visible={showOnboarding} onAccept={() => setShowOnboarding(false)} />
    </>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  // Simple placeholder icons - in production you'd use react-native-vector-icons
  return <View style={[styles.icon, { backgroundColor: color, opacity: 0.3 }]} />;
}

const styles = StyleSheet.create({
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.base,
  },
});
