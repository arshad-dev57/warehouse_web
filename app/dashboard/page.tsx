'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  Clock, CheckCircle, DollarSign, Calendar, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight, Boxes,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

// ── Custom Tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e5e4df] rounded-lg px-3 py-2 shadow-sm text-[12px]">
      <p className="text-[#6b6b67] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-medium text-[#0d0d0d]">
          {p.name}: <span style={{ color: p.color }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({
  label, value, delta, deltaType, icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  deltaType: 'up' | 'down' | 'warn';
  icon: any;
}) {
  const deltaColor =
    deltaType === 'up' ? 'text-emerald-600' :
    deltaType === 'down' ? 'text-red-500' : 'text-amber-600';
  const DeltaIcon = deltaType === 'up' ? ArrowUpRight : deltaType === 'down' ? ArrowDownRight : Clock;

  return (
    <div className="bg-white border border-[#e5e4df] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11.5px] text-[#9a9a97] uppercase tracking-[0.06em]">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-[#f7f7f5] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#6b6b67]" />
        </div>
      </div>
      <p className="text-[26px] font-medium text-[#0d0d0d] tracking-tight leading-none mb-2 font-mono">
        {value}
      </p>
      <div className={`flex items-center gap-1 text-[11px] ${deltaColor}`}>
        <DeltaIcon className="w-3 h-3" />
        {delta}
      </div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[13px] font-medium text-[#0d0d0d]">{title}</h3>
      {action && (
        <button className="flex items-center gap-0.5 text-[11.5px] text-[#9a9a97] hover:text-[#0d0d0d] transition-colors">
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProducts: 0, totalStockValue: 0,
    lowStockCount: 0, expiringCount: 0,
    todayStockIn: 0, todayStockOut: 0, pendingOrders: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stockMovement, setStockMovement] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Monochrome palette for charts
  const CHART_COLORS = ['#0d0d0d', '#6b6b67', '#b4b3ae', '#d1d1ce', '#e5e4df'];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const [metricsRes, activitiesRes, alertsRes, stockRes, categoryRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/dashboard/activities`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/dashboard/alerts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/dashboard/charts/stock-movement`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/dashboard/charts/categories`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [m, a, al, s, c] = await Promise.all([
        metricsRes.json(), activitiesRes.json(), alertsRes.json(),
        stockRes.json(), categoryRes.json(),
      ]);

      if (m.success) setMetrics(m.data);
      if (a.success) setActivities(a.data?.activities || a.data || []);
      if (al.success) setAlerts(al.data?.alerts || al.data || []);
      if (s.success) setStockMovement(s.data?.data || s.data || []);
      if (c.success) setCategoryDistribution(
        c.data?.categories || c.data?.data?.categories || c.data || []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-8 h-8 border-2 border-[#0d0d0d] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-[#9a9a97]">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-medium text-[#0d0d0d] leading-none">
            Good morning, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h2>
          <p className="text-[12.5px] text-[#9a9a97] mt-1">
            Here's what's happening in your warehouse today.
          </p>
        </div>
        <button
          onClick={loadData}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e5e4df] text-[12px] text-[#6b6b67] hover:bg-white hover:text-[#0d0d0d] transition-colors"
        >
          <Activity className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Primary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Products"
          value={metrics.totalProducts.toLocaleString()}
          delta="+4.2% this week"
          deltaType="up"
          icon={Package}
        />
        <StatCard
          label="Inventory Value"
          value={fmt(metrics.totalStockValue)}
          delta="+2.8% vs last month"
          deltaType="up"
          icon={DollarSign}
        />
        <StatCard
          label="Stock In Today"
          value={`+${metrics.todayStockIn}`}
          delta="12 inbound batches"
          deltaType="up"
          icon={TrendingUp}
        />
        <StatCard
          label="Stock Out Today"
          value={`−${metrics.todayStockOut}`}
          delta="8 dispatched"
          deltaType="down"
          icon={TrendingDown}
        />
      </div>

      {/* ── Health Strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Low Stock Items',
            value: metrics.lowStockCount,
            icon: AlertTriangle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
          },
          {
            label: 'Expiring Soon',
            value: metrics.expiringCount,
            icon: Calendar,
            color: 'text-red-500',
            bg: 'bg-red-50',
            border: 'border-red-100',
          },
          {
            label: 'Pending Orders',
            value: metrics.pendingOrders,
            icon: Clock,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
          },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`flex items-center gap-3 bg-white border ${border} rounded-xl px-4 py-3.5`}
          >
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-[11px] text-[#9a9a97] leading-none mb-1">{label}</p>
              <p className={`text-[22px] font-medium leading-none font-mono ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Line Chart — 3/5 */}
        <div className="lg:col-span-3 bg-white border border-[#e5e4df] rounded-xl p-5">
          <SectionHeader title="Stock movement — last 7 days" action="Full report" />
          {/* Legend */}
          <div className="flex items-center gap-5 mb-4">
            {[
              { label: 'Stock In', color: '#0d0d0d' },
              { label: 'Stock Out', color: '#b4b3ae' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[11px] text-[#9a9a97]">{label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stockMovement} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0efea" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9a9a97' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9a9a97' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="stockIn"
                name="Stock In"
                stroke="#0d0d0d"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0d0d0d', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="stockOut"
                name="Stock Out"
                stroke="#b4b3ae"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 3, fill: '#b4b3ae', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              {/* Fallback: single 'value' key from API */}
              {stockMovement[0]?.value !== undefined && (
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Movement"
                  stroke="#0d0d0d"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0d0d0d', strokeWidth: 0 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — 2/5 */}
        <div className="lg:col-span-2 bg-white border border-[#e5e4df] rounded-xl p-5">
          <SectionHeader title="Category split" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                dataKey="productCount"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
              >
                {categoryDistribution.map((entry: any, i: number) => (
                  <Cell
                    key={`cell-${entry.categoryName || i}`}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [value, name]}
                contentStyle={{
                  fontSize: 12, borderRadius: 8,
                  border: '0.5px solid #e5e4df', boxShadow: 'none',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="space-y-1.5 mt-3">
            {categoryDistribution.slice(0, 5).map((cat: any, i: number) => (
              <div key={cat.categoryName || i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-[11.5px] text-[#6b6b67] truncate max-w-[100px]">
                    {cat.categoryName}
                  </span>
                </div>
                <span className="text-[11.5px] font-mono text-[#0d0d0d]">{cat.productCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alerts & Activities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Alerts */}
        <div className="bg-white border border-[#e5e4df] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e4df]">
            <h3 className="text-[13px] font-medium text-[#0d0d0d]">Active alerts</h3>
            {alerts.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                {alerts.length} active
              </span>
            )}
          </div>
          <div className="divide-y divide-[#e5e4df]">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <p className="text-[12.5px] text-[#9a9a97]">No active alerts</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert: any, i: number) => {
                const severityColor =
                  alert.severity === 'high' || alert.type === 'danger' ? '#dc2626' :
                  alert.severity === 'medium' ? '#d97706' : '#2563eb';
                return (
                  <div
                    key={alert.id || alert._id || i}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#f7f7f5] transition-colors"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: severityColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium text-[#0d0d0d] leading-snug truncate">
                        {alert.title}
                      </p>
                      <p className="text-[11.5px] text-[#9a9a97] mt-0.5 leading-snug line-clamp-1">
                        {alert.message}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#d1d1ce] flex-shrink-0 mt-0.5" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white border border-[#e5e4df] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e4df]">
            <h3 className="text-[13px] font-medium text-[#0d0d0d]">Recent activity</h3>
            <button className="flex items-center gap-0.5 text-[11.5px] text-[#9a9a97] hover:text-[#0d0d0d] transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-[#e5e4df]">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Boxes className="w-8 h-8 text-[#d1d1ce]" />
                <p className="text-[12.5px] text-[#9a9a97]">No recent activity</p>
              </div>
            ) : (
              activities.slice(0, 5).map((activity: any, i: number) => (
                <div
                  key={activity.id || activity._id || i}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#f7f7f5] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#f7f7f5] border border-[#e5e4df] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-[#9a9a97]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-[#0d0d0d] leading-snug">
                      {activity.action}
                    </p>
                    <p className="text-[11.5px] text-[#9a9a97] mt-0.5 leading-snug line-clamp-1">
                      {activity.details}
                    </p>
                  </div>
                  {activity.createdAt && (
                    <span className="text-[10.5px] text-[#b4b3ae] font-mono flex-shrink-0 mt-0.5">
                      {new Date(activity.createdAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}