import { useEffect, useState } from "react"
import { getExerciseByIdAPI } from "@/api/exerciseAPI"
import { Dumbbell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import LoadingState from "@/components/LoadingState"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Exercise } from "@/pages/Exercises/Type"

interface Props {
  id: string | null
  open: boolean
  onClose: () => void
}

export function ExerciseDetailModal({ id, open, onClose }: Props) {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchExercise = async () => {
      try {
        setLoading(true)
        const data = await getExerciseByIdAPI(id)
        setExercise(data)
      } catch (err) {
        console.error("Failed to load exercise:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchExercise()
  }, [id])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl dark:bg-gray-800 dark:border-gray-700">
        {loading ? (
          <div className="py-8">
            <LoadingState message="Đang tải bài tập..." size="sm" />
          </div>
        ) : !exercise ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Không tìm thấy bài tập.</p>
        ) : (
          <Card className="shadow-none border-none dark:bg-gray-800">
            <CardContent className="p-0">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2 mb-2 dark:text-white">
                  <Dumbbell className="text-blue-500 dark:text-blue-400" /> {exercise.name}
                </DialogTitle>
              </DialogHeader>

              <div className="flex justify-center mb-6">
                <img
                  src={exercise.mediaList?.[0]?.url || "/placeholder-exercise.png"}
                  alt={exercise.name}
                  className="w-full max-h-[300px] object-contain rounded-lg bg-gray-50 dark:bg-gray-700"
                />
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <Badge variant="secondary" className="capitalize">
                  {exercise.muscleGroup}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${
                    exercise.difficulty === "HARD"
                      ? "text-red-600 border-red-300"
                      : exercise.difficulty === "MEDIUM"
                      ? "text-yellow-600 border-yellow-300"
                      : "text-green-600 border-green-300"
                  }`}
                >
                  {exercise.difficulty}
                </Badge>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {exercise.description || "Không có mô tả cho bài tập này."}
              </p>

              <Separator className="my-4 dark:bg-gray-700" />

              <div className="flex gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Số hiệp (Sets)</p>
                  <p className="text-lg font-semibold dark:text-white">
                    {exercise.metadata?.sets ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Số lần mỗi hiệp (Reps)</p>
                  <p className="text-lg font-semibold dark:text-white">
                    {exercise.metadata?.reps ?? "-"}
                  </p>
                </div>
              </div>

              {exercise.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {exercise.tags.map((tag) => (
                    <Badge key={tag} className="dark:bg-gray-700 dark:text-gray-300">{tag}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm">No tags</p>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
