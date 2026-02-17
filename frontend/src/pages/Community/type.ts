export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  status?: string | null;
  createdAt: string;
  authorName: string;
  authorAvatar?: string | null;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser?: boolean;
  reportCount?: number;
  isReportedByCurrentUser?: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  parentCommentId?: string | null;
  replies: PostComment[];
}

export interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  roles?: string[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
