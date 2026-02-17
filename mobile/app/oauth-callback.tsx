import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('OAuth callback params:', params);
      
      const state = params.state as string;
      
      if (!state) {
        console.error('No state parameter found');
        router.replace('/login');
        return;
      }

      // Poll backend để lấy OAuth result
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/mobile/auth/check-oauth?state=${state}`,
            { 
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log('OAuth check response:', data);
            
            if (data.result && data.result.accessToken) {
              // Save tokens
              await AsyncStorage.setItem('token', data.result.accessToken);
              if (data.result.refreshToken) {
                await AsyncStorage.setItem('refreshToken', data.result.refreshToken);
              }
              
              console.log('OAuth tokens saved successfully');
              
              // Navigate to home
              Alert.alert('Thành công!', 'Đăng nhập Google thành công!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
              ]);
              return;
            }
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
          attempts++;
        }
      }
      
      // Nếu không thành công sau maxAttempts
      Alert.alert('Lỗi', 'Không thể xác thực. Vui lòng thử lại.');
      router.replace('/login');
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra trong quá trình xác thực');
      router.replace('/login');
    }
  };

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background
    }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{
        marginTop: 16,
        fontSize: 16,
        color: colors.text
      }}>
        Đang xử lý đăng nhập...
      </Text>
    </View>
  );
}