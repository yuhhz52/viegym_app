import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Share2, Flag, MoreHorizontal, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CommentSection from "./CommentSection";
import type { CommunityPost, UserInfo } from "./type";
import { toggleLike, reportPost } from "./api";
import { useLikeWS } from "@/hooks/useLikeWS";
import { toast } from "sonner";

interface Props {
  post: CommunityPost;
  user: UserInfo | null;
}

const MAX_CONTENT_LENGTH = 200; // Số ký tự tối đa trước khi rút gọn

export default function CommunityPostCard({ post, user }: Props) {
  const [liked, setLiked] = useState(post.isLikedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent double-click
  const lastClickTimeRef = useRef<number>(0); // Track last click time
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // Kiểm tra xem nội dung có dài hơn MAX_LENGTH không
  const shouldTruncate = post.content.length > MAX_CONTENT_LENGTH;
  
  // Hàm rút gọn nội dung, cắt ở khoảng trắng gần nhất để không cắt giữa từ
  const getTruncatedContent = (content: string, maxLength: number): string => {
    if (content.length <= maxLength) return content;
    
    // Tìm vị trí khoảng trắng gần nhất trước maxLength
    const truncated = content.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    const lastNewlineIndex = truncated.lastIndexOf('\n');
    const cutIndex = Math.max(lastSpaceIndex, lastNewlineIndex);
    
    // Nếu tìm thấy khoảng trắng hoặc xuống dòng, cắt ở đó, nếu không thì cắt ở maxLength
    return cutIndex > maxLength * 0.7 
      ? content.substring(0, cutIndex) 
      : truncated;
  };
  
  const displayContent = shouldTruncate && !isContentExpanded
    ? getTruncatedContent(post.content, MAX_CONTENT_LENGTH) + "..."
    : post.content;

  // Đồng bộ trạng thái liked khi post.isLikedByCurrentUser thay đổi (sau khi reload)
  useEffect(() => {
    const newLikedState = post.isLikedByCurrentUser === true;
    if (newLikedState !== liked) {
      console.log(`🔄 [Post ${post.id.slice(0, 8)}] Syncing liked state from server: ${newLikedState}`);
      setLiked(newLikedState);
    }
  }, [post.id, post.isLikedByCurrentUser]);

  // Đồng bộ likeCount khi post thay đổi (sau khi F5/reload)
  useEffect(() => {
    if (post.likeCount !== likeCount) {
      console.log(`🔄 [Post ${post.id.slice(0, 8)}] Syncing like count from server: ${post.likeCount}`);
      setLikeCount(post.likeCount);
    }
  }, [post.id, post.likeCount]);

  // WebSocket realtime update for likes - CHỈ sync likeCount, KHÔNG update liked state
  // Lý do: liked state là riêng của từng user, chỉ update khi chính user đó action
  const handleLikeUpdate = useCallback((update: { postId: string; likeCount: number }) => {
    console.log(`[Post ${update.postId.slice(0, 8)}] WebSocket update - New count: ${update.likeCount}`);
    // CHỈ update likeCount, GIỮ NGUYÊN liked state của current user
    setLikeCount(update.likeCount);
  }, []); // Empty deps - callback won't cause re-subscribe thanks to useRef in useLikeWS

  useLikeWS(post.id, handleLikeUpdate);

  const handleLike = async () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    // Debounce: Chặn clicks trong vòng 500ms (giống Facebook/Instagram)
    if (timeSinceLastClick < 500) {
      console.log("⏳ Too fast! Debouncing like request...");
      return;
    }
    
    // Prevent multiple concurrent requests
    if (isProcessing) {
      console.log("⏳ Like request already in progress, ignoring...");
      return;
    }
    
    lastClickTimeRef.current = now;
    
    // Lưu trạng thái cũ để rollback nếu có lỗi
    const previousLiked = liked;
    const previousLikeCount = likeCount;
    
    try {
      setIsProcessing(true);
      
      // Animation giống Facebook/Instagram
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      
      // Optimistic update: Cập nhật UI ngay lập tức (giống Facebook, Instagram)
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
      
      console.log(`🔄 [Post ${post.id.slice(0, 8)}] Toggling like: ${previousLiked ? 'Unlike' : 'Like'}`);
      
      // Gọi API toggle - Backend tự động xử lý like/unlike
      const response = await toggleLike(post.id);
      
      console.log(`✅ [Post ${post.id.slice(0, 8)}] Server response - Liked: ${response.isLikedByCurrentUser}, Count: ${response.likeCount}`);
      
      // Sync lại với server response để đảm bảo consistency
      // Điều này xử lý edge case: 2 người like cùng lúc
      setLiked(response.isLikedByCurrentUser);
      setLikeCount(response.likeCount);
    } catch (error) {
      console.error("❌ Failed to toggle like:", error);
      // Rollback on error - giống Instagram khi network fail
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
      
    } finally {
      // Re-enable after a short delay to prevent rapid clicking
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert("Vui lòng chọn lý do báo cáo");
      return;
    }

    setIsReporting(true);
    try {
      await reportPost(post.id, {
        reason: reportReason,
        description: reportDescription,
      });
      alert("Báo cáo đã được gửi thành công");
      setShowReportDialog(false);
      setReportReason("");
      setReportDescription("");
    } catch (error: any) {
      if (error.response?.data?.code === 1040) {
        alert("Bạn đã báo cáo bài viết này trước đó");
      } else {
        alert("Không thể gửi báo cáo. Vui lòng thử lại");
      }
    } finally {
      setIsReporting(false);
    }
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const copyPostLink = async () => {
    const postUrl = `${window.location.origin}/community?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      setLinkCopied(true);
      toast.success("Đã sao chép link bài viết!");
      setTimeout(() => {
        setLinkCopied(false);
        setShowShareDialog(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error("Không thể sao chép link. Vui lòng thử lại.");
    }
  };

  const shareViaNative = async () => {
    const postUrl = `${window.location.origin}/community?post=${post.id}`;
    const shareData = {
      title: post.title || 'Bài viết từ VieGym',
      text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      url: postUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShowShareDialog(false);
      } else {
        // Fallback to copy if native share not available
        await copyPostLink();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // User didn't cancel, try copy as fallback
        await copyPostLink();
      }
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-1 ring-gray-200 dark:ring-gray-700">
              <AvatarImage src={post.authorAvatar || user?.avatarUrl || ""} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white font-semibold text-sm">
                {post.authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm dark:text-white hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer transition-colors">{post.authorName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(post.createdAt)}</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                {!post.isReportedByCurrentUser && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportDialog(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Báo cáo bài viết
                  </button>
                )}
                {post.isReportedByCurrentUser && (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    <Flag className="w-4 h-4 inline mr-2" />
                    Đã báo cáo
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {post.title && <h3 className="text-base font-semibold mb-2 dark:text-white">{post.title}</h3>}
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <p className="whitespace-pre-wrap">{displayContent}</p>
          {shouldTruncate && (
            <button
              onClick={() => setIsContentExpanded(!isContentExpanded)}
              className="mt-1 text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-medium text-sm transition-colors"
            >
              {isContentExpanded ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </div>

        {/* Media */}
        {post.mediaUrls.length > 0 && (
          <div className={`mt-4 ${post.mediaUrls.length === 1 ? "rounded-lg overflow-hidden" : "grid grid-cols-2 gap-2"}`}>
            {post.mediaUrls.map((url, idx) =>
              url.endsWith(".mp4") ? (
                <video key={idx} controls className="w-full rounded-lg bg-gray-100 dark:bg-gray-800">
                  <source src={url} type="video/mp4" />
                </video>
              ) : (
                <img 
                  key={idx} 
                  src={url} 
                  alt={`media-${idx}`} 
                  className={`w-full object-cover rounded-lg ${post.mediaUrls.length === 1 ? "max-h-[32rem]" : "h-64"}`}
                />
              )
            )}
          </div>
        )}

        {/* Stats */}
        {(likeCount > 0 || post.commentCount > 0) && (
          <div className="flex items-center justify-between mt-4 pt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              {likeCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <ThumbsUp size={10} fill="white" className="text-white" />
                  </span>
                  {likeCount}
                </span>
              )}
            </div>
            <div>
              {post.commentCount > 0 && `${post.commentCount} bình luận`}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleLike} 
            className={`flex items-center justify-center gap-2 py-2 rounded-md transition-all text-sm font-medium ${
              liked 
                ? "text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}>
            <ThumbsUp 
              size={16} 
              className={`transition-all duration-300 ${liked ? "fill-current" : ""} ${
                isAnimating ? "scale-125" : "scale-100"
              }`} 
            /> 
            <span>Thích</span>
          </button>
          <button 
            onClick={() => setShowComments(prev => !prev)} 
            className="flex items-center justify-center gap-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all text-sm font-medium">
            <MessageCircle size={16} /> 
            <span>Bình luận</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all text-sm font-medium"
          >
            <Share2 size={16} /> 
            <span>Chia sẻ</span>
          </button>
        </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} user={user} />}
    </CardContent>

    {/* Share Dialog */}
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Chia sẻ bài viết</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {post.title || 'Bài viết từ VieGym'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {post.content}
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={copyPostLink}
              variant="outline"
              className="w-full justify-start"
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Đã sao chép!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Sao chép link
                </>
              )}
            </Button>
            
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                onClick={shareViaNative}
                className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Chia sẻ qua ứng dụng
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Report Dialog */}
    <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Báo cáo bài viết</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lý do báo cáo *</label>
              <div className="space-y-2">
                {[
                  { value: "Spam/Quảng cáo", label: "Spam/Quảng cáo" },
                  { value: "Nội dung không phù hợp", label: "Nội dung không phù hợp" },
                  { value: "Quấy rối/Bắt nạt", label: "Quấy rối/Bắt nạt" },
                  { value: "Thông tin sai lệch", label: "Thông tin sai lệch" },
                  { value: "Khác", label: "Khác" },
                ].map((reason) => (
                  <label key={reason.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.value}
                      checked={reportReason === reason.value}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả chi tiết (tùy chọn)</label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Mô tả thêm về vấn đề..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false);
                setReportReason("");
                setReportDescription("");
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason || isReporting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isReporting ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}
