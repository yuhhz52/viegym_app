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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '@/constants/api';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { refreshAuth } = useAuth();
  const router = useRouter();

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleRegister = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Lưu ý', 'Vui lòng đồng ý với Điều khoản & Điều kiện');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      } else {
        Alert.alert('Lỗi đăng ký', data.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể kết nối đến server');
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
      
      // Generate state parameter
      const mobileState = 'mobile_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      const authUrl = `${API_BASE_URL}/oauth2/authorization/google?mobileState=${mobileState}`;
      
      console.log('🔐 Google OAuth: Starting authentication');
      await AsyncStorage.setItem('oauth_state', mobileState);
      
      // Open browser
      const result = await WebBrowser.openBrowserAsync(authUrl);
      
      if (result.type === 'dismiss' || result.type === 'cancel') {
        console.log('❌ User dismissed OAuth browser');
        setIsGoogleLoading(false);
        return;
      }
      
      // Wait and poll for result
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
            
            if (data.result?.accessToken) {
              const { accessToken, refreshToken } = data.result;
              
              await AsyncStorage.setItem('token', accessToken);
              if (refreshToken) {
                await AsyncStorage.setItem('refreshToken', refreshToken);
              }
              
              console.log('✅ Tokens saved successfully');
              
              try {
                await refreshAuth();
              } catch (refreshError) {
                console.error('⚠️ Auth refresh error (non-critical):', refreshError);
              }
              
              await AsyncStorage.removeItem('oauth_state');
              router.replace('/(tabs)');
              return;
            }
          }
          
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
        {/* Logo và Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="barbell" size={24} color="#fff" />
            </View>
            <Text style={styles.logoText}>VieGym+</Text>
          </View>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>Đăng ký để bắt đầu</Text>
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

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>ĐĂNG KÝ</Text>
            )}
          </TouchableOpacity>

          {/* Terms & Conditions */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  Bằng cách đăng ký, bạn đồng ý với{' '}
                  <Text style={styles.termsLink}>Điều khoản & Điều kiện</Text>
                  {' '}và{' '}
                  <Text style={styles.termsLink}>Chính sách Bảo mật</Text>
                  {' '}của chúng tôi
                </Text>
              </View>
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

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  logoCircle: {
    width: 40,
    height: 40,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'System',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
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
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
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
    color: '#1f2937',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  registerButton: {
    backgroundColor: '#EA580C',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  termsContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  termsLink: {
    color: '#EA580C',
    textDecorationLine: 'underline',
  },
  googleButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#EA580C',
    fontWeight: '500',
  },
});
