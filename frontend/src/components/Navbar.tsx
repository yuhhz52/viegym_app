import { Link, NavLink } from "react-router-dom"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import Logo from "./Logo"
import { ThemeToggle } from "./ThemeToggle"


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-[#212121] dark:text-white font-semibold border-b-2 border-[#212121] dark:border-white"
      : "text-gray-600 dark:text-gray-300 hover:text-[#212121] dark:hover:text-white transition-colors duration-200"

  return (
    <header className="fixed top-0 left-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50 shadow-sm transition-colors">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Logo/>
        {/* Desktop Menu */}
        <nav className="hidden lg:flex items-center">
          <ul className="flex gap-6 lg:gap-10 xl:gap-14 text-[16px] font-bold list-none">
            <li><NavLink to="/fr/explore" className={navLinkClass}>Chương trình luyện tập</NavLink></li>
            <li><NavLink to="/fr/exercises" className={navLinkClass}>Bài tập</NavLink></li>
            <li><NavLink to="/fr/community" className={navLinkClass}>Cộng đồng</NavLink></li>
            <li><NavLink to="/fr/helps" className={navLinkClass}>Hỗ trợ</NavLink></li>
          </ul>
        </nav>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/auth/login"
              className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-2 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Đăng nhập
            </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            className="p-2 text-gray-800 hover:bg-gray-100 rounded-lg transition"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden bg-white border-t border-gray-200 shadow-md overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[500px] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
        }`}
      >
        <ul className="flex flex-col items-start gap-4 px-6 text-[16px] font-medium">
          <li><NavLink to="/fr/workouts" className={navLinkClass}>Chương trình luyện tập</NavLink></li>
          <li><NavLink to="/fr/exercises" className={navLinkClass}>Bài tập</NavLink></li>
          <li><NavLink to="/fr/community" className={navLinkClass}>Cộng đồng</NavLink></li>
          <li><NavLink to="/fr/helps" className={navLinkClass}>Hỗ trợ</NavLink></li>
        </ul>

        {/* Mobile Account/Login */}
        <div className="mt-4 px-6">
            <Link
              to="/auth/login"
              className="block w-full text-center bg-gray-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Đăng nhập
            </Link>
        </div>
      </div>
    </header>
  )
}
