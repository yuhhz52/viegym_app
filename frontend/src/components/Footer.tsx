import React from "react";
import googlePlayLogo from "../assets/images/googleplay.png";
import { Link } from "react-router-dom";

interface FooterItem {
  title: string;
  list?: { label: string; path?: string }[];
  logo?: string;
}

interface FooterContent {
  items: FooterItem[];
  copyright: string;
}

const content: FooterContent = {
  items: [
    {
      title: "Tài nguyên",
      list: [
        { label: "Bài tập", path: "/exercises" },
        { label: "Chương trình tập luyện", path: "/programs" },
        { label: "Cộng đồng", path: "/community" },
        { label: "Hỗ trợ", path: "/support" },
      ],
    },
    {
      title: "Hỗ trợ",
      list: [
        { label: "Chính sách", path: "/policy" },
        { label: "Liên hệ", path: "/contact" },
      ],
    },
    {
      title: "Tải ứng dụng",
      logo: googlePlayLogo,
    },
  ],
  copyright: "© 2025 VieGym. All rights reserved.",
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 mt-16 transition-colors">
      <hr className="border-t border-gray-300 dark:border-gray-700" />
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 grid gap-10 lg:grid-cols-3 text-center lg:text-left">
        <div className="flex flex-col items-center lg:items-start">
          <Link to="/" className="flex items-center gap-3 group mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-blue-500 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              VieGym
            </div>
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
            Ứng dụng thể hình thông minh giúp bạn theo dõi tiến trình, luyện tập
            đúng kỹ thuật và đạt mục tiêu nhanh chóng.
          </p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-8">
          {content.items.map((item, idx) => (
            <div key={idx}>
              <p className="font-semibold text-black dark:text-white mb-3">{item.title}</p>
              <ul className="space-y-2">
                {item.list?.map((listItem, lidx) => (
                  <li key={lidx}>
                    <a
                      href={listItem.path || "#"}
                      className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-300"
                    >
                      {listItem.label}
                    </a>
                  </li>
                ))}
                {item.logo && (
                  <li className="flex justify-center lg:justify-start">
                    <a
                      href="https://play.google.com/store"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img
                        src={item.logo}
                        alt="Google Play"
                        className="h-10 mt-2 hover:opacity-90 transition"
                      />
                    </a>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 py-5 text-center">
        <p className="text-sm text-gray-700 dark:text-gray-300">{content.copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;
