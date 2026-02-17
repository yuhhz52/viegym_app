import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle, MessageCircle, Star, Filter, Search, MapPin, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingState from "@/components/LoadingState";
import PaymentDialog from "@/components/PaymentDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllAvailableSlotsAPI,
  getMyBookingsAPI,
  createBookingAPI,
  cancelBookingAPI,
  type TimeSlotResponse,
  type BookingResponse,
} from "@/api/bookingApi";

export default function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<TimeSlotResponse[]>([]);
  const [myBookings, setMyBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotResponse | null>(null);
  const [clientNotes, setClientNotes] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null); // For existing bookings needing payment
  const [currentTime, setCurrentTime] = useState(new Date()); // For countdown timer

  // Helper function to get initials from name (consistent with Profile page)
  const getInitials = (name: string) => {
    if (!name || name.trim().length === 0) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // Helper function to get coach avatar URL
  const getCoachAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return "";
    if (avatarUrl.startsWith("http")) return avatarUrl;
    return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/media/${avatarUrl}`;
  };
  
  // New UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("all");
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"available" | "myBookings">("available");

  useEffect(() => {
    fetchData();
  }, []);

  // Update current time every second for countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [slotsData, bookingsData] = await Promise.all([
          getAllAvailableSlotsAPI(),
          getMyBookingsAPI(),
        ]);
        // Filter logic: Only COACH cannot book their own slots
        const isCoach = user?.roles?.includes('COACH') ?? false;
        const filteredSlots = isCoach
          ? slotsData.filter(slot => slot.coachId !== user?.id)
          : slotsData;
        
        console.log('[Auto-refresh] User:', user?.roles, user?.fullName, '| Total:', slotsData.length, '| Filtered:', filteredSlots.length);
        console.log('[Auto-refresh] Slots:', filteredSlots.map(s => ({
          coach: s.coachName,
          location: s.location,
          time: new Date(s.startTime).toLocaleString('vi-VN')
        })));
        
        setAvailableSlots(filteredSlots);
        setMyBookings(bookingsData);
        console.log('[BookingPage] Auto-refreshed both available slots and my bookings');
      } catch (error) {
        console.error('[BookingPage] Auto-refresh failed:', error);
      }
    }, 10000); 

    return () => clearInterval(interval);
  }, [user?.id]);

  // Initialize week start to current week
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    setCurrentWeekStart(startOfWeek);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [slotsData, bookingsData] = await Promise.all([
        getAllAvailableSlotsAPI(),
        getMyBookingsAPI(),
      ]);
      
      const isCoach = user?.roles?.includes('COACH') ?? false;
      const filteredSlots = isCoach
        ? slotsData.filter(slot => slot.coachId !== user?.id)
        : slotsData;
      
      console.log('[BookingPage] After filter - slots count:', filteredSlots.length);
      console.log('[BookingPage] Filtered slots with location:', filteredSlots.map(s => ({
        id: s.id.substring(0, 8),
        coach: s.coachName,
        location: s.location,
        startTime: s.startTime
      })));
      
      setAvailableSlots(filteredSlots);
      setMyBookings(bookingsData);
    } catch (error) {
      console.error("Failed to fetch booking data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = (slot: TimeSlotResponse) => {
    setSelectedSlot(slot);
    setBookingDialogOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || booking) return;

    setBooking(true);
    try {
      // Always create booking first with PENDING status (10 minute expiry)
      const bookingResponse = await createBookingAPI({
        timeSlotId: selectedSlot.id,
        coachId: selectedSlot.coachId,
        clientNotes: clientNotes || undefined,
      });
      
      // Check if payment is required
      const requiresPayment = selectedSlot.price && selectedSlot.price > 0;
      
      if (requiresPayment) {
        // For paid bookings - Open payment dialog with booking ID
        setCreatedBookingId(bookingResponse.id);
        setBookingDialogOpen(false);
        setPaymentDialogOpen(true);
        toast.success("Đã tạo đặt lịch! Vui lòng thanh toán trong vòng 10 phút để hoàn tất.", {
          duration: 5000,
        });
      } else {
        // For free bookings - booking is created and will be confirmed by coach
        toast.success("Đặt lịch thành công! Coach sẽ xác nhận sớm.");
        setBookingDialogOpen(false);
        setClientNotes("");
        setSelectedSlot(null);
        
        // Refresh to show updated slot availability
        setTimeout(() => {
          fetchData();
        }, 500);
      }
    } catch (error: any) {
      console.error("Failed to create booking:", error);
      console.log("Error response:", error.response?.data);
      
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || "Khung giờ này đã được đặt bởi người khác. Vui lòng chọn khung giờ khác.";
        toast.error(errorMessage);
        fetchData(); // Refresh to update slot availability
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || "Không thể đặt lịch. Vui lòng thử lại.";
        toast.error(errorMessage);
      } else {
        toast.error("Không thể đặt lịch. Vui lòng thử lại.");
      }
    } finally {
      setBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;

    try {
      await cancelBookingAPI(bookingId);
      toast.success("Hủy lịch hẹn thành công");
      fetchData();
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Không thể hủy lịch hẹn");
    }
  };

  // Filter functions
  const filteredSlots = availableSlots.filter(slot => {
    const matchesSearch = slot.coachName.toLowerCase().includes(searchQuery.toLowerCase());
    const slotDate = new Date(slot.startTime).toDateString();
    const matchesDate = !selectedDate || slotDate === new Date(selectedDate).toDateString();
    
    let matchesTime = true;
    if (selectedTimeFilter !== "all") {
      const hour = new Date(slot.startTime).getHours();
      switch (selectedTimeFilter) {
        case "morning": matchesTime = hour >= 6 && hour < 12; break;
        case "afternoon": matchesTime = hour >= 12 && hour < 18; break;
        case "evening": matchesTime = hour >= 18 && hour < 22; break;
      }
    }
    
    return matchesSearch && matchesDate && matchesTime;
  });

  // Get week days
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  // Group slots by date
  const groupSlotsByDate = () => {
    const grouped: Record<string, TimeSlotResponse[]> = {};
    filteredSlots.forEach(slot => {
      const dateKey = new Date(slot.startTime).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(slot);
    });
    return grouped;
  };

  const getStatusBadge = (status: BookingResponse["status"]) => {
    const statusConfig = {
      PENDING: { label: "Chờ thanh toán", className: "bg-orange-100 text-orange-800" },
      CONFIRMED: { label: "Đã xác nhận", className: "bg-blue-100 text-blue-800" },
      COMPLETED: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
      EXPIRED: { label: "Đã hết hạn", className: "bg-gray-100 text-gray-800" },
      NO_SHOW: { label: "Không đến", className: "bg-gray-100 text-gray-800" },
    };
    const config = statusConfig[status] || { label: "Không xác định", className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Calculate remaining time until expiration
  const getExpirationCountdown = (expiredAt?: string): string | null => {
    if (!expiredAt) return null;
    
    const expiredDate = new Date(expiredAt);
    const now = currentTime;
    const diff = expiredDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return "Đã hết hạn";
    }
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) return <LoadingState />;

  const weekDays = getWeekDays();
  const groupedSlots = groupSlotsByDate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Đặt lịch tập</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Tìm và đặt lịch với huấn luyện viên chuyên nghiệp
              </p>
            </div>
            
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 lg:min-w-96">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm coach..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedTimeFilter} onValueChange={setSelectedTimeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="morning">Sáng</SelectItem>
                  <SelectItem value="afternoon">Chiều</SelectItem>
                  <SelectItem value="evening">Tối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex mt-6 border-b">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "available"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Khung giờ có sẵn ({filteredSlots.length})
            </button>
            <button
              onClick={() => setActiveTab("myBookings")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "myBookings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Lịch hẹn của tôi ({myBookings.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Available Slots Tab */}
        {activeTab === "available" && (
          <div className="space-y-8">
            {/* Calendar Section - Prominent and Easy to Find */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl p-6 text-white shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Chọn ngày tập</h2>
                  <p className="text-gray-300 mt-1">Tìm khung giờ phù hợp với lịch trình của bạn</p>
                </div>
                <Calendar className="w-8 h-8 text-white" />
              </div>
              
              {/* Month and Year Display */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold">
                  {currentWeekStart.toLocaleDateString("vi-VN", { 
                    month: "long", 
                    year: "numeric" 
                  })}
                </h3>
              </div>
              
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigateWeek('prev')}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Tuần trước
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    setCurrentWeekStart(startOfWeek);
                    setSelectedDate("");
                  }}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  Hôm nay
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigateWeek('next')}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  Tuần sau
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              
              {/* Day Selector - Much More Prominent */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const hasSlots = Object.keys(groupedSlots).includes(day.toDateString());
                  const isSelected = selectedDate === day.toDateString();
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(isSelected ? "" : day.toDateString())}
                      className={`relative p-4 rounded-xl text-center transition-all duration-200 border-2 ${
                        isSelected
                          ? "bg-white text-gray-900 border-white scale-105 shadow-lg"
                          : isToday
                          ? "bg-yellow-400/20 text-yellow-200 border-yellow-300 hover:bg-yellow-400/30"
                          : hasSlots
                          ? "bg-green-600/20 text-green-200 border-green-400 hover:bg-green-600/30 hover:scale-105"
                          : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-xs font-medium mb-1">
                        {day.toLocaleDateString("vi-VN", { weekday: "short" }).toUpperCase()}
                      </div>
                      <div className="text-lg font-bold mb-1">
                        {day.getDate()}
                      </div>
                      {hasSlots && (
                        <div className="flex justify-center">
                          <Badge 
                            className={`text-xs px-1 py-0.5 ${
                              isSelected 
                                ? "bg-gray-700 text-white" 
                                : "bg-green-600 text-white"
                            }`}
                          >
                            {groupedSlots[day.toDateString()]?.length || 0}
                          </Badge>
                        </div>
                      )}
                      {isToday && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Selected Date Info */}
              {selectedDate && (
                <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Ngày đã chọn</p>
                      <p className="font-semibold text-lg">
                        {new Date(selectedDate).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long"
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">Khung giờ có sẵn</p>
                      <p className="font-bold text-2xl">
                        {groupedSlots[selectedDate]?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Lọc khung giờ</h3>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
                  <Select value={selectedTimeFilter} onValueChange={setSelectedTimeFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Clock className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả thời gian</SelectItem>
                      <SelectItem value="morning">Sáng (6h-12h)</SelectItem>
                      <SelectItem value="afternoon">Chiều (12h-18h)</SelectItem>
                      <SelectItem value="evening">Tối (18h-22h)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDate("");
                      setSelectedTimeFilter("all");
                    }}
                    className="whitespace-nowrap"
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
              
              {/* Active Filters Display */}
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedDate && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedDate).toLocaleDateString("vi-VN", { 
                      day: "numeric", 
                      month: "short" 
                    })}
                    <button 
                      onClick={() => setSelectedDate("")}
                      className="ml-1 hover:bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedTimeFilter !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedTimeFilter === "morning" && "Sáng"}
                    {selectedTimeFilter === "afternoon" && "Chiều"} 
                    {selectedTimeFilter === "evening" && "Tối"}
                    <button 
                      onClick={() => setSelectedTimeFilter("all")}
                      className="ml-1 hover:bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    "{searchQuery}"
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>

            {/* Results Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {filteredSlots.length === 0 
                      ? "Không tìm thấy khung giờ nào"
                      : `Tìm thấy ${filteredSlots.length} khung giờ phù hợp`
                    }
                  </span>
                </div>
                {filteredSlots.length > 0 && (
                  <Badge className="bg-gray-600 dark:bg-gray-700 text-white">
                    {Object.keys(groupedSlots).length} ngày
                  </Badge>
                )}
              </div>
            </div>

            {/* Slots Grid */}
            <div className="space-y-6">
              {filteredSlots.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Không có khung giờ nào phù hợp</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedDate 
                      ? "Không có khung giờ nào trong ngày này. Thử chọn ngày khác." 
                      : "Thử chọn ngày trên lịch hoặc thay đổi bộ lọc"}
                  </p>
                </div>
              ) : selectedDate ? (
                // When a date is selected, show only slots for that date
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {new Date(selectedDate).toLocaleDateString("vi-VN", { 
                      weekday: "long", 
                      day: "numeric", 
                      month: "long" 
                    })}
                    <Badge variant="secondary" className="ml-2">{filteredSlots.length} slot</Badge>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSlots.map((slot) => (
                      <Card key={slot.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-md">
                        <div className="p-6 space-y-4">
                          {/* Coach Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border-2 border-slate-100 dark:border-gray-700">
                                <AvatarImage src={getCoachAvatarUrl(slot.coachAvatarUrl)} alt={slot.coachName} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-slate-700 dark:from-blue-700 dark:to-gray-800 text-white font-bold text-sm">
                                  {getInitials(slot.coachName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  Coach {slot.coachName}
                                </h4>
                                <div className="flex items-center gap-1 text-yellow-500">
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                  <span className="text-xs text-gray-500 ml-1">5.0</span>
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-green-600 text-white">Có sẵn</Badge>
                          </div>
                          
                          {/* Time Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {new Date(slot.startTime).toLocaleTimeString("vi-VN", {
                                  timeStyle: "short",
                                })}{" "}
                                - {" "}
                                {new Date(slot.endTime).toLocaleTimeString("vi-VN", {
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="w-4 h-4" />
                              <span>{slot.location || "VieGym - Phòng tập"}</span>
                            </div>
                            
                            {/* Price */}
                            {slot.price && slot.price > 0 ? (
                              <div className="flex items-center gap-2 text-base font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                <span>💰</span>
                                <span>{slot.price.toLocaleString("vi-VN")} VNĐ</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                <span>Miễn phí</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Button */}
                          <Button 
                            onClick={() => handleBookSlot(slot)}
                            className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white border-0"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Đặt lịch ngay
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                // When no date is selected, show all slots grouped by date
                Object.entries(groupedSlots).map(([dateKey, slots]) => (
                  <div key={dateKey} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {new Date(dateKey).toLocaleDateString("vi-VN", { 
                        weekday: "long", 
                        day: "numeric", 
                        month: "long" 
                      })}
                      <Badge variant="secondary" className="ml-2">{slots.length} slot</Badge>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slots.map((slot) => (
                        <Card key={slot.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-md">
                          <div className="p-6 space-y-4">
                            {/* Coach Info */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-slate-100 dark:border-gray-700">
                                  <AvatarImage src={getCoachAvatarUrl(slot.coachAvatarUrl)} alt={slot.coachName} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-slate-700 dark:from-blue-700 dark:to-gray-800 text-white font-bold text-sm">
                                    {getInitials(slot.coachName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    Coach {slot.coachName}
                                  </h4>
                                  <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-3 h-3 fill-current" />
                                    <Star className="w-3 h-3 fill-current" />
                                    <Star className="w-3 h-3 fill-current" />
                                    <Star className="w-3 h-3 fill-current" />
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs text-gray-500 ml-1">5.0</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-green-600 text-white">Có sẵn</Badge>
                            </div>
                            
                            {/* Time Info */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">
                                  {new Date(slot.startTime).toLocaleTimeString("vi-VN", {
                                    timeStyle: "short",
                                  })}{" "}
                                  - {" "}
                                  {new Date(slot.endTime).toLocaleTimeString("vi-VN", {
                                    timeStyle: "short",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span>{slot.location || "VieGym - Phòng tập"}</span>
                              </div>

                              {/* Price */}
                              {slot.price && slot.price > 0 ? (
                                <div className="flex items-center gap-2 text-base font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                  <span>💰</span>
                                  <span>{slot.price.toLocaleString("vi-VN")} VNĐ</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                  <span>🎁</span>
                                  <span>Miễn phí</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Button */}
                            <Button 
                              onClick={() => handleBookSlot(slot)}
                              className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white border-0"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Đặt lịch ngay
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === "myBookings" && (
          <div className="space-y-6">
            {myBookings.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Chưa có lịch hẹn nào
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Đặt lịch với coach để bắt đầu tập luyện
                </p>
                <Button 
                  onClick={() => setActiveTab("available")}
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Đặt lịch ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quick Stats */}
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    {myBookings.filter(b => b.status === "PENDING").length} chờ xác nhận
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {myBookings.filter(b => b.status === "CONFIRMED").length} đã xác nhận
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {myBookings.filter(b => b.status === "COMPLETED").length} hoàn thành
                  </span>
                </div>

                {/* Bookings List */}
                <div className="space-y-3">
                  {myBookings
                    .sort((a, b) => {
                      const statusPriority: Record<BookingResponse["status"], number> = {
                        'PENDING': 5, 'CONFIRMED': 3, 'COMPLETED': 2, 'CANCELLED': 1, 'EXPIRED': 1, 'NO_SHOW': 1
                      };
                      const priorityA = statusPriority[a.status] || 0;
                      const priorityB = statusPriority[b.status] || 0;
                      if (priorityA !== priorityB) return priorityB - priorityA;
                      return new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime();
                    })
                    .map((booking) => (
                    <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* Status & Coach */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            booking.status === 'PENDING' ? 'bg-yellow-500' :
                            booking.status === 'CONFIRMED' ? 'bg-blue-500' :
                            booking.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          
                          <Avatar className="w-8 h-8 border-2 border-slate-100 dark:border-gray-700 flex-shrink-0">
                            <AvatarImage src={getCoachAvatarUrl(booking.coachAvatarUrl)} alt={booking.coachName} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-slate-700 dark:from-blue-700 dark:to-gray-800 text-white text-sm font-medium">
                              {getInitials(booking.coachName)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                Coach {booking.coachName}
                              </h4>
                              {getStatusBadge(booking.status)}
                              {booking.status === 'PENDING' && (
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            
                            {/* Expiration countdown for PENDING bookings */}
                            {booking.status === 'PENDING' && booking.expiredAt && (
                              <div className="mt-1 flex items-center gap-1 text-xs">
                                <Clock className="w-3 h-3 text-orange-600" />
                                <span className={`font-medium ${
                                  (() => {
                                    const expiredDate = new Date(booking.expiredAt);
                                    const diff = expiredDate.getTime() - currentTime.getTime();
                                    if (diff < 60000) return 'text-red-600'; 
                                    if (diff < 300000) return 'text-orange-600'; 
                                    return 'text-gray-600';
                                  })()
                                }`}>
                                  Còn lại: {getExpirationCountdown(booking.expiredAt)}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(booking.bookingTime).toLocaleDateString("vi-VN", {
                                  day: "numeric", month: "short", year: "numeric"
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(booking.bookingTime).toLocaleTimeString("vi-VN", { timeStyle: "short" })}
                              </div>
                              {booking.timeSlot?.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{booking.timeSlot.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/messages?userId=${booking.coachId}&userName=${booking.coachName}`)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Nhắn tin
                          </Button>
                          
                          {/* Payment button for PENDING bookings that require payment */}
                          {booking.status === "PENDING" && booking.timeSlot.price && booking.timeSlot.price > 0 && (() => {
                            const expiredDate = booking.expiredAt ? new Date(booking.expiredAt) : null;
                            const isExpired = expiredDate && expiredDate.getTime() <= currentTime.getTime();
                            
                            if (isExpired) {
                              return (
                                <span className="text-xs text-red-600 font-medium">
                                  Đã hết hạn thanh toán
                                </span>
                              );
                            }
                            
                            return (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setPaymentBookingId(booking.id);
                                  setSelectedSlot(booking.timeSlot);
                                  setPaymentDialogOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                💳 Thanh toán
                              </Button>
                            );
                          })()}
                          
                          {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Hủy
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Notes - Compact */}
                      {(booking.clientNotes || booking.coachNotes) && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                          {booking.clientNotes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">Ghi chú:</span> {booking.clientNotes}
                            </p>
                          )}
                          {booking.coachNotes && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              <span className="font-medium">Coach:</span> {booking.coachNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Xác nhận đặt lịch</DialogTitle>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-6">
              {/* Coach Info */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <Avatar className="w-12 h-12 border-4 border-slate-100 dark:border-gray-700 shadow-lg">
                  <AvatarImage src={getCoachAvatarUrl(selectedSlot.coachAvatarUrl)} alt={selectedSlot.coachName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-slate-700 dark:from-blue-700 dark:to-gray-800 text-white font-bold text-lg">
                    {getInitials(selectedSlot.coachName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">Coach {selectedSlot.coachName}</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs text-gray-500 ml-1">5.0</span>
                  </div>
                </div>
              </div>
              
              {/* Session Details */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Chi tiết buổi tập</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{new Date(selectedSlot.startTime).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>
                      {new Date(selectedSlot.startTime).toLocaleTimeString("vi-VN", { timeStyle: "short" })}
                      {" - "}
                      {new Date(selectedSlot.endTime).toLocaleTimeString("vi-VN", { timeStyle: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{selectedSlot.location || "VieGym - Studio A"}</span>
                  </div>
                  
                  {/* Price */}
                  {selectedSlot.price && selectedSlot.price > 0 ? (
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Giá:</span>
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                        {selectedSlot.price.toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">Miễn phí</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="clientNotes" className="text-sm font-medium">
                  Ghi chú cho coach (tùy chọn)
                </Label>
                <Textarea
                  id="clientNotes"
                  placeholder="Ví dụ: Tôi muốn tập trung vào cardio và giảm cân..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="min-h-20"
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setBookingDialogOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={booking}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
                >
                  {booking ? "Đang đặt..." : "Xác nhận đặt lịch"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {(paymentBookingId || createdBookingId) && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={(open) => {
            setPaymentDialogOpen(open);
            if (!open) {
              // Reset state when closing payment dialog
              setClientNotes("");
              setSelectedSlot(null);
              setCreatedBookingId(null);
              setPaymentBookingId(null);
            }
          }}
          bookingSessionId={paymentBookingId || createdBookingId || ""}
          amount={selectedSlot?.price || 0}
          description={selectedSlot ? `Thanh toán đặt lịch tập với coach ${selectedSlot.coachName}` : "Thanh toán đặt lịch tập"}
          onPaymentSuccess={() => {
            // Handle successful payment
            setPaymentDialogOpen(false);
            toast.success("Thanh toán thành công! Lịch đặt đã được xác nhận.");
            
            // Reset states
            setClientNotes("");
            setSelectedSlot(null);
            setCreatedBookingId(null);
            setPaymentBookingId(null);
            
            setTimeout(() => {
              fetchData();
            }, 500);
          }}
        />
      )}
    </div>
  );
}
