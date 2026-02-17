import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { communityApi, CommunityPost } from '@/services/api';

export default function CommunityScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  // Refresh data when screen comes into focus to sync like states
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await communityApi.getAllPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const handleToggleLike = async (postId: string) => {
    try {
      const result = await communityApi.toggleLike(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likeCount: result.likeCount, isLikedByCurrentUser: result.isLikedByCurrentUser }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác');
    }
  };

  const handleComment = (postId: string) => {
    console.log('🔍 [COMMUNITY] handleComment called with postId:', postId);
    try {
      // Try using href string format for dynamic routes
      const href = `/community-post-[id]?id=${postId}` as any;
      console.log('🔍 [COMMUNITY] Navigating to:', href);
      router.push(href);
      console.log('🔍 [COMMUNITY] Router.push completed');
    } catch (error) {
      console.error('❌ [COMMUNITY] Navigation error:', error);
      // Fallback: try object format
      router.push({
        pathname: '/community-post-[id]' as any,
        params: { id: postId }
      });
    }
  };

  const handlePostPress = (postId: string) => {
    console.log('🔍 [COMMUNITY] handlePostPress called with postId:', postId);
    handleComment(postId);
  };

  const handleCreatePost = () => {
    Alert.alert('Tạo bài viết', 'Tính năng đang phát triển');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cộng đồng</Text>
        <Pressable onPress={handleCreatePost} style={styles.createButton}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              Chưa có bài viết nào
            </Text>
            <Pressable
              style={[styles.createFirstButton, { backgroundColor: colors.primary }]}
              onPress={handleCreatePost}
            >
              <Text style={styles.createFirstButtonText}>Tạo bài viết đầu tiên</Text>
            </Pressable>
          </View>
        ) : (
          posts.map((post) => (
            <Pressable
              key={post.id}
              style={[styles.postCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => handlePostPress(post.id)}
            >
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.authorAvatar}>
                  {post.authorAvatar ? (
                    <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatarImage} />
                  ) : (
                    <Text style={styles.authorAvatarText}>
                      {post.authorName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.authorInfo}>
                  <Text style={[styles.authorName, { color: colors.text }]}>{post.authorName}</Text>
                  <Text style={[styles.postDate, { color: colors.tabIconDefault }]}>
                    {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {/* Post Title */}
              {post.title && (
                <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
                  {post.title}
                </Text>
              )}

              {/* Post Content */}
              <Text style={[styles.postContent, { color: colors.tabIconDefault }]} numberOfLines={3}>
                {post.content}
              </Text>

              {/* Post Media */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <View style={styles.mediaContainer}>
                  <Image
                    source={{ uri: post.mediaUrls[0] }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  {post.mediaUrls.length > 1 && (
                    <View style={styles.moreMediaBadge}>
                      <Text style={styles.moreMediaText}>+{post.mediaUrls.length - 1}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Stats */}
              {(post.likeCount > 0 || post.commentCount > 0) && (
                <View style={styles.statsContainer}>
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

              {/* Post Actions */}
              <View style={styles.postActions}>
                <Pressable
                  style={[
                    styles.actionButton,
                    post.isLikedByCurrentUser && styles.actionButtonLiked,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleLike(post.id);
                  }}
                >
                  <Ionicons
                    name={post.isLikedByCurrentUser ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={18}
                    color={post.isLikedByCurrentUser ? '#EA580C' : colors.tabIconDefault}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: post.isLikedByCurrentUser ? '#EA580C' : colors.tabIconDefault,
                      },
                    ]}
                  >
                    Thích
                  </Text>
                </Pressable>

                <Pressable 
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleComment(post.id);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={colors.tabIconDefault} />
                  <Text style={[styles.actionText, { color: colors.tabIconDefault }]}>
                    Bình luận
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  createButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  createFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postCard: {
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 0,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  postDate: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: 12,
    borderBottomWidth: 0,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  moreMediaBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moreMediaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonLiked: {
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
