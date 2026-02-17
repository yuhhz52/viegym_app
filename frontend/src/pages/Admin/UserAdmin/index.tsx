import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import { useAppSelector } from "@/store/hooks";
import {
  getAllUsersAPI,
  updateUserByIdAPI,
  deleteUserAPI,
  registerUserAPI,
  disableUserAPI,
  enableUserAPI,
  assignRoleAPI,
  removeRoleAPI,
} from "./api";
import type { UserResponse, UserCreationRequest } from "./type";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { UserPagination } from "./UserPagination";
import { UserDialogs } from "./UserDialogs";

export default function UserAdmin() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]); // Store all users
  const [users, setUsers] = useState<UserResponse[]>([]); // Current page users
  const [page, setPage] = useState(0);
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<UserCreationRequest>({
    email: "",
    fullName: "",
    password: "",
    phone: "",
  });

  // Delete confirmation dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id?: string; name?: string; type: "user" | "disable" | "enable" }>({ open: false, type: "user" });

  // Bulk delete confirmation dialog
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ open: boolean; count: number }>({ open: false, count: 0 });

  // Edit user dialog
  const [editUserModal, setEditUserModal] = useState<{ open: boolean; id?: string; email?: string; fullName?: string; phone?: string; password?: string; roles?: string[]; originalRoles?: string[] }>({ open: false });

  // Bulk selection
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.relative')) {
        setStatusDropdownOpen(false);
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Check if filters are active
  const hasFilters = query.trim() !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // If filters active, fetch all users; otherwise paginate
      const fetchSize = hasFilters ? 10000 : size;
      const fetchPage = hasFilters ? 0 : page;
      
      const data = await getAllUsersAPI(fetchPage, fetchSize);
      const usersResponse = Array.isArray(data.data) ? data.data : [];
      
      if (hasFilters) {
        setAllUsers(usersResponse);
      } else {
        setUsers(usersResponse);
        const total = data.total ?? usersResponse.length;
        setTotalElements(total);
        const pages = Math.ceil(total / size);
        setTotalPages(Math.max(pages, 1));
      }
    } catch (e) {
      console.error(e);
      setUsers([]);
      setAllUsers([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, hasFilters]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [query, roleFilter, statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sourceUsers = hasFilters ? allUsers : users;
    
    return sourceUsers.filter((u) => {
      if (roleFilter !== "ALL") {
        const roles = u.roles;
        const hasRole = Array.isArray(roles)
          ? roles.includes(roleFilter)
          : roles === roleFilter;
        if (!hasRole) return false;
      }
      if (statusFilter !== "ALL") {
        const statusValue = (
          u.status ??
          (typeof u.isActive === "boolean"
            ? (u.isActive ? "ACTIVE" : "INACTIVE")
            : "INACTIVE")
        ).toUpperCase();
        if (statusValue !== statusFilter) return false;
      }
      if (!q) return true;
      const hay = `${u.fullName || ""} ${u.email || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allUsers, users, query, roleFilter, statusFilter, hasFilters]);

  // Paginate filtered results
  const paginatedFiltered = useMemo(() => {
    if (hasFilters) {
      const start = page * size;
      const end = start + size;
      return filtered.slice(start, end);
    }
    return filtered;
  }, [filtered, page, size, hasFilters]);

  // Update total pages based on filtered results
  useEffect(() => {
    if (hasFilters) {
      setTotalElements(filtered.length);
      const pages = Math.ceil(filtered.length / size);
      setTotalPages(Math.max(pages, 1));
    }
  }, [filtered, hasFilters, size]);

  const handleEditUser = async () => {
    if (!editUserModal.id || !editUserModal.fullName?.trim()) return;
    try {
      // Update user info (without roles)
      await updateUserByIdAPI(editUserModal.id, {
        fullName: editUserModal.fullName.trim(),
        phone: editUserModal.phone,
        password: editUserModal.password || undefined,
      });

      // Handle roles separately using assignRoleAPI and removeRoleAPI
      const currentRoles = editUserModal.originalRoles || [];
      const newRoles = editUserModal.roles || [];

      // Find roles that need to be assigned (new roles that user doesn't have)
      const rolesToAssign = newRoles.filter(role => !currentRoles.includes(role));

      // Find roles that need to be removed (old roles that user no longer has)
      const rolesToRemove = currentRoles.filter(role => !newRoles.includes(role));

      // Assign each new role
      for (const role of rolesToAssign) {
        try {
          await assignRoleAPI(editUserModal.id, role);
        } catch (e) {
          console.error(`Failed to assign role ${role}:`, e);
        }
      }

      // Remove each old role
      for (const role of rolesToRemove) {
        try {
          await removeRoleAPI(editUserModal.id, role);
        } catch (e) {
          console.error(`Failed to remove role ${role}:`, e);
        }
      }

      await load();
      setEditUserModal({ open: false });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteUserAPI(deleteConfirm.id);
      await load();
      setDeleteConfirm({ open: false, type: "user" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDisable = async () => {
    if (!deleteConfirm.id) return;
    try {
      await disableUserAPI(deleteConfirm.id);
      await load();
      setDeleteConfirm({ open: false, type: "user" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmEnable = async () => {
    if (!deleteConfirm.id) return;
    try {
      await enableUserAPI(deleteConfirm.id);
      await load();
      setDeleteConfirm({ open: false, type: "user" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) return;
    
    try {
      for (const id of ids) {
        await deleteUserAPI(id);
      }
      setSelectedUserIds(new Set());
      setBulkDeleteConfirm({ open: false, count: 0 });
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filtered.length && filtered.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filtered.map(u => u.id)));
    }
  };

  const handleAddUser = async () => {
    try {
      await registerUserAPI(newUser);
      setIsAddDialogOpen(false);
      setNewUser({ email: "", fullName: "", password: "", phone: "" });
      await load();
    } catch (e) {
      console.error(e);
    }
  };



  if (loading) {
    return <LoadingState message="Đang tải danh sách người dùng..." fullScreen />;
  }

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                Danh sách người dùng
              </h1>
              <p className="text-slate-500 mt-1">Quản lý người dùng và vai trò của họ</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 hover:bg-slate-100 transition-colors">
                <Mail className="w-4 h-4" />
                Mời người dùng
              </Button>
              <UserDialogs
              isAddDialogOpen={isAddDialogOpen}
              setIsAddDialogOpen={setIsAddDialogOpen}
              newUser={newUser}
              setNewUser={setNewUser}
              onAddUser={handleAddUser}
              isAddingUser={false}
              editUserModal={editUserModal}
              setEditUserModal={setEditUserModal}
              onEditUser={handleEditUser}
              isEditingUser={false}
              deleteConfirm={deleteConfirm}
              setDeleteConfirm={setDeleteConfirm}
              onConfirmDelete={handleConfirmDelete}
              onConfirmDisable={handleConfirmDisable}
              onConfirmEnable={handleConfirmEnable}
              isDeletingUser={false}
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
        <UserFilters
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusDropdownOpen={statusDropdownOpen}
          setStatusDropdownOpen={setStatusDropdownOpen}
          roleDropdownOpen={roleDropdownOpen}
          setRoleDropdownOpen={setRoleDropdownOpen}
          selectedCount={selectedUserIds.size}
          onBulkDelete={() => {
            setBulkDeleteConfirm({ open: true, count: selectedUserIds.size });
          }}
        />

        {/* Table */}
        <UserTable
          users={paginatedFiltered}
          currentUserId={currentUser?.id}
          currentUserRoles={currentUser?.roles || []}
          selectedUserIds={selectedUserIds}
          onToggleSelection={toggleUserSelection}
          onToggleSelectAll={toggleSelectAll}
          onEdit={(user) => {
            const userRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
            setEditUserModal({
              open: true,
              id: user.id,
              email: user.email,
              fullName: user.fullName || "",
              phone: user.phone || "",
              roles: userRoles,
              originalRoles: userRoles
            });
          }}
          onDelete={(user) => setDeleteConfirm({ open: true, id: user.id, name: user.fullName || user.email, type: "user" })}
          onDisable={(user) => setDeleteConfirm({ open: true, id: user.id, name: user.fullName || user.email, type: "disable" })}
          onEnable={(user) => setDeleteConfirm({ open: true, id: user.id, name: user.fullName || user.email, type: "enable" })}
        />

        {/* Pagination */}
        <UserPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          size={size}
          filteredCount={filtered.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}