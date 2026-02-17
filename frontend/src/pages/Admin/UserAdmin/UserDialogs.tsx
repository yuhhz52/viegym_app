import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import type { UserCreationRequest } from "./type";

interface UserDialogsProps {
  // Add User Dialog
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  newUser: UserCreationRequest;
  setNewUser: (user: UserCreationRequest) => void;
  onAddUser: () => void;
  isAddingUser: boolean;

  // Edit User Dialog
  editUserModal: { open: boolean; id?: string; email?: string; fullName?: string; phone?: string; password?: string; roles?: string[]; originalRoles?: string[] };
  setEditUserModal: (modal: any) => void;
  onEditUser: () => void;
  isEditingUser: boolean;

  // Delete Confirmation Dialog
  deleteConfirm: { open: boolean; id?: string; name?: string; type: "user" | "disable" | "enable" };
  setDeleteConfirm: (confirm: any) => void;
  onConfirmDelete: () => void;
  onConfirmDisable: () => void;
  onConfirmEnable: () => void;
  isDeletingUser: boolean;

  // Bulk Delete Confirmation Dialog
  bulkDeleteConfirm: { open: boolean; count: number };
  setBulkDeleteConfirm: (confirm: { open: boolean; count: number }) => void;
  onConfirmBulkDelete: () => void;
}

export function UserDialogs({
  // Add User
  isAddDialogOpen,
  setIsAddDialogOpen,
  newUser,
  setNewUser,
  onAddUser,
  isAddingUser,

  // Edit User
  editUserModal,
  setEditUserModal,
  onEditUser,
  isEditingUser,

  // Delete
  deleteConfirm,
  setDeleteConfirm,
  onConfirmDelete,
  onConfirmDisable,
  onConfirmEnable,
  isDeletingUser,

  // Bulk Delete
  bulkDeleteConfirm,
  setBulkDeleteConfirm,
  onConfirmBulkDelete,
}: UserDialogsProps) {
  return (
    <>
      {/* ADD USER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 bg-slate-900 hover:bg-slate-800 transition-colors">
            <UserPlus className="w-4 h-4" />
            Thêm người dùng
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản người dùng mới với thông tin chi tiết
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="0335233755"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={onAddUser} disabled={isAddingUser} className="bg-slate-900 hover:bg-slate-800">
              {isAddingUser ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={editUserModal.open} onOpenChange={(open) => {
        if (!open) setEditUserModal({ open: false });
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editUserModal.email || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFullName">Họ và tên</Label>
              <Input
                id="editFullName"
                value={editUserModal.fullName || ""}
                onChange={(e) => setEditUserModal({ ...editUserModal, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Số điện thoại</Label>
              <Input
                id="editPhone"
                value={editUserModal.phone || ""}
                onChange={(e) => setEditUserModal({ ...editUserModal, phone: e.target.value })}
                placeholder="0123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPassword">Mật khẩu (để trống nếu không thay đổi)</Label>
              <Input
                id="editPassword"
                type="password"
                value={editUserModal.password || ""}
                onChange={(e) => setEditUserModal({ ...editUserModal, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <div className="space-y-2">
                {["ROLE_USER", "ROLE_COACH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"].map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`role-${role}`}
                      checked={(editUserModal.roles || []).includes(role)}
                      onChange={(e) => {
                        const roles = editUserModal.roles || [];
                        if (e.target.checked) {
                          setEditUserModal({ ...editUserModal, roles: [...roles, role] });
                        } else {
                          setEditUserModal({ ...editUserModal, roles: roles.filter((r) => r !== role) });
                        }
                      }}
                      className="rounded border-slate-300 cursor-pointer"
                    />
                    <label htmlFor={`role-${role}`} className="text-sm cursor-pointer">
                      {role === "ROLE_USER" && "Người dùng"}
                      {role === "ROLE_COACH" && "Huấn luyện viên"}
                      {role === "ROLE_ADMIN" && "Quản trị viên"}
                      {role === "ROLE_SUPER_ADMIN" && "Super Admin"}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserModal({ open: false })}>
              Hủy
            </Button>
            <Button
              onClick={onEditUser}
              disabled={isEditingUser || !editUserModal.fullName?.trim()}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {isEditingUser ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE/DISABLE/ENABLE CONFIRMATION DIALOG */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => {
        if (!open) setDeleteConfirm({ open: false, type: "user" });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteConfirm.type === "user" && "Xóa người dùng"}
              {deleteConfirm.type === "disable" && "Khóa tài khoản"}
              {deleteConfirm.type === "enable" && "Mở khóa tài khoản"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            {deleteConfirm.type === "user" && `Bạn có chắc chắn muốn xóa vĩnh viễn người dùng "${deleteConfirm.name}"? Hành động này không thể hoàn tác.`}
            {deleteConfirm.type === "disable" && `Bạn có chắc chắn muốn khóa tài khoản "${deleteConfirm.name}"?`}
            {deleteConfirm.type === "enable" && `Bạn có chắc chắn muốn mở khóa tài khoản "${deleteConfirm.name}"?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, type: "user" })}>
              Hủy
            </Button>
            <Button
              variant={deleteConfirm.type === "user" ? "destructive" : "default"}
              onClick={() => {
                if (deleteConfirm.type === "user") onConfirmDelete();
                else if (deleteConfirm.type === "disable") onConfirmDisable();
                else if (deleteConfirm.type === "enable") onConfirmEnable();
              }}
              disabled={isDeletingUser}
            >
              {deleteConfirm.type === "user" && (isDeletingUser ? "Đang xóa..." : "Xóa")}
              {deleteConfirm.type === "disable" && (isDeletingUser ? "Đang khóa..." : "Khóa")}
              {deleteConfirm.type === "enable" && (isDeletingUser ? "Đang mở khóa..." : "Mở khóa")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK DELETE CONFIRMATION DIALOG */}
      <Dialog open={bulkDeleteConfirm.open} onOpenChange={(open) => {
        if (!open) setBulkDeleteConfirm({ open: false, count: 0 });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa người dùng</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa vĩnh viễn {bulkDeleteConfirm.count} người dùng? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirm({ open: false, count: 0 })}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmBulkDelete}
            >
              Xóa {bulkDeleteConfirm.count} người dùng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
