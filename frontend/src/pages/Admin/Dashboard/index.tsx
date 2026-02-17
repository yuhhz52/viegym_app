import { useEffect, useState } from 'react';
import { getDashboardStats, getCommunityPosts } from './api';
import LoadingState from '@/components/LoadingState';
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('tuần');

    const fetchDashboardData = async () => {
        try {
            const [data, communityPosts] = await Promise.all([
                getDashboardStats(),
                getCommunityPosts()
            ]) as [
                {
                    userStats?: {
                        totalUsers?: number;
                        totalCoaches?: number;
                        activeLast24h?: number;
                        newUsersByWeek?: { weekLabel: string; newUsers: number }[];
                    };
                    contentStats?: {
                        pendingReports?: number;
                    };
                    nutritionStats?: {
                        percentLogged7d: number;
                        avgCalories: number;
                        avgDaysLoggedPerUser: number;
                    };
                    healthStats?: {
                        percentUpdated30d: number;
                        avgWeightChangeKg: number;
                        usersWeightDecreased: number;
                        usersWeightIncreased: number;
                        usersWeightMaintained: number;
                        avgBmi: number;
                    };
                    engagementStats?: {
                        workoutCompletionRate: number;
                        retentionRate7d: number;
                        activeUsersLast7d: number;
                        activeUsersLast30d: number;
                    };
                },
                any[]
            ];
            
            // Calculate real pending reports from community posts
            const realPendingReports = Array.isArray(communityPosts) 
                ? communityPosts.filter((post: any) => post.reportCount > 0).length 
                : 0;
            
            setStats({
                usersTotal: data.userStats?.totalUsers ?? 0,
                coachesTotal: data.userStats?.totalCoaches ?? 0,
                active24h: data.userStats?.activeLast24h !== undefined ? data.userStats.activeLast24h : Math.floor((data.userStats?.totalUsers ?? 0) * 0.15),
                newUsersByWeek: (data.userStats?.newUsersByWeek || []).map(item => ({
                    name: item.weekLabel,
                    value: item.newUsers
                })),
                pendingReports: realPendingReports,
                nutrition: data.nutritionStats ?? { percentLogged7d: 0, avgCalories: 0, avgDaysLoggedPerUser: 0 },
                health: data.healthStats ?? { percentUpdated30d: 0, avgWeightChangeKg: 0, usersWeightDecreased: 0, usersWeightIncreased: 0, usersWeightMaintained: 0, avgBmi: 0 },
                engagement: data.engagementStats ?? { workoutCompletionRate: 0, retentionRate7d: 0, activeUsersLast7d: 0, activeUsersLast30d: 0 },
            });
        } catch (e) {
            console.error('Lỗi tải dữ liệu dashboard:', e);
            // Giữ dữ liệu cũ nếu có, không set fallback data
            if (!stats) {
                setStats({
                    usersTotal: 0,
                    coachesTotal: 0,
                    active24h: 0,
                    pendingReports: 0,
                    newUsersByWeek: [],
                    nutrition: { percentLogged7d: 0, avgCalories: 0, avgDaysLoggedPerUser: 0 },
                    health: { percentUpdated30d: 0, avgWeightChangeKg: 0, usersWeightDecreased: 0, usersWeightIncreased: 0, usersWeightMaintained: 0, avgBmi: 0 },
                    engagement: { workoutCompletionRate: 0, retentionRate7d: 0, activeUsersLast7d: 0, activeUsersLast30d: 0 },
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        
        // Auto refresh every 30 seconds
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [timeRange]);

    if (loading) {
        return <LoadingState message="Đang tải bảng điều khiển..." fullScreen />;
    }

    if (!stats) return <div className="p-8 text-center text-slate-500">Không có dữ liệu</div>;

    const growthRate = stats.newUsersByWeek.length > 1 && stats.newUsersByWeek[0].value > 0
        ? ((stats.newUsersByWeek[stats.newUsersByWeek.length - 1].value - stats.newUsersByWeek[0].value) / stats.newUsersByWeek[0].value * 100).toFixed(1)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 transform hover:scale-105 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                                    Dashboard Analytics
                                </h1>
                                <p className="text-slate-500 mt-1 text-sm">Thông tin chi tiết theo thời gian thực và các chỉ số hiệu suất</p>
                            </div>
                        </div>
                        
                        {/* Time Range Selector */}
                        <div className="flex gap-2 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-1.5 shadow-inner">
                            {['ngày', 'tuần', 'tháng'].map((range) => (
                                <button
                                    key={range}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setTimeRange(range);
                                    }}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer select-none ${
                                        timeRange === range
                                            ? 'bg-white shadow-lg text-blue-600 scale-105'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:scale-102'
                                    }`}
                                >
                                    {range.charAt(0).toUpperCase() + range.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Users */}
                    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-blue-200 hover:-translate-y-1">
                        <div className="p-6 relative">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/40 group-hover:shadow-blue-500/60 group-hover:scale-110 transition-all duration-300">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        +12.5%
                                    </div>
                                </div>
                                <h3 className="text-slate-500 text-sm font-semibold mb-2 uppercase tracking-wide">Tổng số người dùng</h3>
                                <p className="text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">{stats.usersTotal.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 font-medium">Thành viên đã đăng ký</p>
                            </div>
                        </div>
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>

                    {/* Total Coaches */}
                    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-purple-200 hover:-translate-y-1">
                        <div className="p-6 relative">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/40 group-hover:shadow-purple-500/60 group-hover:scale-110 transition-all duration-300">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        +8.3%
                                    </div>
                                </div>
                                <h3 className="text-slate-500 text-sm font-semibold mb-2 uppercase tracking-wide">Huấn luyện viên</h3>
                                <p className="text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">{stats.coachesTotal.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 font-medium">Coaches đang hoạt động</p>
                            </div>
                        </div>
                        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>

                    {/* Active Users 24h */}
                    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-emerald-200 hover:-translate-y-1">
                        <div className="p-6 relative">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/40 group-hover:shadow-emerald-500/60 group-hover:scale-110 transition-all duration-300">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                                        <span>Live</span>
                                    </div>
                                </div>
                                <h3 className="text-slate-500 text-sm font-semibold mb-2 uppercase tracking-wide">Hoạt động (24h)</h3>
                                <p className="text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">{stats.active24h.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 font-medium">Người dùng trực tuyến hôm nay</p>
                            </div>
                        </div>
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>

                    {/* Pending Reports */}
                    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-orange-200 hover:-translate-y-1">
                        <div className="p-6 relative">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/40 group-hover:shadow-orange-500/60 group-hover:scale-110 transition-all duration-300">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    {stats.pendingReports > 0 && (
                                        <div className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                                            Cần xử lý
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-slate-500 text-sm font-semibold mb-2 uppercase tracking-wide">Báo cáo chờ xử lý</h3>
                                <p className="text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">{stats.pendingReports}</p>
                                <p className="text-xs text-slate-400 font-medium">Đang chờ xem xét</p>
                            </div>
                        </div>
                        <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Growth Chart - Takes 2 columns */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                                    Xu hướng tăng trưởng người dùng
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">Đăng ký người dùng mới theo thời gian</p>
                            </div>
                            <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 shadow-sm">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-2xl font-extrabold text-emerald-600">{growthRate}%</span>
                                    <p className="text-xs text-slate-600 font-semibold">Tăng trưởng</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-80" key={timeRange}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.newUsersByWeek}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#94a3b8"
                                        style={{ fontSize: '12px', fontWeight: '600' }}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8"
                                        style={{ fontSize: '12px', fontWeight: '600' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: 'none',
                                            borderRadius: '16px',
                                            boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.2)',
                                            padding: '12px 16px'
                                        }}
                                        labelStyle={{ fontWeight: '700', color: '#1e293b' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#3b82f6" 
                                        strokeWidth={3}
                                        fill="url(#colorUsers)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Health & Nutrition Stats */}
                    <div className="space-y-6">
                        {/* Nutrition Card */}
                        <div className="group relative bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 text-white overflow-hidden hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
                            
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold">Theo dõi dinh dưỡng</h4>
                                        <p className="text-white/80 text-sm font-medium">7 ngày qua</p>
                                    </div>
                                    <div className="group/tooltip relative">
                                        <svg className="w-5 h-5 text-white/70 hover:text-white cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="absolute right-0 top-8 w-64 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20">
                                            <p className="font-semibold mb-1">Tỷ lệ cập nhật:</p>
                                            <p className="text-slate-300">% người dùng đã ghi nhật ký dinh dưỡng ít nhất 1 lần trong 7 ngày qua</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-5">
                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-white/90">Tỷ lệ cập nhật</span>
                                            <span className="text-2xl font-extrabold">{stats.nutrition.percentLogged7d.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 overflow-hidden shadow-inner">
                                            <div 
                                                className="bg-white h-full rounded-full transition-all duration-700 shadow-lg relative overflow-hidden"
                                                style={{ width: `${Math.min(stats.nutrition.percentLogged7d, 100)}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/20">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-colors">
                                            <span className="text-xs text-white/80 block mb-1.5 font-semibold uppercase tracking-wider">Calories TB/ngày</span>
                                            <span className="text-2xl font-extrabold block">{Math.round(stats.nutrition.avgCalories).toLocaleString()}</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-colors">
                                            <span className="text-xs text-white/80 block mb-1.5 font-semibold uppercase tracking-wider">Ngày ghi TB/user</span>
                                            <span className="text-2xl font-extrabold block">{stats.nutrition.avgDaysLoggedPerUser?.toFixed(1) || '0.0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Health Card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold">Chỉ số sức khỏe</h4>
                                    <p className="text-white/80 text-sm">30 ngày qua</p>
                                </div>
                                <div className="group relative">
                                    <svg className="w-5 h-5 text-white/60 hover:text-white cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="absolute right-0 top-8 w-64 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                        <p className="font-semibold mb-1">Thay đổi cân nặng:</p>
                                        <p className="text-slate-300">So sánh cân nặng TB của 7 ngày gần nhất với 7 ngày trước đó</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Progress Bar */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Tỷ lệ cập nhật</span>
                                        <span className="text-xl font-bold">{stats.health.percentUpdated30d.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-white h-full rounded-full transition-all duration-500 shadow-lg"
                                            style={{ width: `${Math.min(stats.health.percentUpdated30d, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/80">Thay đổi cân nặng TB</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold">{Math.abs(stats.health.avgWeightChangeKg).toFixed(2)}</span>
                                            <span className="text-sm">kg</span>
                                            {stats.health.avgWeightChangeKg > 0.1 ? (
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <title>Tăng cân</title>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            ) : stats.health.avgWeightChangeKg < -0.1 ? (
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <title>Giảm cân</title>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <title>Duy trì</title>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Engagement Card - NEW */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold">Mức độ tương tác</h4>
                                    <p className="text-white/80 text-sm">Hoạt động gần đây</p>
                                </div>
                                <div className="group relative">
                                    <svg className="w-5 h-5 text-white/60 hover:text-white cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="absolute right-0 top-8 w-64 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                        <p className="font-semibold mb-1">Tỷ lệ hoàn thành:</p>
                                        <p className="text-slate-300">% workout sessions có duration {'>'} 0 (đã hoàn thành) trong 7 ngày qua</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Workout Completion Rate */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Hoàn thành workout</span>
                                        <span className="text-xl font-bold">{stats.engagement.workoutCompletionRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-white h-full rounded-full transition-all duration-500 shadow-lg"
                                            style={{ width: `${Math.min(stats.engagement.workoutCompletionRate, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                                    <div>
                                        <span className="text-xs text-white/70 block mb-1">Users hoạt động 7d</span>
                                        <span className="text-2xl font-bold block">{stats.engagement.activeUsersLast7d.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-white/70 block mb-1">Retention rate</span>
                                        <span className="text-2xl font-bold block">{stats.engagement.retentionRate7d.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}