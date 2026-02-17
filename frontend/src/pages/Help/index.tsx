export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-6">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Trợ Giúp & Hỗ Trợ
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Cần hỗ trợ? Tìm câu trả lời cho các câu hỏi thường gặp hoặc liên hệ với chúng tôi
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-16">
          {/* Account & Login */}
          <div className="group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tài Khoản & Đăng Nhập</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>Cách tạo tài khoản VieGym</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>Quên mật khẩu hoặc lỗi đăng nhập</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>Cập nhật thông tin cá nhân và mục tiêu</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Programs & Workouts */}
          <div className="group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Chương Trình & Bài Tập</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Cách bắt đầu chương trình tập mới</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Theo dõi tiến độ và kết quả</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Tùy chỉnh kế hoạch tập luyện</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Nutrition */}
          <div className="group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Dinh Dưỡng</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Thực đơn được đề xuất theo mục tiêu</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Theo dõi lượng calo hàng ngày</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Mẹo tăng cơ hoặc giảm mỡ hiệu quả</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Technical Support */}
          <div className="group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Hỗ Trợ Kỹ Thuật</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Ứng dụng không tải được?</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Báo cáo lỗi hoặc phản hồi</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Liên hệ đội ngũ hỗ trợ</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-12 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Vẫn Cần Hỗ Trợ?</h2>
            <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
              Liên hệ với đội ngũ hỗ trợ của chúng tôi — chúng tôi luôn sẵn sàng giúp bạn tận dụng tối đa VieGym
            </p>
            <a
              href="mailto:support@viegym.com"
              className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Liên Hệ Hỗ Trợ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

