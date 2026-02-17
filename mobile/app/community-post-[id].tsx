import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { communityApi, CommunityPost, PostComment } from '@/services/api';

// Helper function: Time ago format
function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;

  const days = Math.floor(diff / 86400);
  if (days < 30) return `${days} ngày trước`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;

  const years = Math.floor(months / 12);
  return `${years} năm trước`;
}

// Helper function: Count total replies recursively
function countTotalReplies(comment: PostComment): number {
  if (!comment.replies || comment.replies.length === 0) return 0;
  
  let total = comment.replies.length;
  comment.replies.forEach(reply => {
    total += countTotalReplies(reply);
  });
  return total;
}

// Helper function: Flatten all replies
function getAllReplies(comment: PostComment): PostComment[] {
  if (!comment.replies || comment.replies.length === 0) return [];
  
  const allReplies: PostComment[] = [];
  const traverse = (replies: PostComment[]) => {
    replies.forEach(reply => {
      allReplies.push(reply);
      if (reply.replies && reply.replies.length > 0) {
        traverse(reply.replies);
      }
    });
  };
  traverse(comment.replies);
  return allReplies;
}

export default function CommunityPostDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Handle id as string or array
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  console.log('🔍 [POST DETAIL] ========== Component mounted ==========');
  console.log('🔍 [POST DETAIL] Raw params:', JSON.stringify(params, null, 2));
  console.log('🔍 [POST DETAIL] All params keys:', Object.keys(params));
  console.log('🔍 [POST DETAIL] Extracted id:', id);
  console.log('🔍 [POST DETAIL] id type:', typeof id);
  console.log('🔍 [POST DETAIL] id is undefined?', id === undefined);
  console.log('🔍 [POST DETAIL] id is null?', id === null);

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingReplies, setViewingReplies] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPostDetail();
    }
  }, [id]);

  // Refresh data when screen comes into focus to sync like states
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchPostDetail();
      }
    }, [id])
  );

  const fetchPostDetail = async () => {
    if (!id) {
      console.error('Post ID is missing');
      Alert.alert('Lỗi', 'Không tìm thấy ID bài viết');
      return;
    }

    try {
      setLoading(true);
      console.log('📝 Fetching post detail for ID:', id);
      const [postData, commentsData] = await Promise.all([
        communityApi.getPostById(id),
        communityApi.getComments(id),
      ]);
      console.log('✅ Post data received:', { postId: postData?.id, commentCount: postData?.commentCount });
      console.log('✅ Comments data received:', {
        type: typeof commentsData,
        isArray: Array.isArray(commentsData),
        length: Array.isArray(commentsData) ? commentsData.length : 'N/A',
        data: commentsData
      });
      setPost(postData);
      const commentsArray = Array.isArray(commentsData) ? commentsData : [];
      console.log('✅ Setting comments to state:', commentsArray.length);
      setComments(commentsArray);
    } catch (error) {
      console.error('❌ Error fetching post detail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải bài viết';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPostDetail();
    setRefreshing(false);
  };

  const handleToggleLike = async () => {
    if (!post) return;

    try {
      const result = await communityApi.toggleLike(post.id);
      setPost({
        ...post,
        likeCount: result.likeCount,
        isLikedByCurrentUser: result.isLikedByCurrentUser,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bình luận');
      return;
    }

    if (!id) {
      Alert.alert('Lỗi', 'Không tìm thấy ID bài viết');
      return;
    }

    try {
      setSubmitting(true);
      await communityApi.addComment(
        id,
        commentText.trim(),
        replyingTo?.id
      );

      // Always refresh to get updated comment tree
      await fetchPostDetail();

      setCommentText('');
      setReplyingTo(null);
      
      // Update comment count
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Lỗi', 'Không thể thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleViewReplies = (commentId: string) => {
    setViewingReplies(prev => prev === commentId ? null : commentId);
  };

  const renderComment = (comment: PostComment, isReply: boolean = false, showReplyButton: boolean = true) => {
    const totalReplies = countTotalReplies(comment);
    
    return (
      <View
        key={comment.id}
        style={[
          styles.commentItem,
          isReply && styles.replyItem,
          { borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.commentAvatar}>
          {comment.authorAvatar ? (
            <Image source={{ uri: comment.authorAvatar }} style={styles.commentAvatarImage} />
          ) : (
            <Text style={styles.commentAvatarText}>
              {comment.authorName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.commentContent}>
          <Text style={[styles.commentAuthor, { color: colors.text }]}>
            {comment.authorName}
          </Text>
          <Text style={[styles.commentText, { color: colors.text }]}>{comment.content}</Text>
          <View style={styles.commentFooter}>
            <Text style={[styles.commentDate, { color: colors.tabIconDefault }]}>
              {timeAgo(comment.createdAt)}
            </Text>
            {showReplyButton && (
              <Pressable onPress={() => handleReply(comment.id, comment.authorName)}>
                <Text style={[styles.replyButton, { color: colors.primary }]}>Trả lời</Text>
              </Pressable>
            )}
            {!isReply && totalReplies > 0 && !viewingReplies && (
              <Pressable onPress={() => handleViewReplies(comment.id)}>
                <Text style={[styles.viewRepliesButton, { color: colors.primary }]}>
                  Xem {totalReplies} câu trả lời
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
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

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Bài viết</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.tabIconDefault }]}>
            Không tìm thấy bài viết
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Bài viết</Text>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Post Content */}
          <View style={[styles.postCard, { backgroundColor: colors.cardBackground }]}>
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
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            {/* Post Title */}
            {post.title && (
              <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
            )}

            {/* Post Content */}
            <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>

            {/* Post Media */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <View style={styles.mediaContainer}>
                {post.mediaUrls.map((url, index) => (
                  <Image
                    key={index}
                    source={{ uri: url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                ))}
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
                onPress={handleToggleLike}
              >
                <Ionicons
                  name={post.isLikedByCurrentUser ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={20}
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

              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.tabIconDefault} />
                <Text style={[styles.actionText, { color: colors.tabIconDefault }]}>
                  Bình luận
                </Text>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            {/* View Replies Mode */}
            {viewingReplies && (() => {
              const currentComment = comments.find(c => c.id === viewingReplies);
              if (!currentComment) return null;
              
              const flattenedReplies = getAllReplies(currentComment);
              
              return (
                <View style={[styles.repliesView, { borderBottomColor: colors.border }]}>
                  <View style={styles.repliesHeader}>
                    <Pressable onPress={() => setViewingReplies(null)} style={styles.backButton}>
                      <Ionicons name="arrow-back" size={20} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.repliesHeaderText, { color: colors.text }]}>
                      Câu trả lời cho @{currentComment.authorName}
                    </Text>
                  </View>
                  
                  {/* Original comment */}
                  <View style={[styles.originalComment, { borderBottomColor: colors.border }]}>
                    {renderComment(currentComment, false, true)}
                  </View>
                  
                  {/* Flattened replies */}
                  <View style={styles.flatReplies}>
                    {flattenedReplies.length > 0 ? (
                      flattenedReplies.map(reply => renderComment(reply, true, true))
                    ) : (
                      <Text style={[styles.noReplies, { color: colors.tabIconDefault }]}>
                        Chưa có câu trả lời nào
                      </Text>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* Normal Comments List */}
            {!viewingReplies && (
              <>
                <Text style={[styles.commentsTitle, { color: colors.text }]}>
                  Bình luận ({comments.length})
                </Text>

                {comments.length === 0 ? (
                  <Text style={[styles.noComments, { color: colors.tabIconDefault }]}>
                    Chưa có bình luận nào. Hãy là người đầu tiên!
                  </Text>
                ) : (
                  <>
                    <View>
                      {(showAllComments ? comments : comments.slice(0, 5)).map((comment) => 
                        renderComment(comment, false, true)
                      )}
                    </View>
                    
                    {/* Show More Button */}
                    {!showAllComments && comments.length > 5 && (
                      <Pressable
                        style={[styles.showMoreButton, { backgroundColor: colors.background }]}
                        onPress={() => setShowAllComments(true)}
                      >
                        <Text style={[styles.showMoreText, { color: colors.primary }]}>
                          Xem thêm {comments.length - 5} bình luận
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={[styles.commentInputContainer, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
          {replyingTo && (
            <View style={[styles.replyingBanner, { backgroundColor: colors.background }]}>
              <Text style={[styles.replyingText, { color: colors.tabIconDefault }]}>
                Đang trả lời <Text style={{ color: colors.text }}>{replyingTo.name}</Text>
              </Text>
              <Pressable onPress={cancelReply}>
                <Ionicons name="close" size={20} color={colors.tabIconDefault} />
              </Pressable>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.commentInput, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="Viết bình luận..."
              placeholderTextColor={colors.tabIconDefault}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: commentText.trim() ? colors.primary : colors.border },
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  postCard: {
    padding: 16,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  postDate: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    marginVertical: 12,
    gap: 8,
  },
  mediaImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonLiked: {
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  noComments: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  replyItem: {
    marginLeft: 40,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  commentFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  commentDate: {
    fontSize: 12,
  },
  replyButton: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewRepliesButton: {
    fontSize: 12,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 8,
  },
  repliesView: {
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingBottom: 16,
  },
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  repliesHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  originalComment: {
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingBottom: 12,
  },
  flatReplies: {
    marginLeft: 16,
  },
  noReplies: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  showMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentInputContainer: {
    borderTopWidth: 1,
    padding: 12,
  },
  replyingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingText: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
