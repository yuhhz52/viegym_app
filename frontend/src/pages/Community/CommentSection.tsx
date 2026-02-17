import React, { useCallback, useEffect, useState } from "react";
import type { PostComment, UserInfo } from "./type";
import { getComments, addComment } from "./api";
import CommentItem from "./CommentItem";
import { Button } from "@/components/ui/button";
import { useCommentWS } from "@/hooks/useCommentWS";

interface Props {
  postId: string;
  user: UserInfo | null;
}

export default function CommentSection({ postId, user }: Props) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [viewingReplies, setViewingReplies] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Merge comment mới vào tree hiện tại
  const upsertComment = useCallback((incoming: PostComment) => {
    setComments(prev => mergeComments(prev, incoming));
  }, []);

  useCommentWS(postId, upsertComment);

  useEffect(() => {
    const fetch = async () => {
      const data = await getComments(postId);
      setComments(data.map(normalizeCommentTree));
    };
    fetch();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !user) return;

    try {
      // Nếu đang reply, gọi handleAddReply
      if (replyingTo) {
        await handleAddReply(replyingTo.id, newCommentText);
      } else {
        const saved = await addComment(postId, newCommentText);
        const normalized = normalizeCommentTree({ ...saved, parentCommentId: saved.parentCommentId ?? null });
        upsertComment(normalized);
        setNewCommentText("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddReply = async (parentId: string, content: string) => {
    if (!content.trim() || !user) return;

    try {
      const saved = await addComment(postId, content, parentId);
      const normalized = normalizeCommentTree({ ...saved, parentCommentId: parentId });
      upsertComment(normalized);
      // Clear reply state
      setReplyingTo(null);
      setNewCommentText("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleReplyClick = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
    setNewCommentText(`@${authorName} `);
    // Không scroll, chỉ focus input mà không thay đổi vị trí scroll
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleViewReplies = (commentId: string) => {
    setViewingReplies(prev => prev === commentId ? null : commentId);
  };

  // Hàm đệ quy để lấy tất cả replies (flatten)
  const getAllReplies = (comment: PostComment): PostComment[] => {
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
  };

  const currentViewingComment = viewingReplies 
    ? comments.find(c => c.id === viewingReplies)
    : null;

  const flattenedReplies = currentViewingComment 
    ? getAllReplies(currentViewingComment)
    : [];

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
      {/* Xem thread replies nếu đang view */}
      {viewingReplies && currentViewingComment && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setViewingReplies(null)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold dark:text-white">
              Câu trả lời cho @{currentViewingComment.authorName}
            </span>
          </div>
          
          {/* Comment gốc */}
          <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <CommentItem
              comment={currentViewingComment}
              onReplyClick={handleReplyClick}
              isReply={false}
              currentUser={user}
            />
          </div>
          
          {/* Replies - flatten tất cả replies để dễ reply */}
          <div className="space-y-1 ml-4">
            {flattenedReplies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReplyClick={handleReplyClick}
                isReply={true}
                showReplyButton={true}
                currentUser={user}
              />
            ))}
            {flattenedReplies.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">Chưa có câu trả lời nào</p>
            )}
          </div>
        </div>
      )}

      {/* Danh sách comments chính */}
      {!viewingReplies && (
        <div className="space-y-1">
          {(showAllComments ? comments : comments.slice(0, 5)).map(cmt => (
            <CommentItem
              key={cmt.id}
              comment={cmt}
              onReplyClick={handleReplyClick}
              onViewReplies={handleViewReplies}
              isReply={false}
              currentUser={user}
            />
          ))}
          
          {/* Nút xem thêm bình luận */}
          {!showAllComments && comments.length > 5 && (
            <button
              onClick={() => setShowAllComments(true)}
              className="w-full py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Xem thêm {comments.length - 5} bình luận
            </button>
          )}
        </div>
      )}

      {/* Input box */}
      <div className="mt-4 pt-3 sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg">
              <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                Đang trả lời @{replyingTo.name}
              </span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setNewCommentText("");
                }}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={newCommentText}
            onChange={e => setNewCommentText(e.target.value)}
            placeholder={replyingTo ? `Trả lời @${replyingTo.name}...` : "Viết bình luận..."}
            className="flex-1 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white placeholder:text-gray-500"
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddComment();
              }
              if (e.key === "Escape" && replyingTo) {
                setReplyingTo(null);
                setNewCommentText("");
              }
            }}
          />
          <Button 
            size="sm" 
            onClick={handleAddComment} 
            disabled={!newCommentText.trim() || !user}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-400">
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
}

// helpers
const normalizeCommentTree = (comment: PostComment): PostComment => ({
  ...comment,
  parentCommentId: comment.parentCommentId ?? null,
  replies: comment.replies?.map(normalizeCommentTree) ?? []
});

const mergeComments = (list: PostComment[], incoming: PostComment): PostComment[] => {
  const normalized = normalizeCommentTree(incoming);

  if (!normalized.parentCommentId) {
    const idx = list.findIndex(c => c.id === normalized.id);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = normalized;
      return next;
    }
    return [...list, normalized];
  }

  let changed = false;
  const next = list.map(comment => {
    if (comment.id === normalized.parentCommentId) {
      changed = true;
      const replies = comment.replies ? [...comment.replies] : [];
      const replyIdx = replies.findIndex(r => r.id === normalized.id);
      if (replyIdx !== -1) replies[replyIdx] = normalized;
      else replies.push(normalized);
      return { ...comment, replies };
    }

    if (comment.replies?.length) {
      const nested = mergeComments(comment.replies, normalized);
      if (nested !== comment.replies) {
        changed = true;
        return { ...comment, replies: nested };
      }
    }
    return comment;
  });

  return changed ? next : list;
};
