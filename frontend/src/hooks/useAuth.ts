import { useEffect, useState } from "react"
import apiClient from "../api/apiClient"

type User = {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  roles: string[]
}

type ApiResponse<T> = {
  code: number
  message: string
  result: T
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

   useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get<ApiResponse<User>>("/api/user/my-info")
        setUser(res.data.result)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])


  return { user, setUser, isLoading }
}
