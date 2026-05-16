'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Package, DollarSign, TrendingUp, TrendingDown,
  Share2, Printer, Download, Search, Filter, X,
  ChevronDown, ChevronUp, Eye, AlertTriangle, CheckCircle,
  Layers, Box, Wallet, ArrowUpDown, Zap, Clock,
  Building2, Tag, Grid3x3, BarChart3
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: string;
  qty: number;
  unitCost: number;
  sellingPrice: number;
  totalCostValue: number;
  sellingValue: number;
  potentialProfit: number;
  profitMargin: number;
  minStock: number;
  maxStock: number;
  daysInStock: number;
  status: string;
  location: string;
  expiryDate?: string;
}

interface SummaryData {
  totalCostValue: number;
  totalSellingValue: number;
  totalPotentialProfit: number;
  lowStockCount: number;
  overStockCount: number;
  totalItems: number;
  totalQty: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function InventoryValuationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalCostValue: 0,
    totalSellingValue: 0,
    totalPotentialProfit: 0,
    lowStockCount: 0,
    overStockCount: 0,
    totalItems: 0,
    totalQty: 0
  });
  const [categories, setCategories] = useState<CategoryOption[]>([{ id: 'all', name: 'All Categories' }]);
  const [zones] = useState(['All', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E']);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Total Value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  const sortOptions = ['Total Value', 'Qty', 'Unit Cost', 'Profit Margin', 'Name', 'Days in Stock'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, selectedCategory, selectedZone, searchQuery, sortBy, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/inventory/valuation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const valuationData = data.data;
        setItems(valuationData.items || []);
        setSummary(valuationData.summary || {});
        
        // Extract categories from items
        const uniqueCategories = new Map<string, string>();
        (valuationData.items || []).forEach((item: any) => {
          if (item.category && item.categoryId) {
            uniqueCategories.set(item.categoryId, item.category);
          }
        });
        const categoryList = Array.from(uniqueCategories.entries()).map(([id, name]) => ({ id, name }));
        setCategories([{ id: 'all', name: 'All Categories' }, ...categoryList]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.categoryId === selectedCategory);
    }

    // Zone filter
    if (selectedZone !== 'All') {
      const zoneLetter = selectedZone.replace('Zone ', '');
      filtered = filtered.filter(item => item.location?.startsWith(zoneLetter));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'Total Value':
          comparison = a.totalCostValue - b.totalCostValue;
          break;
        case 'Qty':
          comparison = a.qty - b.qty;
          break;
        case 'Unit Cost':
          comparison = a.unitCost - b.unitCost;
          break;
        case 'Profit Margin':
          comparison = a.profitMargin - b.profitMargin;
          break;
        case 'Name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'Days in Stock':
          comparison = a.daysInStock - b.daysInStock;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(filtered);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusDetails = (item: InventoryItem) => {
    if (item.qty <= item.minStock) return { label: 'LOW', color: 'orange', icon: AlertTriangle };
    if (item.maxStock > 0 && item.qty >= item.maxStock * 1.2) return { label: 'OVER', color: 'orange-700', icon: TrendingUp };
    if (item.daysInStock > 90) return { label: 'DEAD', color: 'red', icon: Clock };
    if (item.daysInStock < 15 && item.qty > 50) return { label: 'FAST', color: 'green', icon: Zap };
    return { label: 'OK', color: 'blue', icon: CheckCircle };
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedZone('All');
    setSearchQuery('');
    setSortBy('Total Value');
    setSortOrder('desc');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedZone !== 'All' || searchQuery !== '';

  const handleExportPDF = () => {
    const now = new Date().toLocaleString();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const deadStockValue = items.filter(i => i.daysInStock > 90).reduce((sum, i) => sum + i.totalCostValue, 0);
    const fastMovingCount = items.filter(i => i.daysInStock < 15 && i.qty > 50).length;
    const deadStockCount = items.filter(i => i.daysInStock > 90).length;
    
    const tableRows = filteredItems.slice(0, 50).map(item => {
      const status = getStatusDetails(item);
      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 12px;">
            <div style="font-weight:500;">${item.name}</div>
            <div style="font-size:11px;color:#6b7280;">SKU: ${item.sku}</div>
          </td>
          <td style="padding:10px 12px;text-align:center;">${item.qty}</td>
          <td style="padding:10px 12px;text-align:right;">${formatCurrency(item.unitCost)}</td>
          <td style="padding:10px 12px;text-align:right;">${formatCurrency(item.totalCostValue)}</td>
          <td style="padding:10px 12px;text-align:center;">
            <span style="display:inline-block;padding:4px 8px;background:${status.color === 'orange' ? '#fed7aa' : status.color === 'red' ? '#fee2e2' : '#dcfce7'};border-radius:6px;font-size:11px;font-weight:600;color:${status.color === 'orange' ? '#c2410c' : status.color === 'red' ? '#dc2626' : '#166534'}">
              ${status.label}
            </span>
           </td>
        </tr>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Inventory Valuation Report - ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Inter',sans-serif;background:white;padding:40px;}
    @media print{body{padding:20px;}}
    .header{border-bottom:2px solid #1a1a2e;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;}
    .title{font-size:24px;font-weight:700;color:#1a1a2e;}
    .subtitle{font-size:12px;color:#6b7280;margin-top:4px;}
    .badge{display:inline-block;background:#1a1a2e;color:white;padding:4px 12px;border-radius:4px;font-size:11px;}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:30px;}
    .kpi-card{background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e5e7eb;}
    .kpi-label{font-size:11px;color:#6b7280;margin-bottom:6px;}
    .kpi-value{font-size:20px;font-weight:700;color:#1a1a2e;}
    .insight-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:30px;}
    .insight-card{background:#f8fafc;border-radius:10px;padding:12px;text-align:center;}
    .insight-count{font-size:22px;font-weight:700;}
    table{width:100%;border-collapse:collapse;margin-top:20px;}
    th{background:#f8fafc;padding:12px;text-align:left;font-size:11px;font-weight:600;color:#475569;border-bottom:2px solid #e5e7eb;}
    td{padding:10px 12px;font-size:12px;border-bottom:1px solid #f0f0f0;}
    .footer{margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Inventory Valuation Report</div>
      <div class="subtitle">Warehouse Management System</div>
    </div>
    <div><div class="badge">${dateStr}</div><div class="subtitle" style="margin-top:8px;">${now}</div></div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">Total Cost Value</div><div class="kpi-value">${formatCurrency(summary.totalCostValue)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Total Sell Value</div><div class="kpi-value">${formatCurrency(summary.totalSellingValue)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Potential Profit</div><div class="kpi-value">${formatCurrency(summary.totalPotentialProfit)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Dead Stock Value</div><div class="kpi-value">${formatCurrency(deadStockValue)}</div></div>
  </div>

  <div class="insight-grid">
    <div class="insight-card"><div class="insight-count" style="color:#22c55e;">${fastMovingCount}</div><div style="font-size:12px;">Fast Moving</div></div>
    <div class="insight-card"><div class="insight-count" style="color:#f97316;">${summary.overStockCount}</div><div style="font-size:12px;">Overstock</div></div>
    <div class="insight-card"><div class="insight-count" style="color:#ef4444;">${deadStockCount}</div><div style="font-size:12px;">Dead Stock</div></div>
  </div>

  <table>
    <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total Value</th><th>Status</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    <div>Generated: ${now}</div>
    <div>Warehouse Management System © ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1024,height=800');
    if (!win) { alert('Please allow popups to generate PDF.'); return; }
    win.document.write(html);
    win.document.close();
  };

  const handleShare = async () => {
    const text = `📊 Inventory Valuation Report\n\n` +
      `💰 Total Cost Value: ${formatCurrency(summary.totalCostValue)}\n` +
      `📈 Total Sell Value: ${formatCurrency(summary.totalSellingValue)}\n` +
      `💹 Potential Profit: ${formatCurrency(summary.totalPotentialProfit)}\n` +
      `📦 Total Items: ${formatNumber(summary.totalItems)}\n` +
      `📊 Total Quantity: ${formatNumber(summary.totalQty)}\n\n` +
      `📅 ${new Date().toLocaleString()}`;
    
    if (navigator.share) {
      try { await navigator.share({ title: 'Inventory Valuation Report', text }); } catch { }
    } else {
      await navigator.clipboard.writeText(text);
      alert('✅ Report copied to clipboard!');
    }
  };

  const handlePrint = () => { window.print(); };

  const deadStockValue = items.filter(i => i.daysInStock > 90).reduce((sum, i) => sum + i.totalCostValue, 0);
  const fastMovingCount = items.filter(i => i.daysInStock < 15 && i.qty > 50).length;
  const deadStockCount = items.filter(i => i.daysInStock > 90).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-600 animate-spin" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading inventory valuation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900">
              <Home className="w-3.5 h-3.5" /><span>Dashboard</span>
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold">Inventory Valuation</span>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Inventory Analytics</p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Valuation</h1>
              <p className="text-sm text-gray-500 mt-1">Stock value analysis by cost and selling price</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full">
              <Wallet className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-semibold text-purple-700">Valuation Report</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <Wallet className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{formatCurrency(summary.totalCostValue)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Total Cost Value</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{formatCurrency(summary.totalSellingValue)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Total Sell Value</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{formatCurrency(summary.totalPotentialProfit)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Potential Profit</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{formatCurrency(deadStockValue)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Dead Stock Value</p>
          </div>
        </div>

        {/* Insights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Fast Moving</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{formatNumber(fastMovingCount)}</p>
            <p className="text-xs text-green-600 mt-1">items</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">Overstock</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">{formatNumber(summary.overStockCount)}</p>
            <p className="text-xs text-orange-600 mt-1">items</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-red-600" />
              <span className="text-sm font-semibold text-red-700">Dead Stock</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{formatNumber(deadStockCount)}</p>
            <p className="text-xs text-red-600 mt-1">items</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Filters</h2>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 bg-white"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 bg-white"
            >
              {zones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
            
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 bg-white"
              >
                {sortOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-gray-500">
            Showing {formatNumber(filteredItems.length)} of {formatNumber(items.length)} products
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total Value</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Sell Value</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Profit</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStatusDetails(item);
                    const StatusIcon = status.icon;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-gray-700">{formatNumber(item.qty)}</td>
                        <td className="px-6 py-4 text-right font-mono text-gray-700">{formatCurrency(item.unitCost)}</td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900">{formatCurrency(item.totalCostValue)}</td>
                        <td className="px-6 py-4 text-right font-mono text-gray-700">{formatCurrency(item.sellingValue)}</td>
                        <td className={`px-6 py-4 text-right font-mono font-medium ${getProfitColor(item.potentialProfit)}`}>
                          {formatCurrency(item.potentialProfit)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-${status.color === 'orange' ? 'orange' : status.color === 'red' ? 'red' : status.color === 'green' ? 'green' : 'blue'}-100 text-${status.color === 'orange' ? 'orange' : status.color === 'red' ? 'red' : status.color === 'green' ? 'green' : 'blue'}-700`}>
                            <StatusIcon className="w-3 h-3" /> {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-900">TOTAL ({formatNumber(filteredItems.length)} items)</td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-900">{formatNumber(filteredItems.reduce((sum, i) => sum + i.qty, 0))}</td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(filteredItems.reduce((sum, i) => sum + i.totalCostValue, 0))}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(filteredItems.reduce((sum, i) => sum + i.sellingValue, 0))}</td>
                  <td className={`px-6 py-4 text-right font-bold ${getProfitColor(filteredItems.reduce((sum, i) => sum + i.potentialProfit, 0))}`}>
                    {formatCurrency(filteredItems.reduce((sum, i) => sum + i.potentialProfit, 0))}
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">System-generated report - For queries, contact administrator</p>
          <p className="text-xs text-gray-400">Warehouse Management System © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}