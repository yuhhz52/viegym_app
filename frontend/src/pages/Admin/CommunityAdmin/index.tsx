import { useEffect, useState } from "react";
import {
  adminGetPosts,
  adminDeletePost,
  adminGetComments,
  adminDeleteComment,
  adminCreatePost,
  adminUpdatePost,
  adminClearReports
} from "./api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import CommunityPostForm from "./CommunityPostForm";

// Add styles for animations
const styles = `
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .group {
    position: relative;
  }
  
  .group-hover\\:opacity-100:hover {
    opacity: 1 !important;
  }
  
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default function CommunityAdminPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | "reported" | "normal">("all");
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<string | null>(null);
  const [deleteConfirmComment, setDeleteConfirmComment] = useState<string | null>(null);
  const [clearConfirmPost, setClearConfirmPost] = useState<string | null>(null);

  const fetchPosts = async () => {
    const data = await adminGetPosts();
    setPosts(data);
  };

  const openPostDetail = async (post: any) => {
    setSelectedPost(post);
    const cmt = await adminGetComments(post.id);
    setComments(cmt);
  };

  const deletePost = async (id: string) => {
    await adminDeletePost(id);
    fetchPosts();
    setSelectedPost(null);
    setDeleteConfirmPost(null);
  };

  const deleteComment = async (id: string) => {
    await adminDeleteComment(id);
    const cmt = await adminGetComments(selectedPost.id);
    setComments(cmt);
    setDeleteConfirmComment(null);
  };

  const clearReports = async (postId: string) => {
    try {
      console.log('🔄 [clearReports] Starting to clear reports for post:', postId);
      const response = await adminClearReports(postId);
      console.log('✅ [clearReports] API response:', response);
      
      console.log('🔄 [clearReports] Fetching updated posts...');
      await fetchPosts();
      console.log('✅ [clearReports] Posts refreshed');
      
      // Close dialog and reset state
      setSelectedPost(null);
      setClearConfirmPost(null);
      console.log('✅ [clearReports] Dialog closed');
    } catch (error: any) {
      console.error('❌ [clearReports] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        fullError: error
      });
      setClearConfirmPost(null);
    }
  };

  const handleCreateClick = () => {
    setEditPost(null);
    setShowForm(true);
  };

  const handleEditClick = (post: any) => {
    setEditPost(post);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editPost) {
      await adminUpdatePost(editPost.id, data);
    } else {
      await adminCreatePost(data);
    }
    setShowForm(false);
    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(p => {
    // Filter by search query
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "reported" && p.reportCount > 0) ||
      (statusFilter === "normal" && (!p.reportCount || p.reportCount === 0));
    
    return matchesSearch && matchesStatus;
  });

  const reportedCount = posts.filter(p => p.reportCount > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                {reportedCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{reportedCount}</span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Quản lý cộng đồng
                </h1>
                <p className="text-slate-500 mt-1 text-sm">Quản lý tất cả bài viết và bình luận cộng đồng</p>
              </div>
            </div>
            
            <Button 
              onClick={handleCreateClick}
              className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white shadow-lg px-6 py-6 rounded-xl font-semibold transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Tạo bài viết mới
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="group relative bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-blue-200 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">Tổng bài viết</p>
                  <p className="text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">{posts.length}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/40 group-hover:shadow-blue-500/60 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </Card>

          <Card className="group relative bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-red-200 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2 uppercase tracking-wide">Bị báo cáo</p>
                  <p className="text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">{reportedCount}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/40 group-hover:shadow-red-500/60 group-hover:scale-110 transition-all duration-300 relative">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {reportedCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-xs font-bold text-red-600">{reportedCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </Card>

          <Card className="group relative bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-purple-200 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">Hoạt động</p>
                  <p className="text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">{new Set(posts.map(p => p.username)).size}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/40 group-hover:shadow-purple-500/60 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </Card>

          <Card className="group relative bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-emerald-200 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-600 mb-2 uppercase tracking-wide">Có hình ảnh</p>
                  <p className="text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {posts.filter(p => p.mediaUrls?.length > 0).length}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/40 group-hover:shadow-emerald-500/60 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-1.5 mb-6 flex gap-1.5 border border-slate-200/60">
          <button
            onClick={() => setStatusFilter("all")}
            className={`group flex-1 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden ${
              statusFilter === "all"
                ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-lg"
                : "text-slate-700 hover:bg-slate-50/80 hover:shadow-md"
            }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Tất cả</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}>
                {posts.length}
              </span>
            </div>
            {statusFilter !== "all" && (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
          
          <button
            onClick={() => setStatusFilter("reported")}
            className={`group flex-1 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden ${
              statusFilter === "reported"
                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30"
                : "text-slate-700 hover:bg-slate-50/80 hover:shadow-md"
            }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Báo cáo</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === "reported" ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
              }`}>
                {reportedCount}
              </span>
            </div>
            {statusFilter !== "reported" && (
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
          
          <button
            onClick={() => setStatusFilter("normal")}
            className={`group flex-1 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden ${
              statusFilter === "normal"
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-slate-700 hover:bg-slate-50/80 hover:shadow-md"
            }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Bình thường</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === "normal" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
              }`}>
                {posts.length - reportedCount}
              </span>
            </div>
            {statusFilter !== "normal" && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
        </div>

        {/* Search & View Toggle */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between border border-slate-200/60">
          <div className="relative flex-1 w-full sm:max-w-md group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-700 transition-colors duration-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, tác giả, nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500/50 focus:border-slate-400 transition-all duration-300 bg-white placeholder:text-slate-400 text-slate-900 font-medium shadow-sm"
            />
          </div>

          <div className="flex gap-1.5 bg-slate-100/80 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode("grid")}
              className={`group px-5 py-2.5 rounded-lg transition-all duration-300 font-semibold ${
                viewMode === "grid" 
                  ? "bg-white shadow-md text-slate-800 scale-105" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`group px-5 py-2.5 rounded-lg transition-all duration-300 font-semibold ${
                viewMode === "list" 
                  ? "bg-white shadow-md text-slate-800 scale-105" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Posts Grid/List */}
        {filteredPosts.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-slate-200/60 rounded-2xl">
            <CardContent className="p-20 text-center">
              <div className="w-28 h-28 bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
                <svg className="w-14 h-14 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
                Không tìm thấy bài viết
              </h3>
              <p className="text-slate-500 mb-8 text-base max-w-md mx-auto leading-relaxed">
                {searchQuery ? "Thử điều chỉnh từ khóa tìm kiếm hoặc tạo bài viết mới" : "Bắt đầu bằng cách tạo bài viết đầu tiên"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={handleCreateClick} 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 px-8 py-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tạo bài viết đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
            {filteredPosts.map((p: any) => (
              <Card
                key={p.id}
                className={`group cursor-pointer bg-white overflow-hidden transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:shadow-2xl hover:-translate-y-1 rounded-2xl ${
                  viewMode === "grid" ? "h-full flex flex-col" : "flex-row"
                }`}
                onClick={() => openPostDetail(p)}
              >
                <CardContent className={`p-0 flex flex-col h-full ${viewMode === "list" ? "flex-row w-full" : ""}`}>
                  {/* Media Preview */}
                  {p.mediaUrls && p.mediaUrls.length > 0 ? (
                    <div className={`relative bg-slate-100 flex-shrink-0 ${
                      viewMode === "list" ? "w-48 h-36" : "w-full aspect-video"
                    } overflow-hidden`}>
                      <img 
                        src={p.mediaUrls[0]} 
                        alt="Post media" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {p.reportCount > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {p.reportCount}
                        </div>
                      )}
                      {p.mediaUrls.length > 1 && (
                        <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          +{p.mediaUrls.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`relative bg-gradient-to-br from-slate-50 to-slate-100 flex-shrink-0 flex items-center justify-center ${
                      viewMode === "list" ? "w-48 h-36" : "w-full aspect-video"
                    }`}>
                      <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {p.reportCount > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {p.reportCount}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex-1 flex flex-col ${viewMode === "list" ? "p-5" : "p-6"}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 line-clamp-2 group-hover:text-slate-700 transition-colors duration-300">
                          {p.title}
                        </h3>
                        {p.reportCount > 0 && viewMode !== "grid" && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-xs font-bold text-red-600">
                              {p.reportCount} báo cáo
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); handleEditClick(p); }}
                          className="h-9 w-9 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-all hover:scale-110 rounded-lg"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmPost(p.id); }}
                          className="h-9 w-9 p-0 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all hover:scale-110 rounded-lg"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    {/* Author & Meta */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 mb-4">
                      <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-slate-200 ring-offset-1">
                        <AvatarImage src={p.authorAvatar} alt={p.authorName} />
                        <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm font-bold">
                          {p.authorName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate text-sm">{p.authorName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      {p.mediaUrls?.length > 0 && (
                        <span className="text-blue-600 flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg flex-shrink-0 font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {p.mediaUrls.length}
                        </span>
                      )}
                    </div>

                    {/* Content Preview */}
                    <p className={`text-slate-600 text-sm flex-grow leading-relaxed ${viewMode === "list" ? "line-clamp-2" : "line-clamp-3"}`}>
                      {p.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-slate-200">
          <DialogHeader>
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-14 w-14 flex-shrink-0 mt-1 ring-4 ring-slate-200 ring-offset-2">
                <AvatarImage src={selectedPost?.authorAvatar} alt={selectedPost?.authorName} />
                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-bold text-lg">
                  {selectedPost?.authorName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {selectedPost?.title}
                </DialogTitle>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-base font-bold text-slate-900">{selectedPost?.authorName}</p>
                  <span className="text-slate-300">•</span>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selectedPost?.createdAt && new Date(selectedPost.createdAt).toLocaleDateString('vi-VN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Post Content */}
            <div className="space-y-4">
              {/* Media Gallery */}
              {selectedPost?.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                <div className={`grid gap-4 ${
                  selectedPost.mediaUrls.length === 1 ? 'grid-cols-1' : 
                  selectedPost.mediaUrls.length === 2 ? 'grid-cols-2' : 
                  'grid-cols-2 sm:grid-cols-3'
                }`}>
                  {selectedPost.mediaUrls.map((url: string, idx: number) => (
                    <div 
                      key={idx}
                      className="relative group rounded-2xl overflow-hidden border-2 border-slate-200/60 hover:border-slate-300 transition-all duration-300 cursor-pointer bg-slate-100 shadow-md hover:shadow-xl"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <img 
                        src={url} 
                        alt={`Media ${idx + 1}`}
                        className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                          selectedPost.mediaUrls.length === 1 ? 'h-96' : 'h-56'
                        }`}
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                        </div>
                      </div>
                      {/* Counter */}
                      {selectedPost.mediaUrls.length > 1 && (
                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                          {idx + 1}/{selectedPost.mediaUrls.length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">
                  {selectedPost?.content}
                </p>
              </div>

              {/* Report Warning */}
              {selectedPost?.reportCount > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-5 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30 animate-pulse">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-900 mb-2 text-lg">
                        {selectedPost.reportCount} báo cáo vi phạm
                      </h4>
                      <p className="text-sm text-red-700 leading-relaxed">
                        Bài viết này đã bị người dùng báo cáo vi phạm. Bạn có thể xóa bài viết hoặc xóa báo cáo để cho bài quay lại trạng thái bình thường.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-slate-200/60">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedPost(null);
                    handleEditClick(selectedPost);
                  }}
                  className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </Button>
                
                {selectedPost?.reportCount > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => setClearConfirmPost(selectedPost.id)}
                    className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Xóa báo cáo
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteConfirmPost(selectedPost.id)}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa bài viết
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t-2 border-slate-200/60 pt-6">
              <h2 className="text-2xl font-bold mb-5 flex items-center justify-between">
                <span className="flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  <svg className="w-7 h-7 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Bình luận
                </span>
                <span className="text-base font-bold text-slate-700 bg-slate-100 px-4 py-1.5 rounded-full shadow-sm">
                  {comments.length}
                </span>
              </h2>
              
              {comments.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300/60">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-bold text-lg">Chưa có bình luận</p>
                  <p className="text-sm text-slate-500 mt-2">Hãy là người đầu tiên chia sẽ ý kiến</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((c: any) => (
                    <div key={c.id} className="group bg-white border-2 border-slate-200/60 rounded-2xl p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-slate-200 ring-offset-1">
                            <AvatarImage src={c.authorAvatar} alt={c.authorName} />
                            <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm font-bold">
                              {c.authorName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate text-sm">{c.authorName}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {c.createdAt && new Date(c.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmComment(c.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-9 w-9 p-0 rounded-lg hover:scale-110"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                      <p className="text-slate-700 leading-relaxed pl-13 text-base">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {editPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </DialogTitle>
          </DialogHeader>
          <CommunityPostForm
            initialData={editPost}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation Dialog */}
      <Dialog open={deleteConfirmPost !== null} onOpenChange={() => setDeleteConfirmPost(null)}>
        <DialogContent className="max-w-md bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận xóa bài viết
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-700">
              Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmPost(null)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmPost) {
                  deletePost(deleteConfirmPost);
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              Xóa bài viết
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog open={deleteConfirmComment !== null} onOpenChange={() => setDeleteConfirmComment(null)}>
        <DialogContent className="max-w-md bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận xóa bình luận
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-700">
              Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmComment(null)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmComment) {
                  deleteComment(deleteConfirmComment);
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              Xóa bình luận
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Reports Confirmation Dialog */}
      <Dialog open={clearConfirmPost !== null} onOpenChange={() => setClearConfirmPost(null)}>
        <DialogContent className="max-w-md bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận xóa báo cáo
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-700">
              Xóa tất cả báo cáo và cho bài viết quay lại trạng thái bình thường?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setClearConfirmPost(null)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (clearConfirmPost) {
                  clearReports(clearConfirmPost);
                }
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
            >
              Xóa báo cáo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}