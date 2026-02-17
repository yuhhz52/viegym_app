import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { UserMenu } from "@/components/UserMenu";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  Loader,
  Calendar
} from "lucide-react";

export default function AdminLayout() {
  const { user } = useAuth();
  const { isLoggingOut } = useLogout();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { to: "/admin", icon: <LayoutDashboard size={20} />, label: "Tổng quan" },
    { to: "/admin/users", icon: <Users size={20} />, label: "Người dùng" },
    { to: "/admin/exercises", icon: <Dumbbell size={20} />, label: "Bài tập" },
    { to: "/admin/programs", icon: <Calendar size={20} />, label: "Chương trình" },
    { to: "/admin/community", icon: <MessageSquare size={20} />, label: "Cộng đồng" },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-xl transition-all duration-300 z-40 ${sidebarOpen ? "w-64" : "w-20"
          }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-100">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl group-hover:rotate-12">
                <svg className="w-6 h-6 text-white transition-transform duration-200 group-hover:rotate-[-12deg]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 transition-all duration-200 group-hover:text-gray-700 group-hover:tracking-wide">
                  VieGym
                </div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg mx-auto transition-all duration-200 hover:scale-110 hover:shadow-xl hover:rotate-12 group">
              <svg className="w-6 h-6 text-white transition-transform duration-200 group-hover:rotate-[-12deg]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" />
              </svg>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.to)
                  ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-lg shadow-slate-500/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              <span className={isActive(item.to) ? "text-white" : "text-slate-400 group-hover:text-slate-700"}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {sidebarOpen && isActive(item.to) && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"
          }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navItems.find((item) => isActive(item.to))?.label || "Tổng quan"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Chào mừng trở lại, {user?.fullName || "Admin"}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Search */}
              {/* <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div> */}

              {/* User Profile */}
              {user && (
                <div className="relative flex items-center gap-3 pl-4 border-l border-gray-200">
                  <UserMenu user={user} />
                </div>
              )}

            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Loading Overlay when Logging Out */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-white animate-spin" />
            <p className="text-white font-semibold text-lg">Đang thoát...</p>
          </div>
        </div>
      )}
    </div>
  );
}