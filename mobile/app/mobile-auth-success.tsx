import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/constants/api';

export default function MobileAuthSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshAuth } = useAuth();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        console.log('📱 Mobile auth success page loaded');
        console.log('📱 Params:', params);
        
        const state = params.state as string;
        const error = params.error as string;

        if (error) {
          console.error('❌ OAuth error:', error);
          router.replace('/login');
          return;
        }

        if (!state) {
          console.error('❌ No state parameter found');
          router.replace('/login');
          return;
        }

        console.log('🔄 Starting token polling for state:', state);
        
        // Poll for OAuth result
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds max
        const pollInterval = 2000;
        
        while (attempts < maxAttempts) {
          try {
            attempts++;
            console.log(`📡 Polling attempt ${attempts}/${maxAttempts}`);
            
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
              console.log('📡 Polling response:', data);
              
              if (data.result?.accessToken) {
                const { accessToken, refreshToken } = data.result;
                
                console.log('✅ Received tokens!');
                
                // Save tokens
                await AsyncStorage.setItem('token', accessToken);
                if (refreshToken) {
                  await AsyncStorage.setItem('refreshToken', refreshToken);
                }
                
                console.log('✅ Tokens saved');
                
                // Đợi một chút để đảm bảo tokens được lưu hoàn toàn
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Refresh auth context
                try {
                  await refreshAuth();
                  console.log('✅ Auth context refreshed');
                } catch (refreshError) {
                  console.error('⚠️ Auth refresh error (non-critical):', refreshError);
                  // Nếu refresh auth fail, vẫn navigate vì tokens đã được lưu
                }
                
                // Navigate to home
                console.log('🏠 Navigating to home...');
                await AsyncStorage.removeItem('oauth_state');
                router.replace('/(tabs)');
                return;
              }
            }
            
            // Wait before next attempt
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
          } catch (pollError) {
            console.error(`❌ Polling error:`, pollError);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
          }
        }
        
        // Polling timeout
        console.error('❌ Polling timeout');
        router.replace('/login');
        
      } catch (error) {
        console.error('❌ Error in OAuth success handler:', error);
        router.replace('/login');
      }
    };

    handleOAuthSuccess();
  }, [params, router, refreshAuth]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkIcon}>✅</Text>
        </View>
        <Text style={styles.title}>Đăng nhập thành công!</Text>
        <ActivityIndicator size="large" color="#4f46e5" style={styles.loader} />
        <Text style={styles.text}>Đang chuyển đến trang chủ...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  checkmark: {
    marginBottom: 20,
  },
  checkmarkIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
