import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Trash2, Lock, Unlock, Users } from "lucide-react";
import type { UserResponse } from "./type";

interface UserTableProps {
  users: UserResponse[];
  currentUserId?: string;
  currentUserRoles?: string[];
  selectedUserIds: Set<string>;
  onToggleSelection: (userId: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  onDisable: (user: UserResponse) => void;
  onEnable: (user: UserResponse) => void;
}

export function UserTable({
  users,
  currentUserId,
  currentUserRoles = [],
  selectedUserIds,
  onToggleSelection,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onDisable,
  onEnable,
}: UserTableProps) {
  const isSuperAdmin = currentUserRoles.includes("ROLE_SUPER_ADMIN");
  
  const canDeleteUser = (user: UserResponse) => {
    // Cannot delete yourself
    if (user.id === currentUserId) return false;
    
    // Check if target is admin or super admin
    const targetRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    const isTargetAdmin = targetRoles.some(r => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN");
    
    // Only super admin can delete admin/super admin
    if (isTargetAdmin && !isSuperAdmin) return false;
    
    return true;
  };
  
  const canDisableUser = (user: UserResponse) => {
    // Cannot disable yourself
    if (user.id === currentUserId) return false;
    
    // Check if target is admin or super admin
    const targetRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    const isTargetAdmin = targetRoles.some(r => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN");
    
    // Only super admin can disable admin/super admin
    if (isTargetAdmin && !isSuperAdmin) return false;
    
    return true;
  };

  const canEditUser = (user: UserResponse) => {
    // Check if target is admin or super admin
    const targetRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    const isTargetAdmin = targetRoles.some(r => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN");
    
    // Only super admin can edit admin/super admin
    if (isTargetAdmin && !isSuperAdmin) return false;
    
    return true;
  };

  const getRoleBadge = (role: string, roleAssignments?: any[]) => {
    const roleMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "ROLE_SUPER_ADMIN": { label: "Super Admin", variant: "destructive" },
      "ROLE_ADMIN": { label: "Quản trị viên", variant: "default" },
      "ROLE_COACH": { label: "Huấn luyện viên", variant: "secondary" },
      "ROLE_USER": { label: "Người dùng", variant: "outline" },
    };
    const config = roleMap[role] || { label: role, variant: "outline" };
    
    const assignment = roleAssignments?.find(a => a.roleName === role);
    const tooltip = assignment?.assignedByName 
      ? `Được gán bởi: ${assignment.assignedByName} (${assignment.assignedByEmail})\nVào lúc: ${new Date(assignment.assignedAt).toLocaleString('vi-VN')}`
      : undefined;
    
    return (
      <Badge 
        variant={config.variant} 
        className="font-normal" 
        title={tooltip}
      >
        {config.label}
      </Badge>
    );
  };

  const isAdmin = (user: UserResponse) => {
    const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    return roles.some(r => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN");
  };

  const getStatusBadge = (status?: string, isActive?: boolean) => {
    const normalized = (
      status ??
      (typeof isActive === "boolean" ? (isActive ? "ACTIVE" : "INACTIVE") : "INACTIVE")
    ).toUpperCase();

    const statusMap: Record<string, { className: string; label: string }> = {
      ACTIVE: {
        className: "bg-green-50 text-green-700 border-green-200",
        label: "Hoạt động",
      },
      INACTIVE: {
        className: "bg-gray-50 text-gray-700 border-gray-200",
        label: "Không hoạt động",
      },
      SUSPENDED: {
        className: "bg-red-50 text-red-700 border-red-200",
        label: "Bị khóa",
      },
    };

    const config = statusMap[normalized] ?? statusMap.INACTIVE;
    return (
      <Badge variant="outline" className={`font-normal ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusNormalized = (status?: string, isActive?: boolean) => {
    return (
      status ??
      (typeof isActive === "boolean" && isActive ? "ACTIVE" : "INACTIVE")
    ).toUpperCase();
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left p-4 font-semibold text-sm text-slate-700 w-12">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 cursor-pointer"
                    checked={selectedUserIds.size === users.length && users.length > 0}
                    onChange={onToggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Họ và tên</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Email</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Số điện thoại</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Trạng thái</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Vai trò</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700 w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-slate-300" />
                      <p className="font-medium">Không tìm thấy người dùng nào</p>
                      <p className="text-sm">Thử điều chỉnh bộ lọc hoặc tìm kiếm của bạn</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentUser = currentUserId === u.id;
                  const isAdminUser = isAdmin(u);
                  return (
                  <tr
                    key={u.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150 ${
                      isCurrentUser ? "bg-blue-50/50" : ""
                    } ${
                      isAdminUser ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 cursor-pointer"
                        checked={selectedUserIds.has(u.id)}
                        onChange={() => onToggleSelection(u.id)}
                      />
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-900">{u.fullName || "-"}</span>
                    </td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4 text-slate-600">{u.phone || "-"}</td>
                    <td className="p-4">{getStatusBadge(u.status, u.isActive)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-slate-400" />
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(u.roles) && u.roles.length > 0
                            ? u.roles.map((r, idx) => {
                                const assignment = u.roleAssignments?.find(ra => ra.roleName === r);
                                return (
                                  <span 
                                    key={idx} 
                                    title={assignment?.assignedByName ? `Được gán bởi: ${assignment.assignedByName} (${assignment.assignedByEmail})\nVào lúc: ${assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString('vi-VN') : 'N/A'}` : undefined}
                                    className="cursor-help"
                                  >
                                    {getRoleBadge(r)}
                                  </span>
                                );
                              })
                            : getRoleBadge(u.role || "ROLE_USER")}
                        </div>
                        {isCurrentUser && (
                          <Badge variant="outline" className="ml-1 text-xs bg-blue-100 text-blue-700 border-blue-300">
                            Bạn
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          onClick={() => onEdit(u)}
                          disabled={!canEditUser(u)}
                          title={
                            !canEditUser(u)
                              ? "Chỉ Super Admin mới có thể chỉnh sửa Admin"
                              : "Chỉnh sửa"
                          }
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          onClick={() => onDelete(u)}
                          disabled={!canDeleteUser(u)}
                          title={
                            isCurrentUser 
                              ? "Không thể xóa chính mình" 
                              : !canDeleteUser(u)
                              ? "Chỉ Super Admin mới có thể xóa Admin"
                              : "Xóa"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        {getStatusNormalized(u.status, u.isActive) === "ACTIVE" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => onDisable(u)}
                            disabled={!canDisableUser(u)}
                            title={
                              isCurrentUser 
                                ? "Không thể khóa chính mình" 
                                : !canDisableUser(u)
                                ? "Chỉ Super Admin mới có thể khóa Admin"
                                : "Khóa tài khoản"
                            }
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                        ) : getStatusNormalized(u.status, u.isActive) === "SUSPENDED" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-green-600 hover:bg-green-50 transition-colors"
                            onClick={() => onEnable(u)}
                            title="Mở khóa tài khoản"
                          >
                            <Unlock className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
