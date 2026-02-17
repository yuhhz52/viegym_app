import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_BASE_URL } from '@/constants/api';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, refreshAuth } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Clear expired tokens when login screen loads
  React.useEffect(() => {
    const clearExpiredTokens = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // Try to decode and check if expired
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const now = Math.floor(Date.now() / 1000);
              const isExpired = now > payload.exp;
              
              if (isExpired) {
                console.log('🧹 Token expired, clearing old tokens');
                await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
                console.log(' Expired tokens cleared');
              } else {
                console.log('ℹ Token still valid, keeping it');
              }
            }
          } catch (decodeError) {
            // Invalid token format, clear it
            console.log('🧹 Invalid token format, clearing');
            await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
          }
        } else {
          console.log('ℹ No token found');
        }
      } catch (error) {
        console.error('Error checking/clearing tokens:', error);
      }
    };
    clearExpiredTokens();
  }, []);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      setEmailError('Vui lòng nhập email');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Email không hợp lệ');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password validation
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Clear old tokens first
      console.log('🧹 Clearing old tokens before OAuth...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      
      // Generate state parameter to identify this OAuth request
      const mobileState = 'mobile_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      
      // OAuth URL with mobileState parameter
      const authUrl = `${API_BASE_URL}/oauth2/authorization/google?mobileState=${mobileState}`;
      
      console.log('🔐 Google OAuth: Starting authentication');
      console.log('📱 Mobile State:', mobileState);
      
      // Store state for polling
      await AsyncStorage.setItem('oauth_state', mobileState);
      
      // Open browser with WebBrowser
      const result = await WebBrowser.openBrowserAsync(authUrl);
      
      console.log('🌐 Browser result:', result);
      
      if (result.type === 'dismiss' || result.type === 'cancel') {
        console.log(' User dismissed OAuth');
        setIsGoogleLoading(false);
        return;
      }
      
      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Poll for OAuth result
      console.log('🔄 Starting polling...');
      
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 2000;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`📡 Polling attempt ${attempts}/${maxAttempts}`);
          
          const response = await fetch(
            `${API_BASE_URL}/api/mobile/auth/check-oauth?state=${mobileState}`,
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
            console.log('📡 OAuth polling response:', data);
            
            if (data.result?.accessToken) {
              const { accessToken, refreshToken } = data.result;
              
              console.log('✅ Received OAuth tokens!');
              
              // Save tokens to storage
              await AsyncStorage.setItem('token', accessToken);
              if (refreshToken) {
                await AsyncStorage.setItem('refreshToken', refreshToken);
              }
              
              console.log('✅ Tokens saved successfully');
              
              // Refresh auth context
              try {
                await refreshAuth();
                console.log('✅ Auth context refreshed');
              } catch (refreshError) {
                console.error('⚠️ Auth refresh error (non-critical):', refreshError);
              }
              
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
          console.error(`❌ Polling attempt ${attempts} error:`, pollError);
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        }
      }
      
      // Polling timeout
      console.error('❌ OAuth polling timeout');
      Alert.alert('Hết thời gian chờ', 'Không nhận được xác nhận từ Google. Vui lòng thử lại.');
      
    } catch (error: any) {
      console.error('❌ Google OAuth error:', error);
      Alert.alert('Lỗi đăng nhập', error.message || 'Không thể kết nối tới Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo và Header - Web Style */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="barbell" size={24} color="#fff" />
            </View>
            <Text style={styles.logoText}>VieGym</Text>
          </View>
          <Text style={styles.title}>Xin chào! Hãy bắt đầu nào</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục.</Text>
        </View>

        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>

          {/* Keep signed in & Forgot password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setKeepSignedIn(!keepSignedIn)}
            >
              <View style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}>
                {keepSignedIn && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Lưu đăng nhập</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Quên mật khẩu', 'Tính năng đang phát triển!')}>
              <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#4B5563" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4B5563" />
                <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Bạn chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Tạo tài khoản ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoCircle: {
    width: 40,
    height: 40,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  loginButton: {
    backgroundColor: '#EA580C',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#EA580C',
    fontWeight: '500',
  },
  googleButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#EA580C',
    fontWeight: '600',
  },
});
