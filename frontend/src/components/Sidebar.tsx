import {
  Home,
  Dumbbell,
  Compass,
  BookOpen,
  LineChart,
  User,
  Bell,
  CalendarClock,
} from "lucide-react"
import { SidebarLink } from "./SidebarLink"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { UserMenu } from "./UserMenu"
import Logo from "./Logo"

export default function Sidebar() {
  const user = useSelector((state: RootState) => state.auth.user)
  return (
    <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between shadow-sm transition-colors">
      {/* Top Section */}
      <div>
       <Logo />
        {/* Menu */}
        <nav className="flex flex-col mt-6 space-y-1">
          <SidebarLink to="/" icon={<Home size={20} />} label="Trang chủ" />
          <SidebarLink to="/exercises" icon={<Dumbbell size={20} />} label="Bài tập" />
          <SidebarLink to="/explore" icon={<Compass size={20} />} label="Khám phá" />
          <SidebarLink to="/workouts" icon={<BookOpen size={20} />} label="Tập luyện" />
          <SidebarLink to="/progress" icon={<LineChart size={20} />} label="Tiến độ" />
          <SidebarLink to="/booking" icon={<CalendarClock size={20} />} label="Đặt lịch huấn luyện" />
          <SidebarLink to="/profile" icon={<User size={20} />} label="Hồ sơ" />
          <SidebarLink to="/notifications" icon={<Bell size={20} />} label="Thông báo" />
        </nav>
      </div>

      {/* Bottom User Info */}
      {user && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserMenu user={user as any} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.fullName || user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}