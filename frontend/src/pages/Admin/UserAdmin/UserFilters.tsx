import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Search, Filter, Users } from "lucide-react";

interface UserFiltersProps {
  query: string;
  setQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusDropdownOpen: boolean;
  setStatusDropdownOpen: (open: boolean) => void;
  roleDropdownOpen: boolean;
  setRoleDropdownOpen: (open: boolean) => void;
  selectedCount: number;
  onBulkDelete: () => void;
}

export function UserFilters({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  statusDropdownOpen,
  setStatusDropdownOpen,
  roleDropdownOpen,
  setRoleDropdownOpen,
  selectedCount,
  onBulkDelete,
}: UserFiltersProps) {
  const getStatusLabel = (value: string) => {
    const labels: Record<string, string> = {
      ALL: "Tất cả",
      ACTIVE: "Hoạt động",
      INACTIVE: "Không hoạt động",
      SUSPENDED: "Bị khóa",
    };
    return labels[value] || value;
  };

  const getRoleLabel = (value: string) => {
    const labels: Record<string, string> = {
      ALL: "Tất cả",
      ROLE_USER: "Người dùng",
      ROLE_COACH: "Huấn luyện viên",
      ROLE_ADMIN: "Quản trị viên",
      ROLE_SUPER_ADMIN: "Super Admin",
    };
    return labels[value] || value;
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search Box */}
      <div className="relative w-[400px] flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Tìm kiếm người dùng..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-white border-slate-200 focus-visible:ring-slate-400 transition-all"
        />
      </div>

      {/* Status Filter Dropdown */}
      <div className="relative w-[240px] flex-shrink-0">
        <button
          onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-600 text-sm whitespace-nowrap">Trạng thái:</span>
            <span className="font-medium text-sm truncate flex-1">{getStatusLabel(statusFilter)}</span>
            <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {statusDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
            <div className="py-1">
              {[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'INACTIVE', label: 'Không hoạt động' },
                { value: 'SUSPENDED', label: 'Bị khóa' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setStatusDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 transition-colors ${statusFilter === option.value ? 'bg-slate-50 font-medium' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role Filter Dropdown */}
      <div className="relative w-[240px] flex-shrink-0">
        <button
          onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-600 text-sm whitespace-nowrap">Vai trò:</span>
            <span className="font-medium text-sm truncate flex-1">{getRoleLabel(roleFilter)}</span>
            <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {roleDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
            <div className="py-1">
              {[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'ROLE_USER', label: 'Người dùng' },
                { value: 'ROLE_COACH', label: 'Huấn luyện viên' },
                { value: 'ROLE_ADMIN', label: 'Quản trị viên' },
                { value: 'ROLE_SUPER_ADMIN', label: 'Super Admin' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setRoleFilter(option.value);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 transition-colors ${roleFilter === option.value ? 'bg-slate-50 font-medium' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      {selectedCount === 0 && <div className="flex-1 min-w-0" />}

      {/* Bulk Delete Button */}
      {selectedCount > 0 && (
        <Button
          variant="destructive"
          className="gap-2 ml-auto"
          onClick={onBulkDelete}
        >
          <Trash2 className="w-4 h-4" />
          Xóa ({selectedCount})
        </Button>
      )}
    </div>
  );
}
