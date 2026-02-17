import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, MapPin, Sun, CloudSun, Moon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import LoadingState from "@/components/LoadingState";
import { toast } from "sonner";
import { wsService } from "@/services/websocket";
import {
  getMyTimeSlotsAPI,
  getCoachBookingsAPI,
  createTimeSlotAPI,
  deleteTimeSlotAPI,
  confirmBookingAPI,
  cancelBookingAPI,
  completeBookingAPI,
  type TimeSlotResponse,
  type BookingResponse,
} from "@/api/bookingApi";

export default function CoachSchedule() {
  const [timeSlots, setTimeSlots] = useState<TimeSlotResponse[]>([]);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteSlotConfirm, setDeleteSlotConfirm] = useState<string | null>(null);
  const [cancelBookingConfirm, setCancelBookingConfirm] = useState<string | null>(null);
  const [completeBookingId, setCompleteBookingId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [creatingSlot, setCreatingSlot] = useState(false);
  
  const [newSlot, setNewSlot] = useState({
    startTime: "",
    endTime: "",
    notes: "",
    location: "",
    price: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time booking notifications
  useEffect(() => {
    const unsubscribe = wsService.onNotification((notification) => {
      console.log('[CoachSchedule] ✅ Received booking notification:', notification);
      
      // Auto refresh bookings when notification received
      if (notification.type === 'NEW_BOOKING' || notification.type === 'BOOKING_CANCELLED') {
        // Hiển thị thông báo với thông tin chi tiết
        if (notification.type === 'NEW_BOOKING') {
          toast.success(notification.message || `Bạn có lịch hẹn mới từ ${notification.clientName}`, {
            description: `Thời gian: ${notification.timeSlotInfo}`,
            duration: 5000,
          });
        } else {
          toast.info(notification.message || `Lịch hẹn từ ${notification.clientName} đã bị hủy`, {
            description: `Thời gian: ${notification.timeSlotInfo}`,
            duration: 5000,
          });
        }
        
        // Refresh both time slots and bookings data
        Promise.all([
          getMyTimeSlotsAPI(),
          getCoachBookingsAPI(),
        ]).then(([slotsData, bookingsData]) => {
          console.log('[CoachSchedule] ✅ Auto-refreshed data after notification');
          
          // Sort time slots by startTime in descending order (newest/latest time first)
          const sortedSlots = [...slotsData].sort((a, b) => 
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );
          setTimeSlots(sortedSlots);
          
          // Sort bookings: PENDING and CONFIRMED first, then COMPLETED/CANCELLED/NO_SHOW
          const sortedBookings = [...bookingsData].sort((a, b) => {
            const statusPriority: Record<string, number> = {
              'PENDING': 1,
              'CONFIRMED': 2,
              'COMPLETED': 3,
              'CANCELLED': 4,
              'NO_SHOW': 5,
            };
            
            const priorityA = statusPriority[a.status] || 999;
            const priorityB = statusPriority[b.status] || 999;
            
            // First, sort by priority
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            
            // If same priority, sort by booking time (newest first)
            return new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime();
          });
          setBookings(sortedBookings);
        }).catch((error) => {
          console.error('[CoachSchedule] ❌ Error refreshing data after notification:', error);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // Remove WebSocket dependency check

  const fetchData = async () => {
    setLoading(true);
    try {
      const [slotsData, bookingsData] = await Promise.all([
        getMyTimeSlotsAPI(),
        getCoachBookingsAPI(),
      ]);
      
      // Sort time slots by startTime in descending order (newest/latest time first)
      const sortedSlots = [...slotsData].sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      
      console.log('[CoachSchedule] First 3 slots after sort:', sortedSlots.slice(0, 3).map(s => ({
        id: s.id,
        startTime: s.startTime,
        createdAt: s.createdAt,
        notes: s.notes
      })));
      
      setTimeSlots(sortedSlots);
      
      // Sort bookings: PENDING and CONFIRMED first, then COMPLETED/CANCELLED/NO_SHOW
      const sortedBookings = [...bookingsData].sort((a, b) => {
        const statusPriority: Record<string, number> = {
          'PENDING': 1,
          'CONFIRMED': 2,
          'COMPLETED': 3,
          'CANCELLED': 4,
          'NO_SHOW': 5,
        };
        
        const priorityA = statusPriority[a.status] || 999;
        const priorityB = statusPriority[b.status] || 999;
        
        // First, sort by priority
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority, sort by booking time (newest first)
        return new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime();
      });
      
      console.log('[CoachSchedule] First 3 bookings after sort:', sortedBookings.slice(0, 3).map(b => ({
        id: b.id,
        client: b.clientName,
        status: b.status,
        bookingTime: b.bookingTime,
      })));
      
      setBookings(sortedBookings);
    } catch (error: any) {
      console.error("Failed to fetch schedule data:", error);
      
      // More detailed error message
      let errorMessage = "Không thể tải lịch trình";
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = `Lỗi dữ liệu không hợp lệ: ${data?.message || 'Bad Request'}`;
        } else if (status === 500) {
          errorMessage = `Lỗi máy chủ: ${data?.message || 'Internal Server Error'}. Vui lòng kiểm tra database.`;
        } else if (status === 403) {
          errorMessage = "Bạn không có quyền truy cập. Vui lòng đăng nhập lại.";
        }
        
        console.error('[CoachSchedule] Error details:', {
          status,
          message: data?.message,
          error: data?.error,
          path: error.config?.url,
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[handleCreateSlot] Starting creation with data:', newSlot);
    
    if (!newSlot.startTime || !newSlot.endTime) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }

    // Validate time - compare as local datetime strings to avoid timezone issues
    const now = new Date();
    const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    
    console.log('[handleCreateSlot] Validation:', {
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      nowLocal: nowLocal,
      isStartInFuture: newSlot.startTime >= nowLocal,
      isEndAfterStart: newSlot.endTime > newSlot.startTime,
    });

    if (newSlot.startTime < nowLocal) {
      toast.error("Thời gian bắt đầu phải trong tương lai");
      return;
    }

    if (newSlot.endTime <= newSlot.startTime) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    // Calculate duration using Date objects
    // Parse datetime-local string correctly (format: YYYY-MM-DDTHH:mm)
    // datetime-local values are already in local timezone, so we parse them directly
    const startDateTime = new Date(newSlot.startTime);
    const endDateTime = new Date(newSlot.endTime);
    
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    
    console.log('[handleCreateSlot] Duration check:', {
      startTimeString: newSlot.startTime,
      endTimeString: newSlot.endTime,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      startDateTimeLocal: startDateTime.toString(),
      endDateTimeLocal: endDateTime.toString(),
      durationHours: durationHours,
      durationMinutes: durationHours * 60,
      isDurationValid: durationHours <= 4,
    });
    
    if (durationHours > 4) {
      toast.error(`Thời lượng buổi tập không được quá 4 giờ (hiện tại: ${durationHours.toFixed(1)} giờ)`);
      return;
    }
    
    if (durationHours <= 0) {
      toast.error("Thời lượng buổi tập phải lớn hơn 0");
      return;
    }

    console.log('[handleCreateSlot] All validations passed, calling API...');
    setCreatingSlot(true);
    try {
      const requestData = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: newSlot.notes || undefined,
        location: newSlot.location || undefined,
        price: newSlot.price ? parseFloat(newSlot.price) : undefined,
      };
      console.log('[handleCreateSlot] Request data:', requestData);
      
      await createTimeSlotAPI(requestData);
      console.log('[handleCreateSlot] API call successful!');
      
      toast.success("Tạo khung giờ thành công");
      setDialogOpen(false);
      setNewSlot({ startTime: "", endTime: "", notes: "", location: "", price: "" });
      fetchData();
    } catch (error: any) {
      console.error("Failed to create time slot:", error);
      
      // Extract error message from response
      let errorMessage = "Không thể tạo khung giờ";
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // Use backend error message if available
        if (data?.message) {
          errorMessage = data.message;
        } else if (status === 400) {
          errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin";
        } else if (status === 403) {
          errorMessage = "Bạn không có quyền tạo khung giờ. Vui lòng đăng nhập lại";
        } else if (status === 409) {
          errorMessage = "Khung giờ này trùng với lịch đã tạo. Vui lòng chọn thời gian khác";
        } else if (status === 500) {
          errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau";
        }
        
        console.error('[CoachSchedule] Create slot error details:', {
          status,
          message: data?.message,
          error: data?.error,
          code: data?.code,
        });
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setCreatingSlot(false);
    }
  };

  // Quick time slot selection helpers
  const setQuickTimeSlot = (period: 'morning' | 'afternoon' | 'evening') => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    
    let startHour = '';
    let endHour = '';
    
    if (period === 'morning') {
      startHour = '07:00';
      endHour = '09:00';
    } else if (period === 'afternoon') {
      startHour = '14:00';
      endHour = '16:00';
    } else if (period === 'evening') {
      startHour = '18:00';
      endHour = '20:00';
    }
    
    setNewSlot({
      ...newSlot,
      startTime: `${year}-${month}-${day}T${startHour}`,
      endTime: `${year}-${month}-${day}T${endHour}`,
    });
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteTimeSlotAPI(slotId);
      toast.success("Xóa khung giờ thành công");
      setDeleteSlotConfirm(null);
      fetchData();
    } catch (error: any) {
      console.error("Failed to delete time slot:", error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || "Không thể xóa khung giờ";
      
      if (error.response?.status === 409 || errorMessage.includes("lịch hẹn")) {
        toast.error("Không thể xóa khung giờ đã có lịch hẹn. Vui lòng hủy các lịch hẹn trước.", {
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
      
      setDeleteSlotConfirm(null);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await confirmBookingAPI(bookingId);
      toast.success("Xác nhận lịch hẹn thành công");
      fetchData();
    } catch (error) {
      console.error("Failed to confirm booking:", error);
      toast.error("Không thể xác nhận lịch hẹn");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBookingAPI(bookingId);
      toast.success("Hủy lịch hẹn thành công");
      setCancelBookingConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Không thể hủy lịch hẹn");
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await completeBookingAPI(bookingId, completionNotes || undefined);
      toast.success("Hoàn thành buổi tập");
      setCompleteBookingId(null);
      setCompletionNotes("");
      fetchData();
    } catch (error) {
      console.error("Failed to complete booking:", error);
      toast.error("Không thể hoàn thành buổi tập");
    }
  };

  const getStatusBadge = (status: BookingResponse["status"]) => {
    const statusConfig = {
      PENDING: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800" },
      PENDING_PAYMENT: { label: "Chờ thanh toán", className: "bg-orange-100 text-orange-800" },
      CONFIRMED: { label: "Đã xác nhận", className: "bg-blue-100 text-blue-800" },
      COMPLETED: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
      EXPIRED: { label: "Hết hạn", className: "bg-gray-100 text-gray-800" },
      NO_SHOW: { label: "Không đến", className: "bg-gray-100 text-gray-800" },
    };
    const config = statusConfig[status] || { label: "Không xác định", className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                Lịch trình của tôi
              </h1>
              <p className="text-slate-600">
                Quản lý khung giờ và lịch hẹn với học viên
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-lg">
                  <Plus size={18} />
                  Thêm khung giờ
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-2 border-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-900">Tạo khung giờ mới</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 mt-1">
                    Tạo khung giờ để học viên có thể đặt lịch tập với bạn
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSlot} className="space-y-5">{/* Quick Time Selection */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Chọn nhanh khung giờ</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuickTimeSlot('morning')}
                        className="flex flex-col items-center gap-2 h-auto py-3 border-2 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                      >
                        <Sun className="w-5 h-5 text-amber-500" />
                        <div className="text-center">
                          <div className="font-semibold text-sm">Buổi sáng</div>
                          <div className="text-xs text-slate-500">7:00 - 9:00</div>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuickTimeSlot('afternoon')}
                        className="flex flex-col items-center gap-2 h-auto py-3 border-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <CloudSun className="w-5 h-5 text-blue-500" />
                        <div className="text-center">
                          <div className="font-semibold text-sm">Buổi chiều</div>
                          <div className="text-xs text-slate-500">14:00 - 16:00</div>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuickTimeSlot('evening')}
                        className="flex flex-col items-center gap-2 h-auto py-3 border-2 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                      >
                        <Moon className="w-5 h-5 text-indigo-500" />
                        <div className="text-center">
                          <div className="font-semibold text-sm">Buổi tối</div>
                          <div className="text-xs text-slate-500">18:00 - 20:00</div>
                        </div>
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Chọn khung giờ mặc định cho ngày mai hoặc tùy chỉnh bên dưới</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="text-slate-700 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Thời gian bắt đầu
                      </Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                        required
                        min={new Date().toISOString().slice(0, 16)}
                        className="border-slate-300 focus:border-slate-500"
                      />
                      <p className="text-xs text-slate-500">Chọn ngày và giờ bắt đầu</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="text-slate-700 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Thời gian kết thúc
                      </Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                        required
                        min={newSlot.startTime || new Date().toISOString().slice(0, 16)}
                        className="border-slate-300 focus:border-slate-500"
                      />
                      <p className="text-xs text-slate-500">Chọn ngày và giờ kết thúc</p>
                    </div>
                  </div>

                  {/* Time Duration Display */}
                  {newSlot.startTime && newSlot.endTime && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="font-medium">
                          Thời lượng: {
                            Math.round((new Date(newSlot.endTime).getTime() - new Date(newSlot.startTime).getTime()) / (1000 * 60))
                          } phút
                          ({
                            ((new Date(newSlot.endTime).getTime() - new Date(newSlot.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1)
                          } giờ)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-slate-700 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Địa điểm
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="VD: VieGym - Phòng tập 1, Quận 1 - HCM"
                      value={newSlot.location}
                      onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
                      className="border-slate-300 focus:border-slate-500"
                    />
                    <p className="text-xs text-slate-500">Nhập địa chỉ hoặc tên phòng tập</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-slate-700 font-medium flex items-center gap-2">
                      <span>💰</span> Giá (VNĐ)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="VD: 200000"
                      value={newSlot.price}
                      onChange={(e) => setNewSlot({ ...newSlot, price: e.target.value })}
                      min="0"
                      step="1000"
                      className="border-slate-300 focus:border-slate-500"
                    />
                    <p className="text-xs text-slate-500">
                      Để trống nếu miễn phí. Học viên sẽ thanh toán qua VNPay khi đặt lịch.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-slate-700 font-medium">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      placeholder="VD: Tập cơ ngực và vai, phù hợp cho người mới bắt đầu"
                      value={newSlot.notes}
                      onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
                      className="border-slate-300 focus:border-slate-500 min-h-20"
                    />
                    <p className="text-xs text-slate-500">Thêm thông tin về buổi tập (tùy chọn)</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={creatingSlot}
                      className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingSlot ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Tạo khung giờ
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Slots - Calendar View */}
        <Card className="p-6 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
          {
            // Only show slots that are AVAILABLE (hide BOOKED slots since they appear in Bookings)
          }
          {(() => {
            const visibleSlots = timeSlots.filter(s => s.status === 'AVAILABLE');
            return (
              <>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
                  <Clock className="w-5 h-5 text-slate-600" />
                  Khung giờ của tôi ({visibleSlots.length})
                </h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {visibleSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500">Chưa có khung giờ nào</p>
                      <p className="text-sm text-slate-400 mt-1">Tạo khung giờ để học viên có thể đặt lịch</p>
                    </div>
                  ) : (
                    visibleSlots.map((slot) => {
                const startDate = new Date(slot.startTime);
                const endDate = new Date(slot.endTime);
                const isToday = startDate.toDateString() === new Date().toDateString();
                const isPast = startDate < new Date();
                
                return (
                  <div
                    key={slot.id}
                    className={`relative p-4 rounded-xl border-l-4 transition-all hover:shadow-lg ${
                      slot.status === "AVAILABLE"
                        ? "bg-emerald-50 border-emerald-500 hover:bg-emerald-100"
                        : "bg-slate-50 border-slate-400 hover:bg-slate-100"
                    } ${isPast ? "opacity-60" : ""}`}
                  >
                    {/* Date Badge */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`text-xs font-bold px-2 py-1 rounded ${
                          isToday ? "bg-red-500 text-white" : "bg-slate-200 text-slate-700"
                        }`}>
                          {isToday ? "HÔM NAY" : startDate.toLocaleDateString("vi-VN", { weekday: "short" }).toUpperCase()}
                        </div>
                        <Badge
                          className={`${
                            slot.status === "AVAILABLE"
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-400 text-white"
                          }`}
                        >
                          {slot.status === "AVAILABLE"
                            ? "Còn trống"
                            : "Không khả dụng"}
                        </Badge>
                      </div>
                      {slot.status === "AVAILABLE" && !isPast && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteSlotConfirm(slot.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg h-8 w-8 p-0"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    
                    {/* Time Display */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <Clock className="w-6 h-6 text-slate-500" />
                        {startDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex-1 h-0.5 bg-slate-300"></div>
                      <div className="text-2xl font-bold text-slate-900">
                        {endDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    
                    {/* Full Date */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <CalendarIcon className="w-4 h-4 text-slate-500" />
                      {startDate.toLocaleDateString("vi-VN", { 
                        day: "2-digit", 
                        month: "2-digit", 
                        year: "numeric" 
                      })}
                    </div>
                    
                    {/* Location */}
                    {slot.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-700 mb-2 bg-white/50 px-3 py-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="font-medium">{slot.location}</span>
                      </div>
                    )}

                    {/* Price */}
                    {slot.price && slot.price > 0 ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                        <span className="text-base">💰</span>
                        <span>{slot.price.toLocaleString("vi-VN")} VNĐ</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        <span>Miễn phí</span>
                      </div>
                    )}
                    
                    {/* Notes */}
                    {slot.notes && (
                      <div className="flex items-start gap-2 text-sm text-slate-600 bg-white/50 px-3 py-2 rounded-lg italic">
                        <MessageCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span>{slot.notes}</span>
                      </div>
                    )}
                  </div>
                );
                    })
                  )}
                </div>
              </>
            );
          })()}
        </Card>

        {/* Bookings - Card View */}
        <Card className="p-6 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
            <CalendarIcon className="w-5 h-5 text-slate-600" />
            Lịch hẹn ({bookings.length})
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Chưa có lịch hẹn nào</p>
                <p className="text-sm text-slate-400 mt-1">Lịch hẹn từ học viên sẽ hiển thị ở đây</p>
              </div>
            ) : (
              bookings.map((booking) => {
                const bookingDate = new Date(booking.bookingTime);
                const isToday = bookingDate.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={booking.id}
                    className={`relative p-4 rounded-xl border-l-4 transition-all hover:shadow-lg ${
                      booking.status === "PENDING"
                        ? "bg-amber-50 border-amber-500 hover:bg-amber-100"
                        : booking.status === "CONFIRMED"
                        ? "bg-blue-50 border-blue-500 hover:bg-blue-100"
                        : booking.status === "COMPLETED"
                        ? "bg-emerald-50 border-emerald-500 hover:bg-emerald-100"
                        : "bg-slate-50 border-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold">
                          {booking.clientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{booking.clientName}</div>
                          <div className={`text-xs font-semibold ${
                            isToday ? "text-red-600" : "text-slate-500"
                          }`}>
                            {isToday ? "Hôm nay" : bookingDate.toLocaleDateString("vi-VN", { weekday: "short" })}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    {/* Time */}
                    <div className="flex items-center gap-2 mb-2 text-lg font-semibold text-slate-900 bg-white/50 px-3 py-2 rounded-lg">
                      <Clock className="w-5 h-5 text-slate-500" />
                      {bookingDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      <span className="text-slate-400">•</span>
                      <span className="text-sm text-slate-600">
                        {bookingDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    </div>
                    
                    {/* Client Notes */}
                    {booking.clientNotes && (
                      <div className="flex items-start gap-2 text-sm text-slate-700 bg-white/50 px-3 py-2 rounded-lg italic mb-3">
                        <MessageCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span>"{booking.clientNotes}"</span>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {booking.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmBooking(booking.id)}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                          >
                            ✓ Xác nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelBookingConfirm(booking.id)}
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                          >
                            ✕ Hủy
                          </Button>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setCompleteBookingId(booking.id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          >
                            ✓ Hoàn thành
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelBookingConfirm(booking.id)}
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                          >
                            ✕ Hủy
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Delete Time Slot Confirmation Dialog */}
      <Dialog open={deleteSlotConfirm !== null} onOpenChange={() => setDeleteSlotConfirm(null)}>
        <DialogContent className="max-w-md bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận xóa khung giờ
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Bạn có chắc chắn muốn xóa khung giờ này không?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteSlotConfirm(null)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (deleteSlotConfirm) {
                  handleDeleteSlot(deleteSlotConfirm);
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              Xóa khung giờ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={cancelBookingConfirm !== null} onOpenChange={() => setCancelBookingConfirm(null)}>
        <DialogContent className="max-w-md bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận hủy lịch hẹn
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Bạn có chắc chắn muốn hủy lịch hẹn này không?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setCancelBookingConfirm(null)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Không
            </Button>
            <Button
              onClick={() => {
                if (cancelBookingConfirm) {
                  handleCancelBooking(cancelBookingConfirm);
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              Hủy lịch hẹn
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Booking Dialog */}
      <Dialog open={completeBookingId !== null} onOpenChange={() => {
        setCompleteBookingId(null);
        setCompletionNotes("");
      }}>
        <DialogContent className="max-w-md bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Hoàn thành buổi tập
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Thêm ghi chú về buổi tập (tùy chọn)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea
              placeholder="VD: Học viên hoàn thành tốt các bài tập..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="border-slate-300 focus:border-slate-500 min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCompleteBookingId(null);
                setCompletionNotes("");
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (completeBookingId) {
                  handleCompleteBooking(completeBookingId);
                }
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
            >
              Hoàn thành
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
