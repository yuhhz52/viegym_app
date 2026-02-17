import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Link } from "react-router-dom"
import { useLogout } from "@/hooks/useLogout"
import { useState } from "react"
import { LogOut } from "lucide-react"
import type { UserInfo } from "@/types/auth"

interface UserMenuProps {
  user: (UserInfo & {
    avatarUrl?: string
  }) | null
}

export function UserMenu({ user }: UserMenuProps) {
  if (!user) return null
  
  const { logout, isLoggingOut } = useLogout()
  const [imgError, setImgError] = useState(false)

const initials =
  user.fullName?.trim()
    ? user.fullName.charAt(0).toUpperCase()
    : user.email
    ? user.email.charAt(0).toUpperCase()
    : "U"

const avatarSrc =
  !imgError && user.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? `${user.avatarUrl}?t=${Date.now()}` // Add timestamp to bust cache
      : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/media/${user.avatarUrl}?t=${Date.now()}`
    : ""

// Debug logging
console.log("[UserMenu] User avatar URL:", user.avatarUrl)
console.log("[UserMenu] Avatar src:", avatarSrc)


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer h-10 w-10 border" key={user.avatarUrl || 'no-avatar'}>
          {/* Nếu có avatar thì hiển thị, nếu lỗi hoặc rỗng thì fallback dùng chữ */}
          {avatarSrc && (
            <AvatarImage
              src={avatarSrc}
              alt={user.fullName || user.email || "User avatar"}
              onError={() => setImgError(true)}
              key={avatarSrc} // Force re-render when URL changes
            />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">Hồ sơ</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          disabled={isLoggingOut}
          className="text-red-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <LogOut className={`w-4 h-4 ${isLoggingOut ? "animate-spin" : ""}`} />
          {isLoggingOut ? "Đang thoát..." : "Đăng xuất"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
