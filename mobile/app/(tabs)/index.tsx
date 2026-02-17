import { StyleSheet, ScrollView, View, Text, Pressable, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { StartWorkoutModal } from '@/components/StartWorkoutModal';
import { dashboardApi, workoutApi, communityApi, WorkoutProgramResponse, WorkoutSessionResponse, CommunityPost } from '@/services/api';
import { router } from 'expo-router';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [showStartWorkoutModal, setShowStartWorkoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard data state
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    totalTime: 0,
    weekStreak: 0,
  });
  const [recentSessions, setRecentSessions] = useState<WorkoutSessionResponse[]>([]);
  const [popularPrograms, setPopularPrograms] = useState<WorkoutProgramResponse[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Fetching dashboard data...');
      
      // Fetch all dashboard data
      const [statsData, sessionsData, programsData, postsData] = await Promise.all([
        dashboardApi.getDashboardStats().catch(() => ({
          totalWorkouts: 0,
          totalVolume: 0,
          totalTime: 0,
          weekStreak: 0,
        })),
        dashboardApi.getRecentSessions(3).catch(() => []),
        dashboardApi.getPopularPrograms(5).catch(() => []),
        communityApi.getAllPosts().catch((err) => {
          console.log('❌ Community posts error:', err);
          return [];
        }),
      ]);

      console.log('📊 Dashboard data fetched:', {
        stats: statsData,
        sessions: sessionsData.length,
        programs: programsData.length,
        posts: postsData.length,
        postsData: postsData, // Log full posts data
      });

      setStats(statsData);
      setRecentSessions(sessionsData);
      setPopularPrograms(programsData);
      setCommunityPosts(postsData.slice(0, 3)); // Show top 3 posts
      
      console.log('✅ Community posts set:', postsData.length);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      
      // Handle auth errors
      if (error?.isAuthError || error?.status === 401) {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu trang chủ');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data when screen comes into focus to sync like states
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  const handleStartWorkout = () => {
    setShowStartWorkoutModal(true);
  };

  const handleWorkoutStart = async (data: { programId?: string; notes?: string; sessionId?: string }) => {
    try {
      const { generateWorkoutName } = await import('@/services/api');
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const workoutName = data.notes || generateWorkoutName();
      
      // Create workout session via API
      const session = await workoutApi.createSession({
        programId: data.programId,
        sessionDate: new Date().toISOString(),
        durationMinutes: 0,
        notes: workoutName,
      });
      
      // Save to AsyncStorage (like web uses localStorage)
      await AsyncStorage.setItem('activeWorkout', JSON.stringify(session));
      await AsyncStorage.setItem('workoutStartTime', Date.now().toString());
      
      // Navigate to active workout screen
      router.push('/active-workout');
      Alert.alert('Đã bắt đầu tập!', `Buổi tập: ${workoutName}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu buổi tập');
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      console.log('❤️ [toggleLike] Post:', postId);
      const result = await communityApi.toggleLike(postId);
      
      // Update post in state
      setCommunityPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likeCount: result.likeCount, isLikedByCurrentUser: result.isLikedByCurrentUser }
          : post
      ));
      
      console.log('✅ [toggleLike] Success:', result);
    } catch (error) {
      console.error('❌ [toggleLike] Error:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác');
    }
  };

  const handleComment = (postId: string) => {
    console.log('🔍 [HOME] handleComment called with postId:', postId);
    try {
      // Try using href string format for dynamic routes
      const href = `/community-post-[id]?id=${postId}` as any;
      console.log('🔍 [HOME] Navigating to:', href);
      router.push(href);
      console.log('🔍 [HOME] Router.push completed');
    } catch (error) {
      console.error('❌ [HOME] Navigation error:', error);
      // Fallback: try object format
      router.push({
        pathname: '/community-post-[id]' as any,
        params: { id: postId }
      });
    }
  };

  const handleShare = (post: CommunityPost) => {
    Alert.alert(
      'Chia sẻ bài viết',
      `"${post.title || post.content.substring(0, 50)}..."`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Sao chép link', onPress: () => Alert.alert('Đã sao chép!') },
      ]
    );
  };

  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header - Lyfta Style */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trang chủ</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton}>
            <Text style={styles.streakIcon}>🔥</Text>
          </Pressable>
          {/* <Pressable style={styles.iconButton}>
            <Ionicons name="person-add-outline" size={24} color={colors.text} />
          </Pressable> */}
          <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Weekly Snapshot - Lyfta Style */}
        <View style={styles.snapshotSection}>
          <View style={styles.snapshotHeader}>
            <Text style={[styles.snapshotTitle, { color: colors.text }]}>Thống kê tuần này</Text>
            <Pressable onPress={() => router.push('/(tabs)/progress')}>
              <Text style={[styles.seeMore, { color: '#007AFF' }]}>Xem thêm</Text>
            </Pressable>
          </View>
          
          <View style={styles.snapshotStats}>
            <View style={styles.snapshotStat}>
              <Text style={[styles.snapshotValue, { color: colors.text }]}>{stats.totalWorkouts}</Text>
              <Text style={[styles.snapshotLabel, { color: colors.tabIconDefault }]}>Buổi tập</Text>
              <View style={styles.trendContainer}>
                <Ionicons name="caret-up" size={12} color="#9CA3AF" />
                <Text style={[styles.trendText, { color: colors.tabIconDefault }]}>0</Text>
              </View>
            </View>
            
            <View style={styles.snapshotStat}>
              <Text style={[styles.snapshotValue, { color: colors.text }]}>{Math.round(stats.totalTime)}phút</Text>
              <Text style={[styles.snapshotLabel, { color: colors.tabIconDefault }]}>Thời lượng</Text>
              <View style={styles.trendContainer}>
                <Ionicons name="caret-up" size={12} color="#9CA3AF" />
                <Text style={[styles.trendText, { color: colors.tabIconDefault }]}>0 phút</Text>
              </View>
            </View>
            
            <View style={styles.snapshotStat}>
              <Text style={[styles.snapshotValue, { color: colors.text }]}>{Math.round(stats.totalVolume)}kg</Text>
              <Text style={[styles.snapshotLabel, { color: colors.tabIconDefault }]}>Khối lượng</Text>
              <View style={styles.trendContainer}>
                <Ionicons name="caret-up" size={12} color="#9CA3AF" />
                <Text style={[styles.trendText, { color: colors.tabIconDefault }]}>0 kg</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Community Posts*/}
        {communityPosts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Cộng đồng
              </Text>
              <Pressable onPress={() => router.push('/community')}>
                <Text style={[styles.seeMore, { color: '#007AFF' }]}>Xem tất cả</Text>
              </Pressable>
            </View>
            
            {communityPosts.map((post) => (
              <View
                key={post.id}
                style={[styles.communityCard, { 
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                }]}
              >
                {/* Post Header */}
                <View style={styles.communityHeader}>
                  <View style={styles.communityAvatar}>
                    {post.authorAvatar ? (
                      <Image 
                        source={{ uri: post.authorAvatar }} 
                        style={styles.communityAvatarImage}
                      />
                    ) : (
                      <Text style={styles.communityAvatarText}>
                        {post.authorName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.communityAuthorInfo}>
                    <Text style={[styles.communityAuthor, { color: colors.text }]}>
                      {post.authorName}
                    </Text>
                    <Text style={[styles.communityDate, { color: colors.tabIconDefault }]}>
                      {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                
                {/* Post Title */}
                {post.title && (
                  <Text style={[styles.communityTitle, { color: colors.text }]}>
                    {post.title}
                  </Text>
                )}
                
                {/* Post Content */}
                <Text style={[styles.communityContent, { color: colors.tabIconDefault }]}>
                  {post.content}
                </Text>
                
                {/* Post Media */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <View style={styles.communityMediaContainer}>
                    {post.mediaUrls.length === 1 ? (
                      <Image
                        source={{ uri: post.mediaUrls[0] }}
                        style={styles.communitySingleImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communityMediaScroll}>
                        {post.mediaUrls.map((url, index) => (
                          <Image
                            key={index}
                            source={{ uri: url }}
                            style={styles.communityMultiImage}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
                
                {/* Stats - Like and Comment counts */}
                {(post.likeCount > 0 || post.commentCount > 0) && (
                  <View style={styles.communityStats}>
                    <View style={{ flex: 1 }}>
                      {post.likeCount > 0 && (
                        <View style={styles.statItem}>
                          <View style={styles.likeIconBadge}>
                            <Ionicons name="thumbs-up" size={10} color="#fff" />
                          </View>
                          <Text style={[styles.statText, { color: colors.tabIconDefault }]}>
                            {post.likeCount}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View>
                      {post.commentCount > 0 && (
                        <Text style={[styles.statText, { color: colors.tabIconDefault }]}>
                          {post.commentCount} bình luận
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                
                {/* Post Footer - Actions */}
                <View style={styles.communityFooter}>
                  <Pressable 
                    style={[
                      styles.communityAction,
                      post.isLikedByCurrentUser && styles.communityActionLiked,
                    ]}
                    onPress={() => handleToggleLike(post.id)}
                  >
                    <Ionicons 
                      name={post.isLikedByCurrentUser ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color={post.isLikedByCurrentUser ? "#EA580C" : colors.tabIconDefault} 
                    />
                    <Text style={[styles.communityActionText, { 
                      color: post.isLikedByCurrentUser ? "#EA580C" : colors.tabIconDefault 
                    }]}>
                      Thích
                    </Text>
                  </Pressable>
                  
                  <Pressable 
                    style={styles.communityAction}
                    onPress={() => handleComment(post.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={colors.tabIconDefault} />
                    <Text style={[styles.communityActionText, { color: colors.tabIconDefault }]}>
                      Bình luận
                    </Text>
                  </Pressable>
                  
                  <Pressable 
                    style={styles.communityAction}
                    onPress={() => handleShare(post)}
                  >
                    <Ionicons name="share-outline" size={20} color={colors.tabIconDefault} />
                    <Text style={[styles.communityActionText, { color: colors.tabIconDefault }]}>
                      Chia sẻ
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Safe area bottom padding for Android navigation bar + tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
      
      <StartWorkoutModal
        visible={showStartWorkoutModal}
        onClose={() => setShowStartWorkoutModal(false)}
        onStartWorkout={handleWorkoutStart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  snapshotSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  snapshotTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeMore: {
    fontSize: 14,
    fontWeight: '500',
  },
  snapshotStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  snapshotStat: {
    flex: 1,
  },
  snapshotValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  snapshotLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 11,
  },
  newsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  newsCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  newsLogo: {
    width: 40,
    height: 40,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  newsLogoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  newsInfo: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  newsDate: {
    fontSize: 12,
  },
  newsHeadline: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  newsContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  readMore: {
    fontSize: 14,
  },
  quickActions: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 15,
    fontWeight: '600',
  },
  communityCard: {
    marginBottom: 16,
    borderBottomWidth: 0,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  communityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  communityAvatarImage: {
    width: '100%',
    height: '100%',
  },
  communityAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  communityAuthorInfo: {
    flex: 1,
  },
  communityAuthor: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  communityDate: {
    fontSize: 11,
  },
  communityTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  communityContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  communityMediaContainer: {
    marginVertical: 12,
    borderBottomWidth: 0,
  },
  communitySingleImage: {
    width: '100%',
    height: 350,
  },
  communityMediaScroll: {
  },
  communityMultiImage: {
    width: 280,
    height: 280,
    marginRight: 8,
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
  },
  communityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  communityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    flex: 1,
    borderRadius: 8,
  },
  communityActionLiked: {
    backgroundColor: '#FFF7ED',
  },
  communityActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  quoteCard: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quoteIcon: {
    fontSize: 24,
  },
  quoteText: {
    flex: 1,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    fontWeight: '500',
  },
});
