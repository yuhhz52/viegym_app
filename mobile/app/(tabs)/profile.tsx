import { StyleSheet, ScrollView, View, Text, Pressable, Alert, TextInput, Modal, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { authApi, type UserInfo } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user: contextUser, logout, login } = useAuth();
  
  const [user, setUser] = useState<UserInfo | null>(contextUser);
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: '',
    birthDate: '',
    heightCm: '',
    weightKg: '',
    bodyFatPercent: '',
    experienceLevel: '',
    goal: '',
  });
  
  const [goalsData, setGoalsData] = useState({
    dailyCalorieGoal: 2000,
    dailyWaterGoal: 8,
    dailyWorkoutMins: 60,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await authApi.getMyInfo();
      setUser(data);
      setFormData({
        fullName: data.fullName || '',
        phone: data.phone || '',
        gender: data.gender || '',
        birthDate: data.birthDate || '',
        heightCm: data.heightCm?.toString() || '',
        weightKg: data.weightKg?.toString() || '',
        bodyFatPercent: data.bodyFatPercent?.toString() || '',
        experienceLevel: data.experienceLevel || '',
        goal: data.goal || '',
      });
      setGoalsData({
        dailyCalorieGoal: data.dailyCalorieGoal || 2000,
        dailyWaterGoal: data.dailyWaterGoal || 8,
        dailyWorkoutMins: data.dailyWorkoutMins || 60,
      });
    } catch (err) {
      console.error('Failed to load user info:', err);
      setError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Yêu cầu quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleAvatarUpload(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleAvatarUpload = async (uri: string) => {
    try {
      setUploading(true);
      setError(null);
      
      console.log('[Profile] Starting avatar upload...');
      console.log('[Profile] Image URI:', uri);
      
      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      console.log('[Profile] Filename:', filename);
      console.log('[Profile] Type:', type);
      
      // Append file to form data with correct format for React Native
      formData.append('file', {
        uri: uri,
        name: filename,
        type: type,
      } as any);

      console.log('[Profile] Sending request to update avatar...');
      const updatedUser = await authApi.updateAvatar(formData);
      console.log('[Profile] Avatar updated successfully:', updatedUser.avatarUrl || updatedUser.avatar);
      
      // Update user state and reload data to get latest avatar URL
      setUser(updatedUser);
      await loadUserData(); // Reload to ensure we have the latest data
      
      setSuccess('Ảnh đại diện đã được cập nhật!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('[Profile] Failed to upload avatar:', err);
      console.error('[Profile] Error details:', err.message || err);
      setError(`Lỗi khi tải lên ảnh đại diện: ${err.message || 'Vui lòng thử lại'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const profileData: Partial<UserInfo> = {
        fullName: formData.fullName,
        phone: formData.phone,
        gender: formData.gender,
        birthDate: formData.birthDate,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        bodyFatPercent: formData.bodyFatPercent ? parseFloat(formData.bodyFatPercent) : undefined,
        experienceLevel: formData.experienceLevel,
        goal: formData.goal,
      };
      
      const updated = await authApi.updateProfile(profileData);
      setUser(updated);
      setEditingProfile(false);
      setSuccess('Hồ sơ đã được cập nhật!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Lỗi khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await authApi.updateDailyGoals(goalsData);
      setUser(updated);
      setEditingGoals(false);
      setSuccess('Mục tiêu đã được cập nhật!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to update goals:', err);
      setError('Lỗi khi cập nhật mục tiêu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              console.error('Logout failed:', error);
            }
          },
        },
      ]
    );
  };

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      return user.avatarUrl.startsWith('http')
        ? user.avatarUrl
        : `http://localhost:8080/media/${user.avatarUrl}`;
    }
    if (user?.avatar) {
      return user.avatar.startsWith('http')
        ? user.avatar
        : `http://localhost:8080/media/${user.avatar}`;
    }
    return null;
  };

  const getInitials = () => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  if (!user && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Không tìm thấy người dùng</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Hồ Sơ Của Tôi</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Messages */}
        {error && (
          <View style={[styles.messageBox, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.messageText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
        {success && (
          <View style={[styles.messageBox, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.messageText, { color: colors.success }]}>{success}</Text>
          </View>
        )}

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <Pressable onPress={handleImagePick} disabled={uploading}>
              <View style={[styles.avatarContainer, { borderColor: colors.border }]}>
                {getAvatarUrl() ? (
                  <Image 
                    source={{ uri: getAvatarUrl()! }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{getInitials()}</Text>
                  </View>
                )}
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
                  <Text style={styles.cameraIconText}>+</Text>
                </View>
              </View>
            </Pressable>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName}</Text>
              <Text style={[styles.userEmail, { color: colors.tabIconDefault }]}>{user?.email}</Text>
              <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {user?.experienceLevel || 'Chưa cập nhật'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {user?.gender || 'Chưa cập nhật'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable 
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setEditingProfile(true)}
          >
            <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
          </Pressable>
        </View>

        {/* Stats Cards */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thống Kê</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{user?.totalWorkouts || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Buổi tập</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{user?.totalVolume || 0}kg</Text>
              <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Tổng volume</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{user?.streakDays || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Chuỗi ngày</Text>
            </View>
          </View>
        </View>

        {/* Daily Goals */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mục Tiêu Hằng Ngày</Text>
            <Pressable onPress={() => setEditingGoals(true)}>
              <Text style={[styles.editLink, { color: colors.primary }]}>Chỉnh sửa</Text>
            </Pressable>
          </View>
          <View style={styles.goalsList}>
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.tabIconDefault }]}>Calo</Text>
              <Text style={[styles.goalValue, { color: colors.text }]}>{user?.dailyCalorieGoal || 2000} kcal</Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.tabIconDefault }]}>Nước</Text>
              <Text style={[styles.goalValue, { color: colors.text }]}>{user?.dailyWaterGoal || 8} ly</Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.tabIconDefault }]}>Tập luyện</Text>
              <Text style={[styles.goalValue, { color: colors.text }]}>{user?.dailyWorkoutMins || 60} phút</Text>
            </View>
          </View>
        </View>

        {/* Body Stats */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Chỉ Số Cơ Thể</Text>
          <View style={styles.bodyStatsGrid}>
            <View style={styles.bodyStatItem}>
              <Text style={[styles.bodyStatLabel, { color: colors.tabIconDefault }]}>Chiều cao</Text>
              <Text style={[styles.bodyStatValue, { color: colors.text }]}>
                {user?.heightCm ? `${user.heightCm} cm` : 'Chưa cập nhật'}
              </Text>
            </View>
            <View style={styles.bodyStatItem}>
              <Text style={[styles.bodyStatLabel, { color: colors.tabIconDefault }]}>Cân nặng</Text>
              <Text style={[styles.bodyStatValue, { color: colors.text }]}>
                {user?.weightKg ? `${user.weightKg} kg` : 'Chưa cập nhật'}
              </Text>
            </View>
            <View style={styles.bodyStatItem}>
              <Text style={[styles.bodyStatLabel, { color: colors.tabIconDefault }]}>Tỉ lệ mỡ</Text>
              <Text style={[styles.bodyStatValue, { color: colors.text }]}>
                {user?.bodyFatPercent ? `${user.bodyFatPercent}%` : 'Chưa cập nhật'}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable 
          style={[styles.logoutButton, { 
            borderColor: colors.error,
            backgroundColor: colors.error + '10',
          }]} 
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Đăng xuất</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={editingProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chỉnh sửa hồ sơ</Text>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.tabIconDefault }]}>Họ và tên</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    color: colors.text,
                    backgroundColor: colors.background 
                  }]}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.tabIconDefault }]}>Số điện thoại</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    color: colors.text,
                    backgroundColor: colors.background 
                  }]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.tabIconDefault }]}>Chiều cao (cm)</Text>
                  <TextInput
                    style={[styles.input, { 
                      borderColor: colors.border, 
                      color: colors.text,
                      backgroundColor: colors.background 
                    }]}
                    value={formData.heightCm}
                    onChangeText={(text) => setFormData({ ...formData, heightCm: text })}
                    keyboardType="numeric"
                    placeholderTextColor={colors.tabIconDefault}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.tabIconDefault }]}>Cân nặng (kg)</Text>
                  <TextInput
                    style={[styles.input, { 
                      borderColor: colors.border, 
                      color: colors.text,
                      backgroundColor: colors.background 
                    }]}
                    value={formData.weightKg}
                    onChangeText={(text) => setFormData({ ...formData, weightKg: text })}
                    keyboardType="numeric"
                    placeholderTextColor={colors.tabIconDefault}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.tabIconDefault }]}>Tỉ lệ mỡ (%)</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    color: colors.text,
                    backgroundColor: colors.background 
                  }]}
                  value={formData.bodyFatPercent}
                  onChangeText={(text) => setFormData({ ...formData, bodyFatPercent: text })}
                  keyboardType="numeric"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>

              <View style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveProfile}
                  disabled={loading}
                >
                  <Text style={styles.modalButtonText}>
                    {loading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                  </Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, { 
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.border 
                  }]}
                  onPress={() => setEditingProfile(false)}
                  disabled={loading}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>❌ Hủy</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Goals Edit Modal */}
      <Modal
        visible={editingGoals}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingGoals(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Chỉnh sửa mục tiêu</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.tabIconDefault }]}>Mục tiêu calo hằng ngày</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  color: colors.text,
                  backgroundColor: colors.background 
                }]}
                value={goalsData.dailyCalorieGoal.toString()}
                onChangeText={(text) => setGoalsData({ ...goalsData, dailyCalorieGoal: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.tabIconDefault }]}>Số ly nước hằng ngày</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  color: colors.text,
                  backgroundColor: colors.background 
                }]}
                value={goalsData.dailyWaterGoal.toString()}
                onChangeText={(text) => setGoalsData({ ...goalsData, dailyWaterGoal: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.tabIconDefault }]}>Thời gian tập (phút)</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  color: colors.text,
                  backgroundColor: colors.background 
                }]}
                value={goalsData.dailyWorkoutMins.toString()}
                onChangeText={(text) => setGoalsData({ ...goalsData, dailyWorkoutMins: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveGoals}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, { 
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.border 
                }]}
                onPress={() => setEditingGoals(false)}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Hủy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconText: {
    fontSize: 14,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalsList: {
    gap: 12,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  bodyStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  bodyStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  bodyStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  modalButtons: {
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});