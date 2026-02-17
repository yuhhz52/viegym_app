import { useEffect, useState } from "react";
import CommunityPostCard from "./CommunityPostCard";
import CreatePostModal from "./CreatePostModal";
import type { CommunityPost, UserInfo } from "./type";
import { getAllCommunityPosts } from "./api";
import { getMyInfoAPI } from "@/api/authApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import LoadingState from "@/components/LoadingState";
import { Users } from "lucide-react";

export default function CommunityFeed() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [info, communityPosts] = await Promise.all([
          getMyInfoAPI(),
          getAllCommunityPosts()
        ]);
        setUser(info);
        setPosts(communityPosts);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePostCreated = (newPost: CommunityPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  // Check if user can create posts (COACH, ADMIN, SUPER_ADMIN only)
  const canCreatePost = user?.roles?.some((role: string) => 
    ['ROLE_COACH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role.toUpperCase())
  ) ?? false;

  if (loading) {
    return <LoadingState message="Đang tải cộng đồng..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Cộng đồng</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Chia sẻ kiến thức và kinh nghiệm tập luyện</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-5">
          {/* Create Post Card - Only for COACH, ADMIN, SUPER_ADMIN */}
          {canCreatePost ? (
              <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                <CardContent className="p-4">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors group"
                  >
                    <Avatar className="w-10 h-10 ring-1 ring-gray-200 dark:ring-gray-700">
                      <AvatarImage src={user?.avatarUrl || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-semibold">
                        {user?.fullName?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                      Chia sẻ kiến thức và kinh nghiệm...
                    </span>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ảnh
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Viết bài
                    </button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <></>
            )}

          {/* Posts Feed */}
          <div className="space-y-5">
            {posts.map(post => (
              <CommunityPostCard key={post.id} post={post} user={user} />
            ))}
            {posts.length === 0 && (
              <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Chưa có bài viết nào</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hãy là người đầu tiên chia sẻ câu chuyện của bạn!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        user={user}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
