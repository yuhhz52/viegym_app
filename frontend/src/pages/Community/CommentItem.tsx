import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PostComment, UserInfo } from "./type";

interface Props {
  comment: PostComment;
  level?: number;
  currentUser: UserInfo | null;
  onAddReply: (parentId: string, content: string) => Promise<void> | void;
}

// Hàm tính time ago
function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000); // tính giây

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


interface CommentItemProps extends Omit<Props, 'level' | 'onAddReply'> {
  onViewReplies?: (commentId: string) => void;
  onReplyClick?: (commentId: string, authorName: string) => void;
  isReply?: boolean;
  showReplyButton?: boolean;
}

// Hàm đệ quy đếm tổng số replies (bao gồm cả replies của replies)
const countTotalReplies = (comment: PostComment): number => {
  if (!comment.replies || comment.replies.length === 0) return 0;
  
  let total = comment.replies.length;
  comment.replies.forEach(reply => {
    total += countTotalReplies(reply);
  });
  return total;
};

export default function CommentItem({ comment, onReplyClick, onViewReplies, isReply = false, showReplyButton = true }: CommentItemProps) {

  // Đếm tổng tất cả replies trong thread
  const totalReplies = countTotalReplies(comment);

  return (
    <div className="flex flex-col gap-2 group">
      <div className="flex gap-3 p-2">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={comment.authorAvatar || ""} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
            {comment.authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="space-y-1">
            <p className="text-sm font-semibold dark:text-white">{comment.authorName}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(comment.createdAt)}</span>
            {showReplyButton && onReplyClick && (
              <button
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => onReplyClick(comment.id, comment.authorName)}
              >
                Trả lời
              </button>
            )}
            {!isReply && totalReplies > 0 && onViewReplies && (
              <button
                onClick={() => onViewReplies(comment.id)}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                Xem {totalReplies} câu trả lời
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
