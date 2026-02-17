import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import { getAllProgramsAPI, createProgramAPI, updateProgramAPI, deleteProgramAPI } from "./api";
import type { ProgramResponse, ProgramRequest } from "./type";
import { ProgramsTable } from "./ProgramsTable";
import { AddEditProgramDialog, DeleteProgramDialog } from "./ProgramsDialogs";
import { ProgramExercisesDialog } from "./ProgramExercisesDialog";
import { toast } from "sonner";

export default function ProgramsAdmin() {
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState<string>("ALL");
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [exercisesDialogOpen, setExercisesDialogOpen] = useState(false);
  const [selectedProgramForExercises, setSelectedProgramForExercises] = useState<ProgramResponse | null>(null);
  
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
      setPrograms(data);
      setFilteredPrograms(data);
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
    let filtered = programs.filter(p =>
      (p.title || p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.createdByName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (goalFilter !== "ALL") {
      filtered = filtered.filter(p => (p.goal || p.level) === goalFilter);
    }
    
    setFilteredPrograms(filtered);
  }, [searchQuery, programs, goalFilter]);

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
    const newSelected = new Set(selectedProgramIds);
    if (newSelected.has(programId)) {
      newSelected.delete(programId);
    } else {
      newSelected.add(programId);
    }
    setSelectedProgramIds(newSelected);
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

  if (loading) return <LoadingState />;

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                Quản lý chương trình
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-slate-500">
                  Tổng số: <span className="font-semibold text-orange-600">{programs.length}</span> chương trình
                </p>
                {goalFilter !== "ALL" && (
                  <p className="text-slate-500">
                    Đang hiển thị: <span className="font-semibold text-blue-600">{filteredPrograms.length}</span>
                  </p>
                )}
                {selectedProgramIds.size > 0 && (
                  <p className="text-slate-500">
                    Đã chọn: <span className="font-semibold text-green-600">{selectedProgramIds.size}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="bg-slate-900 hover:bg-slate-800 whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Thêm chương trình
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">

      {/* Search + Filter + Actions Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên, mô tả, người tạo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="h-10 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap"
          >
            <option value="ALL">Tất cả mục tiêu</option>
            <option value="WEIGHT_LOSS">Giảm cân</option>
            <option value="MUSCLE_GAIN">Tăng cơ</option>
            <option value="STRENGTH">Tăng sức mạnh</option>
            <option value="ENDURANCE">Tăng sức bền</option>
            <option value="FLEXIBILITY">Tăng độ dẻo</option>
            <option value="GENERAL_FITNESS">Thể lực tổng quát</option>
          </select>
        </div>
        
        <div className="flex gap-2 md:flex-shrink-0">
          {selectedProgramIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4 mr-2"/>
              Xóa ({selectedProgramIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <ProgramsTable
        programs={filteredPrograms}
        selectedProgramIds={selectedProgramIds}
        onToggleSelection={toggleProgramSelection}
        onToggleSelectAll={toggleSelectAll}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewExercises={handleViewExercises}
      />

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
      </div>
    </div>
  );
}
