import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, UserPlus, Pencil, Dumbbell } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import { getAllProgramsAPI, createProgramAPI, updateProgramAPI, deleteProgramAPI } from "@/pages/Admin/ProgramsAdmin/api";
import type { ProgramResponse, ProgramRequest } from "@/pages/Admin/ProgramsAdmin/type";
import { AddEditProgramDialog, DeleteProgramDialog } from "@/pages/Admin/ProgramsAdmin/ProgramsDialogs";
import { ProgramExercisesDialog } from "@/pages/Admin/ProgramsAdmin/ProgramExercisesDialog";
import { AssignProgramDialog } from "./AssignProgramDialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function CoachPrograms() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [exercisesDialogOpen, setExercisesDialogOpen] = useState(false);
  const [selectedProgramForExercises, setSelectedProgramForExercises] = useState<ProgramResponse | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [programToAssign, setProgramToAssign] = useState<{ id: string; name: string } | null>(null);
 
  const [currentProgram, setCurrentProgram] = useState<ProgramRequest>({
    title: "",
    description: "",
    goal: "GENERAL_FITNESS",
    durationWeeks: 4,
    visibility: "PUBLIC",
    mediaList: []
  });
  
  const [editingId, setEditingId] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string>("");
  const [deletingName, setDeletingName] = useState<string>("");
  const [selectedProgramIds, setSelectedProgramIds] = useState<Set<string>>(new Set());

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const data = await getAllProgramsAPI();
      // Filter only programs created by current coach
      const myPrograms = data.filter(p => p.createdBy === user?.id);
      setPrograms(myPrograms);
      setFilteredPrograms(myPrograms);
    } catch (error) {
      console.error("Failed to fetch programs:", error);
      toast.error("Không thể tải danh sách chương trình");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    const filtered = programs.filter(p =>
      (p.title || p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPrograms(filtered);
  }, [searchQuery, programs]);

  const handleAdd = () => {
    setCurrentProgram({
      title: "",
      description: "",
      goal: "GENERAL_FITNESS",
      durationWeeks: 4,
      visibility: "PUBLIC",
      mediaList: []
    });
    setAddDialogOpen(true);
  };

  const handleEdit = (program: ProgramResponse) => {
    setCurrentProgram({
      title: program.title || program.name || "",
      description: program.description,
      goal: program.goal || program.level || "GENERAL_FITNESS",
      durationWeeks: program.durationWeeks,
      visibility: program.visibility || "PUBLIC",
      mediaList: (program as any).mediaList || []
    });
    setEditingId(program.id);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setDeletingId(id);
    setDeletingName(name);
    setDeleteDialogOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!currentProgram.title.trim()) {
      toast.error("Vui lòng nhập tên chương trình");
      return;
    }
    try {
      await createProgramAPI(currentProgram);
      toast.success("Thêm chương trình thành công");
      setAddDialogOpen(false);
      fetchPrograms();
    } catch (error) {
      console.error("Failed to create program:", error);
      toast.error("Không thể thêm chương trình");
    }
  };

  const handleSaveEdit = async () => {
    if (!currentProgram.title.trim()) {
      toast.error("Vui lòng nhập tên chương trình");
      return;
    }
    try {
      await updateProgramAPI(editingId, currentProgram);
      toast.success("Cập nhật chương trình thành công");
      setEditDialogOpen(false);
      fetchPrograms();
    } catch (error) {
      console.error("Failed to update program:", error);
      toast.error("Không thể cập nhật chương trình");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProgramAPI(deletingId);
      toast.success("Xóa chương trình thành công");
      setDeleteDialogOpen(false);
      fetchPrograms();
    } catch (error) {
      console.error("Failed to delete program:", error);
      toast.error("Không thể xóa chương trình");
    }
  };

  const toggleProgramSelection = (programId: string) => {
    setSelectedProgramIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProgramIds.size === filteredPrograms.length && filteredPrograms.length > 0) {
      setSelectedProgramIds(new Set());
    } else {
      setSelectedProgramIds(new Set(filteredPrograms.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedProgramIds);
    if (ids.length === 0) return;
    
    try {
      for (const id of ids) {
        await deleteProgramAPI(id);
      }
      setSelectedProgramIds(new Set());
      toast.success(`Đã xóa ${ids.length} chương trình`);
      setBulkDeleteDialogOpen(false);
      fetchPrograms();
    } catch (error) {
      console.error("Failed to bulk delete:", error);
      toast.error("Không thể xóa chương trình");
    }
  };

  const handleViewExercises = (program: ProgramResponse) => {
    setSelectedProgramForExercises(program);
    setExercisesDialogOpen(true);
  };

  const handleAssignProgram = (program: ProgramResponse) => {
    setProgramToAssign({ id: program.id, name: program.title || program.name || "" });
    setAssignDialogOpen(true);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Chương trình của tôi
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Tổng số: <span className="font-semibold">{filteredPrograms.length}</span> chương trình
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="bg-slate-900 hover:bg-slate-800 whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Tạo chương trình
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">

      {/* Search + Actions Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm chương trình..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 md:flex-shrink-0">
          {selectedProgramIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa ({selectedProgramIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 cursor-pointer"
                    checked={selectedProgramIds.size === filteredPrograms.length && filteredPrograms.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tên chương trình</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Mục tiêu</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Thời lượng</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Hiển thị</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Chưa có chương trình nào
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((program) => (
                  <tr key={program.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 cursor-pointer"
                        checked={selectedProgramIds.has(program.id)}
                        onChange={() => toggleProgramSelection(program.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {program.title || program.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {program.goal || program.level || "Chung"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {program.durationWeeks} tuần
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.visibility === "PUBLIC" 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {program.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAssignProgram(program)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          title="Gán cho học viên"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewExercises(program)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                          title="Quản lý bài tập"
                        >
                          <Dumbbell className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(program)}
                          className="text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(program.id, program.title || program.name || "")}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <AddEditProgramDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleSaveAdd}
        program={currentProgram}
        setProgram={setCurrentProgram}
        isEdit={false}
      />

      <AddEditProgramDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveEdit}
        program={currentProgram}
        setProgram={setCurrentProgram}
        isEdit={true}
      />

      <DeleteProgramDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        programName={deletingName}
      />

      {/* Bulk Delete Dialog */}
      <DeleteProgramDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        programName={`${selectedProgramIds.size} chương trình`}
      />

      {/* Exercise Management Dialog */}
      {selectedProgramForExercises && (
        <ProgramExercisesDialog
          open={exercisesDialogOpen}
          onClose={() => {
            setExercisesDialogOpen(false);
            setSelectedProgramForExercises(null);
          }}
          program={selectedProgramForExercises}
        />
      )}

      {/* Assign Program Dialog */}
      {programToAssign && (
        <AssignProgramDialog
          open={assignDialogOpen}
          onClose={() => {
            setAssignDialogOpen(false);
            setProgramToAssign(null);
          }}
          programId={programToAssign.id}
          programName={programToAssign.name}
        />
      )}

      </div>
    </div>
  );
}
