'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, TrendingUp, TrendingDown, Package, DollarSign,
  AlertTriangle, Calendar, FileText, BarChart3, PieChart,
  Download, Share2, ChevronRight, Box, ShoppingCart,
  Truck, Users, Building2, CreditCard, Activity, Shield
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface ReportCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

// Report Card Component
function ReportCard({ title, subtitle, icon: Icon, color, onClick }: ReportCardProps) {
  const colorClasses: Record<string, { bg: string; iconBg: string; hoverBg: string }> = {
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', hoverBg: 'hover:bg-blue-50' },
    orange: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', hoverBg: 'hover:bg-orange-50' },
    red: { bg: 'bg-red-50', iconBg: 'bg-red-100', hoverBg: 'hover:bg-red-50' },
    green: { bg: 'bg-green-50', iconBg: 'bg-green-100', hoverBg: 'hover:bg-green-50' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', hoverBg: 'hover:bg-purple-50' },
    indigo: { bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', hoverBg: 'hover:bg-indigo-50' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${colors.hoverBg}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}

// Summary Stats Card
function StatsCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
    </div>
  );
}

// Get user role from localStorage
const getUserRole = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.role || 'staff';
    } catch {
      return 'staff';
    }
  }
  return 'staff';
};

// Permission checks for different report types
const canViewFinancialReports = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canViewSalesReports = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canViewInventoryValuation = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canViewInventoryReports = () => {
  return true; // Everyone can view basic inventory reports (Stock Summary, Low Stock, Expiry)
};

// Main Reports Page
export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('staff');
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringCount: 0,
    totalCategories: 0
  });

  // Permission flags
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';
  const canViewFinancial = isAdmin || isManager;
  const canViewSales = isAdmin || isManager;
  const canViewValuation = isAdmin || isManager;

  useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    const token = getToken();
    try {
      // Get products
      const productsRes = await fetch(`${API_URL}/products?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = await productsRes.json();
      
      // Get categories
      const categoriesRes = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const categoriesData = await categoriesRes.json();

      const products = productsData.data || [];
      
      // Calculate summary
      let totalStockValue = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let expiringCount = 0;

      products.forEach((product: any) => {
        totalStockValue += (product.sellingPrice || 0) * (product.currentStock || 0);
        if (product.currentStock === 0) outOfStockCount++;
        else if (product.currentStock <= product.minimumStock) lowStockCount++;
        
        if (product.expiryDate) {
          const expiry = new Date(product.expiryDate);
          const daysLeft = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 30 && daysLeft > 0) expiringCount++;
        }
      });

      setSummary({
        totalProducts: products.length,
        totalStockValue: totalStockValue,
        lowStockCount: lowStockCount,
        outOfStockCount: outOfStockCount,
        expiringCount: expiringCount,
        totalCategories: categoriesData.data?.length || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Reports</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">View and export warehouse analytics and reports</p>
      </div>

      {/* Summary Stats - Visible to all */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard 
          title="Total Products" 
          value={summary.totalProducts.toLocaleString()} 
          icon={Package} 
          color="blue"
        />
        <StatsCard 
          title="Inventory Value" 
          value={formatCurrency(summary.totalStockValue)} 
          icon={DollarSign} 
          color="green"
        />
        <StatsCard 
          title="Categories" 
          value={summary.totalCategories.toLocaleString()} 
          icon={Box} 
          color="purple"
        />
        <StatsCard 
          title="Low Stock Items" 
          value={summary.lowStockCount} 
          icon={AlertTriangle} 
          color="orange"
        />
        <StatsCard 
          title="Out of Stock" 
          value={summary.outOfStockCount} 
          icon={AlertTriangle} 
          color="red"
        />
        <StatsCard 
          title="Expiring Soon" 
          value={summary.expiringCount} 
          icon={Calendar} 
          color="orange"
        />
      </div>

      {/* Basic Inventory Reports Section - Visible to all */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> Inventory Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <ReportCard
            title="Stock Summary Report"
            subtitle="Current stock levels with values"
            icon={BarChart3}
            color="blue"
            onClick={() => router.push('/reports/stock-summary')}
          />
          <ReportCard
            title="Low Stock Report"
            subtitle="Products below minimum level"
            icon={AlertTriangle}
            color="orange"
            onClick={() => router.push('/reports/low-stock')}
          />
          <ReportCard
            title="Expiry Report"
            subtitle="Products expiring soon"
            icon={Calendar}
            color="red"
            onClick={() => router.push('/reports/expiry')}
          />
        </div>
      </div>

      {/* Advanced Reports Section - Only Admin and Manager */}
      {(canViewFinancial || canViewSales || canViewValuation) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600" /> Advanced Reports
          </h2>
          <p className="text-xs text-gray-500 mb-3">These reports are restricted to Admin and Manager roles</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            
            {/* Inventory Valuation - Only Admin and Manager */}
            {canViewValuation && (
              <ReportCard
                title="Inventory Valuation"
                subtitle="Stock value by cost price"
                icon={DollarSign}
                color="green"
                onClick={() => router.push('/inventory/valuation')}
              />
            )}
            
            {/* Financial Reports - Only Admin and Manager */}
            {canViewFinancial && (
              <ReportCard
                title="Profit & Loss Report"
                subtitle="Revenue, cost and profit analysis"
                icon={TrendingUp}
                color="green"
                onClick={() => router.push('/reports/profit-loss')}
              />
            )}
            
            {/* Sales Reports - Only Admin and Manager */}
            {canViewSales && (
              <ReportCard
                title="Sales by Customer"
                subtitle="Customer-wise sales analysis"
                icon={Users}
                color="purple"
                onClick={() => router.push('/reports/sales')}
              />
            )}
          </div>
        </div>
      )}

      {/* Staff Restriction Message - Only for Staff users */}
      {isStaff && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Limited Access
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Advanced reports (Inventory Valuation, Financial Reports, and Sales Reports) are only available for Admin and Manager roles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}