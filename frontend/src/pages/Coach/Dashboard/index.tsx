import { useEffect, useState } from 'react';
import LoadingState from '@/components/LoadingState';
import { Users, Calendar, TrendingUp, Activity, BookOpen, CheckCircle, XCircle, Wallet, ArrowDownCircle, CreditCard, Info, AlertCircle } from 'lucide-react';
import { getCoachStatsAPI, getCoachBalanceAPI, withdrawAPI, type CoachStatsResponse, type CoachBalanceResponse, type WithdrawRequest } from '@/api/coachApi';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CoachDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CoachStatsResponse>({
    totalClients: 0,
    activeClients: 0,
    totalPrograms: 0,
    totalWorkoutsSessions: 0,
    avgClientProgress: 0,
    newClientsThisMonth: 0,
    activeProgramsAssigned: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
  });
  const [balance, setBalance] = useState<CoachBalanceResponse | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState<WithdrawRequest>({
    amount: 0,
    bankAccountInfo: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[CoachDashboard] Fetching data...");
        
        // Fetch stats và balance riêng biệt để nếu một cái fail thì cái kia vẫn load được
        try {
          const statsData = await getCoachStatsAPI();
          console.log("[CoachDashboard] Stats data:", statsData);
          setStats(statsData);
        } catch (error: any) {
          console.error("[CoachDashboard] Failed to load stats:", error);
          toast.error("Không thể tải thống kê");
        }

        try {
          const balanceData = await getCoachBalanceAPI();
          console.log("[CoachDashboard] Balance data:", balanceData);
          console.log("[CoachDashboard] Balance availableBalance:", balanceData.availableBalance, typeof balanceData.availableBalance);
          console.log("[CoachDashboard] Balance pendingBalance:", balanceData.pendingBalance, typeof balanceData.pendingBalance);
          console.log("[CoachDashboard] Balance totalEarned:", balanceData.totalEarned, typeof balanceData.totalEarned);
          console.log("[CoachDashboard] Balance totalWithdrawn:", balanceData.totalWithdrawn, typeof balanceData.totalWithdrawn);
          setBalance(balanceData);
        } catch (error: any) {
          console.error("[CoachDashboard] Failed to load balance:", error);
          console.error("[CoachDashboard] Error status:", error.response?.status);
          console.error("[CoachDashboard] Error data:", error.response?.data);
          // Vẫn set balance = null để UI hiển thị với giá trị 0
          setBalance(null);
          toast.error("Không thể tải số dư tài khoản");
        }
      } catch (error: any) {
        console.error("[CoachDashboard] Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || withdrawForm.amount < 50000) {
      toast.error("Số tiền rút tối thiểu là 50,000 VNĐ");
      return;
    }
    if (!withdrawForm.bankAccountInfo.trim()) {
      toast.error("Vui lòng nhập thông tin tài khoản ngân hàng");
      return;
    }
    const availableBalance = balance ? getBalanceValue(balance.availableBalance) : 0;
    if (balance && withdrawForm.amount > availableBalance) {
      toast.error("Số tiền rút vượt quá số dư khả dụng");
      return;
    }

    setWithdrawing(true);
    try {
      const updatedBalance = await withdrawAPI(withdrawForm);
      setBalance(updatedBalance);
      toast.success("Yêu cầu rút tiền đã được gửi thành công");
      setWithdrawDialogOpen(false);
      setWithdrawForm({ amount: 0, bankAccountInfo: '' });
    } catch (error: any) {
      console.error("Withdraw failed:", error);
      toast.error(error.response?.data?.message || "Rút tiền thất bại");
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    if (amount === null || amount === undefined) {
      return '0 ₫';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numAmount);
  };

  const getBalanceValue = (value: number | string | undefined | null): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return value;
  };

  if (loading) return <LoadingState />;

  // Chỉ hiển thị các stat cards có dữ liệu thật và có ý nghĩa
  const statCards = [
    {
      title: "Tổng học viên",
      value: stats.totalClients || 0,
      icon: <Users className="w-7 h-7" />,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      title: "Học viên hoạt động",
      value: stats.activeClients || 0,
      icon: <TrendingUp className="w-7 h-7" />,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50"
    },
    {
      title: "Chương trình tạo",
      value: stats.totalPrograms || 0,
      icon: <Calendar className="w-7 h-7" />,
      gradient: "from-slate-600 to-slate-700",
      bgGradient: "from-slate-50 to-gray-50"
    },
    {
      title: "Tổng lịch hẹn",
      value: stats.totalBookings || 0,
      icon: <BookOpen className="w-7 h-7" />,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50"
    },
    {
      title: "Lịch hẹn thành công",
      value: stats.completedBookings || 0,
      icon: <CheckCircle className="w-7 h-7" />,
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-50 to-purple-50"
    },
    {
      title: "Lịch hẹn đã hủy",
      value: stats.cancelledBookings || 0,
      icon: <XCircle className="w-7 h-7" />,
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50"
    },
  ].filter(card => {
    // Giữ lại các stat quan trọng (tổng số) ngay cả khi = 0
    const importantStats = ["Tổng học viên", "Chương trình tạo", "Tổng lịch hẹn"];
    return importantStats.includes(card.title) || card.value > 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-xl border border-slate-700">
          <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="relative">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Chào mừng Coach!
            </h1>
            <p className="text-slate-300 text-lg">
              Hãy tạo các chương trình tập luyện tuyệt vời cho học viên của bạn
            </p>
          </div>
        </div>

        {/* Balance Card - Luôn hiển thị */}
        <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-2xl p-8 shadow-xl text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Số dư tài khoản</h2>
                <p className="text-emerald-100 text-sm">Số tiền bạn đã kiếm được</p>
              </div>
            </div>
            <Button
              onClick={() => setWithdrawDialogOpen(true)}
              disabled={!balance || getBalanceValue(balance.availableBalance) < 50000}
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Rút tiền
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-emerald-100 text-sm mb-1">Có thể rút</p>
              <p className="text-2xl font-bold">
                {balance ? formatCurrency(balance.availableBalance) : '0 ₫'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-emerald-100 text-sm mb-1">Đang chờ</p>
              <p className="text-2xl font-bold">
                {balance ? formatCurrency(balance.pendingBalance) : '0 ₫'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-emerald-100 text-sm mb-1">Tổng kiếm được</p>
              <p className="text-2xl font-bold">
                {balance ? formatCurrency(balance.totalEarned) : '0 ₫'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-emerald-100 text-sm mb-1">Đã rút</p>
              <p className="text-2xl font-bold">
                {balance ? formatCurrency(balance.totalWithdrawn) : '0 ₫'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
              
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-2">
                    {card.title}
                  </p>
                  <p className={`text-4xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}>
                    {card.value}
                  </p>
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            </div>
          ))}
        </div>

        {/* Quick Actions - Chỉ hiển thị khi có dữ liệu */}
        {stats.totalBookings > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-xl text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Thống kê lịch hẹn</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Lịch hẹn thành công: <span className="font-bold text-white">{stats.completedBookings || 0}</span></span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Lịch hẹn đã hủy: <span className="font-bold text-white">{stats.cancelledBookings || 0}</span></span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Tổng lịch hẹn: <span className="font-bold text-white">{stats.totalBookings || 0}</span></span>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Tỷ lệ thành công</span>
                    <span className="font-bold text-emerald-400">
                      {stats.totalBookings > 0 ? Math.round(((stats.completedBookings || 0) / stats.totalBookings) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {stats.totalWorkoutsSessions > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Tổng buổi tập</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tổng số buổi tập của học viên</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {stats.totalWorkoutsSessions}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Withdraw Dialog - Modern UI */}
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Wallet className="w-5 h-5" />
                </div>
                <DialogTitle className="text-2xl font-bold text-white">Rút tiền</DialogTitle>
              </div>
              <DialogDescription className="text-emerald-50 text-sm">
                Số dư khả dụng của bạn
              </DialogDescription>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  {balance ? formatCurrency(getBalanceValue(balance.availableBalance)) : '0 ₫'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Amount Buttons */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Chọn số tiền rút
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[50000, 100000, 200000, 500000, 1000000].map((amount) => {
                    const availableBalance = balance ? getBalanceValue(balance.availableBalance) : 0;
                    const isDisabled = amount > availableBalance || amount < 50000;
                    const isSelected = withdrawForm.amount === amount;
                    
                    return (
                      <Button
                        key={amount}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          isSelected 
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                            : 'hover:bg-emerald-50'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !isDisabled && setWithdrawForm({ ...withdrawForm, amount })}
                        disabled={isDisabled}
                      >
                        {formatCurrency(amount).replace(' ₫', 'k')}
                      </Button>
                    );
                  })}
                  <Button
                    type="button"
                    variant={withdrawForm.amount === (balance ? getBalanceValue(balance.availableBalance) : 0) ? "default" : "outline"}
                    className={`h-12 text-sm font-medium ${
                      withdrawForm.amount === (balance ? getBalanceValue(balance.availableBalance) : 0)
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'hover:bg-emerald-50'
                    }`}
                    onClick={() => {
                      const availableBalance = balance ? getBalanceValue(balance.availableBalance) : 0;
                      if (availableBalance >= 50000) {
                        setWithdrawForm({ ...withdrawForm, amount: availableBalance });
                      }
                    }}
                    disabled={!balance || getBalanceValue(balance.availableBalance) < 50000}
                  >
                    Tất cả
                  </Button>
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold text-slate-700">
                  Hoặc nhập số tiền tùy chọn
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={withdrawForm.amount || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 0) {
                        setWithdrawForm({ ...withdrawForm, amount: value });
                      }
                    }}
                    className="h-12 text-lg font-semibold pr-12"
                    placeholder="Nhập số tiền"
                    min={50000}
                    step={10000}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₫</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info className="w-3 h-3" />
                  <span>Số tiền tối thiểu: {formatCurrency(50000)}</span>
                </div>
                {withdrawForm.amount > 0 && withdrawForm.amount < 50000 && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded-md">
                    <AlertCircle className="w-3 h-3" />
                    <span>Số tiền tối thiểu là {formatCurrency(50000)}</span>
                  </div>
                )}
                {balance && withdrawForm.amount > getBalanceValue(balance.availableBalance) && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded-md">
                    <AlertCircle className="w-3 h-3" />
                    <span>Số tiền vượt quá số dư khả dụng</span>
                  </div>
                )}
              </div>

              {/* Bank Account Info */}
              <div className="space-y-2">
                <Label htmlFor="bankAccountInfo" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Thông tin tài khoản ngân hàng
                </Label>
                <Textarea
                  id="bankAccountInfo"
                  value={withdrawForm.bankAccountInfo}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bankAccountInfo: e.target.value })}
                  placeholder="Ví dụ: Ngân hàng: Vietcombank&#10;Số tài khoản: 1234567890&#10;Tên chủ tài khoản: NGUYEN VAN A"
                  className="min-h-[100px] resize-none"
                  rows={4}
                />
                <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-md">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Vui lòng nhập đầy đủ thông tin: Tên ngân hàng, Số tài khoản, Tên chủ tài khoản để đảm bảo quá trình rút tiền diễn ra suôn sẻ.</span>
                </div>
              </div>

              {/* Summary Card */}
              {withdrawForm.amount > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Số tiền rút:</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(withdrawForm.amount)}</span>
                  </div>
                  {balance && (
                    <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200">
                      <span>Số dư còn lại:</span>
                      <span className="font-medium">
                        {formatCurrency(getBalanceValue(balance.availableBalance) - withdrawForm.amount)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-6 pt-0 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setWithdrawDialogOpen(false);
                  setWithdrawForm({ amount: 0, bankAccountInfo: '' });
                }}
                disabled={withdrawing}
              >
                Hủy
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={
                  withdrawing || 
                  !withdrawForm.amount || 
                  withdrawForm.amount < 50000 ||
                  !withdrawForm.bankAccountInfo.trim() ||
                  (balance ? withdrawForm.amount > getBalanceValue(balance.availableBalance) : false)
                }
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                {withdrawing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Xác nhận rút tiền
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
