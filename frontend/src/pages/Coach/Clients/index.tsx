import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, Trash2, MessageSquare, TrendingUp, Target } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getMyClientsAPI, removeClientAPI, type ClientResponse } from "@/api/coachApi";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CoachClients() {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await getMyClientsAPI();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error("Failed to load clients:", error);
      toast.error("Không thể tải danh sách học viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = clients.filter(c =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    
    try {
      await removeClientAPI(selectedClient.id);
      toast.success("Đã xóa học viên thành công");
      setClients(clients.filter(c => c.id !== selectedClient.id));
      setDeleteDialogOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error("Failed to remove client:", error);
      toast.error("Không thể xóa học viên");
    }
  };

  const handleViewDetail = (client: ClientResponse) => {
    setSelectedClient(client);
    setDetailDialogOpen(true);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Học viên của tôi
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Tổng số: <span className="font-semibold">{filteredClients.length}</span> học viên
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm học viên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900">
              <TableHead className="font-semibold">Họ tên</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Mục tiêu</TableHead>
              <TableHead className="font-semibold">Số buổi tập</TableHead>
              <TableHead className="font-semibold">Ngày tham gia</TableHead>
              <TableHead className="font-semibold">Trạng thái</TableHead>
              <TableHead className="font-semibold text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Chưa có học viên nào
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {client.avatarUrl ? (
                        <img src={client.avatarUrl} alt={client.fullName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-semibold">
                          {client.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{client.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{client.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Target className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-gray-700 dark:text-gray-300">{client.goal || "Chưa có"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{client.totalWorkouts}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">
                    {new Date(client.joinedDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"} className={
                      client.status === "ACTIVE" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    }>
                      {client.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetail(client)}
                        className="text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedClient(client);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa học viên</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa học viên <strong>{selectedClient?.fullName}</strong>? 
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thông tin chi tiết học viên</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {selectedClient.avatarUrl ? (
                  <img src={selectedClient.avatarUrl} alt={selectedClient.fullName} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-2xl">
                    {selectedClient.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.fullName}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedClient.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Giới tính</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.gender || "Chưa cập nhật"}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chiều cao</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.heightCm ? `${selectedClient.heightCm} cm` : "Chưa cập nhật"}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cân nặng</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.weightKg ? `${selectedClient.weightKg} kg` : "Chưa cập nhật"}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Trình độ</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.experienceLevel || "Chưa cập nhật"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tổng buổi tập</p>
                  <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{selectedClient.totalWorkouts}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Chuỗi ngày</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{selectedClient.streakDays}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Tổng khối lượng</p>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{selectedClient.totalVolume.toFixed(0)}</p>
                </div>
              </div>

              {selectedClient.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">Ghi chú</p>
                      <p className="text-sm text-amber-800 dark:text-amber-300">{selectedClient.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
