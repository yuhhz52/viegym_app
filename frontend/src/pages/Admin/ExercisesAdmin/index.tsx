import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LoadingState from "@/components/LoadingState";
import {
  getExercisesAPI,
  deleteExerciseAPI,
  createExerciseAPI,
  updateExerciseAPI,
} from "./api";
import type { Exercise } from "./type";
import { ExercisesFilters } from "./ExercisesFilters";
import { ExercisesTable } from "./ExercisesTable";
import { ExercisesDialogs } from "./ExercisesDialogs";
import { ExercisesPagination } from "./ExercisesPagination";

import type { ExerciseMedia } from "./type";

interface ExerciseFormData {
  name: string;
  description: string;
  muscleGroup: string;
  difficulty: string;
  tags: string;
  mediaList?: ExerciseMedia[];
}

export default function ExercisesAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ open: boolean; count: number }>({ open: false, count: 0 });

  // Bulk selection
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());

  const [difficultyDropdownOpen, setDifficultyDropdownOpen] = useState(false);
  const [muscleGroupDropdownOpen, setMuscleGroupDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.relative')) {
        setDifficultyDropdownOpen(false);
        setMuscleGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if any filters are active
  const hasFilters = query.trim().length > 0 || difficultyFilter !== "ALL" || muscleGroupFilter !== "ALL";
  const fetchSize = hasFilters ? 1000 : size; // Fetch all when filters active
  const fetchPage = hasFilters ? 0 : page; // Fetch from beginning when filters active

  // Lấy danh sách exercises
  const { data: exercisesData, isLoading } = useQuery({
    queryKey: ["admin-exercises", fetchPage, fetchSize, difficultyFilter, muscleGroupFilter],
    queryFn: () => getExercisesAPI({ 
      page: fetchPage, 
      size: fetchSize,
      difficulty: difficultyFilter !== "ALL" ? difficultyFilter : undefined,
      muscleGroup: muscleGroupFilter !== "ALL" ? muscleGroupFilter : undefined,
    }),
  });

  const allExercises = exercisesData?.exercises || [];
  const totalElementsFromServer = exercisesData?.totalElements || 0;
  const totalPagesFromServer = Math.max(exercisesData?.totalPages || 1, 1);

  // Filter exercises theo tên tìm kiếm (client-side)
  const filteredExercises = query.trim().length > 0
    ? allExercises.filter((ex) =>
        ex.name.toLowerCase().includes(query.toLowerCase())
      )
    : allExercises;

  // Reset page về 0 khi query thay đổi
  useEffect(() => {
    setPage(0);
  }, [query]);

  // Reset page về 0 khi filter thay đổi
  useEffect(() => {
    setPage(0);
  }, [difficultyFilter, muscleGroupFilter]);

  // Xóa exercise
  const deleteExercise = useMutation({
    mutationFn: deleteExerciseAPI,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-exercises"] }),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    const newSelected = new Set(selectedExerciseIds);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedExerciseIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedExerciseIds.size === displayExercises.length && displayExercises.length > 0) {
      setSelectedExerciseIds(new Set());
    } else {
      setSelectedExerciseIds(new Set(displayExercises.map(ex => ex.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedExerciseIds);
    if (ids.length === 0) return;
    
    const results = { success: 0, failed: 0, notFound: 0 };
    
    try {
      for (const id of ids) {
        try {
          await deleteExerciseAPI(id);
          results.success++;
        } catch (e: any) {
          // If exercise not found (404), count as success (already deleted)
          if (e?.response?.status === 404) {
            results.notFound++;
          } else {
            results.failed++;
            console.error(`Failed to delete exercise ${id}:`, e);
          }
        }
      }
      
      // Refresh the list if any deletions were attempted
      if (results.success > 0 || results.notFound > 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
      }
      
      setSelectedExerciseIds(new Set());
      setBulkDeleteConfirm({ open: false, count: 0 });
      
      // Show notification if there were any failures
      if (results.failed > 0) {
        // You might want to show a toast/notification here
        console.warn(`${results.failed} exercise(s) failed to delete`);
      }
    } catch (e) {
      console.error("Bulk delete error:", e);
    }
  };

  // Khi có filters: paginate client-side trên filteredExercises
  // Khi không có filters: dùng trực tiếp data từ server (đã được paginate)
  const displayExercises = hasFilters
    ? (() => {
        const startIndex = page * size;
        const endIndex = startIndex + size;
        return filteredExercises.slice(startIndex, endIndex);
      })()
    : allExercises; // Backend đã paginate rồi, dùng trực tiếp
  
  // Tính toán pagination
  const totalElements = hasFilters ? filteredExercises.length : totalElementsFromServer;
  const totalPages = hasFilters 
    ? Math.ceil(filteredExercises.length / size) 
    : totalPagesFromServer;

  // Tạo exercise
  const createExercise = useMutation({
    mutationFn: createExerciseAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
      setNewExercise({
        name: "",
        description: "",
        muscleGroup: "",
        difficulty: "",
        tags: "",
        mediaList: [],
      });
    },
  });

  // Cập nhật exercise
  const updateExercise = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      updateExerciseAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
      setEditingExercise(null);
    },
  });

  // State form
  const [newExercise, setNewExercise] = useState<ExerciseFormData>({
    name: "",
    description: "",
    muscleGroup: "",
    difficulty: "",
    tags: "",
    mediaList: [],
  });

  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const handleCreateExercise = () => {
    const tagsArray = newExercise.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const exerciseData: any = {
      name: newExercise.name,
      description: newExercise.description || undefined,
      muscleGroup: newExercise.muscleGroup || undefined,
      difficulty: newExercise.difficulty || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    };

    // Add mediaList if exists (without id for request)
    if (newExercise.mediaList && newExercise.mediaList.length > 0) {
      exerciseData.mediaList = newExercise.mediaList.map((media, index) => ({
        mediaType: media.mediaType,
        url: media.url,
        caption: media.caption || undefined,
        orderNo: index,
      }));
    }

    createExercise.mutate(exerciseData);
  };

  const handleUpdateExercise = () => {
    if (!editingExercise) return;

    const tagsArray = editingExercise.tags
      ? Array.isArray(editingExercise.tags)
        ? editingExercise.tags
        : []
      : [];

    const updateData: any = {
      name: editingExercise.name,
      description: editingExercise.description,
      muscleGroup: editingExercise.muscleGroup,
      difficulty: editingExercise.difficulty,
      tags: tagsArray,
    };

    // Add mediaList if exists (without id for request)
    if (editingExercise.mediaList && editingExercise.mediaList.length > 0) {
      updateData.mediaList = editingExercise.mediaList.map((media, index) => ({
        mediaType: media.mediaType,
        url: media.url,
        caption: media.caption || undefined,
        orderNo: index,
      }));
    }

    updateExercise.mutate({
      id: editingExercise.id,
      data: updateData,
    });
  };

  if (isLoading)
    return <LoadingState message="Đang tải danh sách bài tập..." fullScreen />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                Danh sách bài tập
              </h1>
              <p className="text-slate-500 mt-1">Quản lý các bài tập và thông tin liên quan</p>
            </div>
            <div className="flex gap-3">
              <ExercisesDialogs
              isAddDialogOpen={isAddDialogOpen}
              setIsAddDialogOpen={setIsAddDialogOpen}
              newExercise={newExercise}
              setNewExercise={setNewExercise}
              onCreateExercise={handleCreateExercise}
              isCreating={createExercise.isPending}
              editingExercise={editingExercise}
              setEditingExercise={setEditingExercise}
              onUpdateExercise={handleUpdateExercise}
              isUpdating={updateExercise.isPending}
              deleteConfirm={deleteConfirm}
              setDeleteConfirm={setDeleteConfirm}
              onConfirmDelete={() => {
                if (deleteConfirm.id) {
                  deleteExercise.mutate(deleteConfirm.id);
                  setDeleteConfirm({ open: false });
                }
              }}
              isDeleting={deleteExercise.isPending}
              bulkDeleteConfirm={bulkDeleteConfirm}
              setBulkDeleteConfirm={setBulkDeleteConfirm}
              onConfirmBulkDelete={handleBulkDelete}
            />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Filters */}
        <ExercisesFilters 
          query={query} 
          setQuery={setQuery}
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          muscleGroupFilter={muscleGroupFilter}
          setMuscleGroupFilter={setMuscleGroupFilter}
          difficultyDropdownOpen={difficultyDropdownOpen}
          setDifficultyDropdownOpen={setDifficultyDropdownOpen}
          muscleGroupDropdownOpen={muscleGroupDropdownOpen}
          setMuscleGroupDropdownOpen={setMuscleGroupDropdownOpen}
          selectedCount={selectedExerciseIds.size}
          onBulkDelete={() => {
            setBulkDeleteConfirm({ open: true, count: selectedExerciseIds.size });
          }}
        />

        {/* Table */}
        <ExercisesTable
          exercises={displayExercises}
          page={page}
          size={size}
          selectedExerciseIds={selectedExerciseIds}
          onToggleSelection={toggleExerciseSelection}
          onToggleSelectAll={toggleSelectAll}
          onEdit={(exercise) => setEditingExercise(exercise)}
          onDelete={(exercise) => {
            setDeleteConfirm({ open: true, id: exercise.id, name: exercise.name });
          }}
          isDeletePending={deleteExercise.isPending}
        />

        {/* Pagination */}
        <ExercisesPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          size={size}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

