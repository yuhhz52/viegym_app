import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

interface SidebarLinkProps {
  to: string
  icon: React.ReactNode
  label: string
}

export function SidebarLink({ to, icon, label }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
          isActive
            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}
