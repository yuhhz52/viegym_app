import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
      
      // Parse deep link
      const { hostname, path, queryParams } = Linking.parse(url);
      
      if (path === 'mobile-auth-success') {
        console.log('OAuth success callback received');
        // Navigate to mobile auth success screen
        router.push({
          pathname: '/mobile-auth-success',
          params: queryParams || {}
        });
      }
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with URL:', url);
        const { path, queryParams } = Linking.parse(url);
        
        if (path === 'mobile-auth-success') {
          router.push({
            pathname: '/mobile-auth-success',
            params: queryParams || {}
          });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="mobile-auth-success" />
        <Stack.Screen 
          name="(tabs)" 
          options={{
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="community" />
        <Stack.Screen name="active-workout" />
        <Stack.Screen name="program-detail" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
