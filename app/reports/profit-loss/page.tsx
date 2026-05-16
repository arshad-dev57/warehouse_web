'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, TrendingUp, TrendingDown, DollarSign, Package,
  ShoppingCart, Truck, Percent, Calendar, Download,
  Share2, Printer, Layers, CheckCircle, XCircle,
  ArrowRight, Clock, Building2, BarChart3, Wallet
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface RevenueData {
  totalSales: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
}

interface CostsData {
  costOfGoodsSold: number;
  operatingExpenses: number;
  shippingCosts: number;
  discountGiven: number;
  taxPaid: number;
}

interface ProfitData {
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  profitMargin: number;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  sales: number;
  profit: number;
  profitMargin: number;
}

interface ProfitLossReport {
  revenue: RevenueData;
  costs: CostsData;
  profit: ProfitData;
  categoryBreakdown: CategoryBreakdown[];
  period: string;
  startDate: string;
  endDate: string;
}

export default function ProfitLossReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  const updatePeriodDates = (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => {
    const now = new Date();
    const end = new Date();
    
    switch (period) {
      case 'daily':
        setStartDate(now);
        setEndDate(now);
        break;
      case 'weekly':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        setStartDate(weekAgo);
        setEndDate(now);
        break;
      case 'monthly':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setStartDate(monthAgo);
        setEndDate(now);
        break;
      case 'yearly':
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        setStartDate(yearAgo);
        setEndDate(now);
        break;
      default:
        break;
    }
  };

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => {
    setSelectedPeriod(period);
    updatePeriodDates(period);
    if (period !== 'custom') {
      generateReport();
    }
  };

  const generateReport = async () => {
    if (startDate > endDate) {
      alert('Start date must be before end date');
      return;
    }

    setGenerating(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/reports/profit-loss/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          period: selectedPeriod
        })
      });

      const data = await response.json();

      if (data.success) {
        setReport(data.data);
      } else {
        alert(data.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!report) return;

    const now = new Date().toLocaleString();
    const periodText = selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1);
    
    const categoryRows = report.categoryBreakdown.map(cat => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;">${cat.categoryName}</td>
        <td style="padding:10px 12px;text-align:right;">${formatCurrency(cat.sales)}</td>
        <td style="padding:10px 12px;text-align:right;">${formatCurrency(cat.profit)}</td>
        <td style="padding:10px 12px;text-align:right;">${cat.profitMargin.toFixed(1)}%</td>
      <tr>
    `).join('');

    const totalCosts = report.costs.costOfGoodsSold + report.costs.operatingExpenses + 
                       report.costs.shippingCosts + report.costs.discountGiven + report.costs.taxPaid;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Profit & Loss Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Inter',sans-serif;background:#f8fafc;padding:0;}
    @media print{body{background:white;}@page{margin:15mm;}}
    .page{max-width:1000px;margin:0 auto;background:white;padding:40px;}
    .header{border-bottom:3px solid #1a1a2e;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;}
    .title{font-size:24px;font-weight:700;color:#1a1a2e;}
    .subtitle{font-size:12px;color:#6b7280;margin-top:4px;}
    .badge{display:inline-block;background:#1a1a2e;color:white;padding:4px 12px;border-radius:4px;font-size:11px;}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:30px;}
    .kpi-card{padding:16px;border-radius:8px;color:white;}
    .kpi-card.blue{background:linear-gradient(135deg,#1d4ed8,#1e40af);}
    .kpi-card.green{background:linear-gradient(135deg,#059669,#047857);}
    .kpi-card.orange{background:linear-gradient(135deg,#ea580c,#c2410c);}
    .kpi-card.purple{background:linear-gradient(135deg,#7c3aed,#6d28d9);}
    .kpi-label{font-size:11px;font-weight:500;opacity:0.8;margin-bottom:8px;}
    .kpi-value{font-size:24px;font-weight:700;}
    .section{margin-bottom:25px;}
    .section-title{font-size:16px;font-weight:700;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e5e7eb;}
    table{width:100%;border-collapse:collapse;}
    th{text-align:left;padding:10px 12px;background:#f8fafc;font-size:12px;font-weight:600;color:#475569;}
    td{padding:10px 12px;font-size:13px;}
    .text-right{text-align:right;}
    .text-center{text-align:center;}
    .profit-positive{color:#059669;font-weight:700;}
    .profit-negative{color:#dc2626;font-weight:700;}
    .footer{margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="title">Profit & Loss Statement</div>
        <div class="subtitle">Warehouse Management System</div>
      </div>
      <div>
        <div class="badge">${periodText} Report</div>
        <div class="subtitle" style="margin-top:8px;">${formatDate(startDate)} - ${formatDate(endDate)}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card blue"><div class="kpi-label">Total Sales</div><div class="kpi-value">${formatCompactCurrency(report.revenue.totalSales)}</div></div>
      <div class="kpi-card green"><div class="kpi-label">Net Profit</div><div class="kpi-value">${formatCompactCurrency(report.profit.netProfit)}</div></div>
      <div class="kpi-card orange"><div class="kpi-label">Profit Margin</div><div class="kpi-value">${report.profit.profitMargin.toFixed(1)}%</div></div>
      <div class="kpi-card purple"><div class="kpi-label">Total Orders</div><div class="kpi-value">${formatNumber(report.revenue.totalOrders)}</div></div>
    </div>

    <div class="section">
      <div class="section-title">📊 Revenue Summary</div>
      <table>
        <tr><th>Metric</th><th class="text-right">Amount</th></tr>
        <tr><td>Total Sales</td><td class="text-right">${formatCurrency(report.revenue.totalSales)}</td></tr>
        <tr><td>Total Orders</td><td class="text-right">${formatNumber(report.revenue.totalOrders)}</td></tr>
        <tr><td>Items Sold</td><td class="text-right">${formatNumber(report.revenue.totalItemsSold)}</td></tr>
        <tr><td>Average Order Value</td><td class="text-right">${formatCurrency(report.revenue.averageOrderValue)}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">💰 Costs & Expenses</div>
      <table>
        <tr><th>Cost Type</th><th class="text-right">Amount</th></tr>
        <tr><td>Cost of Goods Sold</td><td class="text-right">${formatCurrency(report.costs.costOfGoodsSold)}</td></tr>
        <tr><td>Operating Expenses</td><td class="text-right">${formatCurrency(report.costs.operatingExpenses)}</td></tr>
        <tr><td>Shipping Costs</td><td class="text-right">${formatCurrency(report.costs.shippingCosts)}</td></tr>
        <tr><td>Discounts Given</td><td class="text-right">${formatCurrency(report.costs.discountGiven)}</td></tr>
        <tr><td>Tax Paid</td><td class="text-right">${formatCurrency(report.costs.taxPaid)}</td></tr>
        <tr style="border-top:2px solid #e5e7eb;"><td><strong>Total Costs</strong></td><td class="text-right"><strong>${formatCurrency(totalCosts)}</strong></td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">📈 Profit Analysis</div>
      <table>
        <tr><th>Metric</th><th class="text-right">Amount</th></tr>
        <tr><td>Gross Profit</td><td class="text-right">${formatCurrency(report.profit.grossProfit)}</td></tr>
        <tr><td>Gross Margin</td><td class="text-right">${report.profit.grossMargin.toFixed(1)}%</td></tr>
        <tr style="border-top:2px solid #e5e7eb;"><td><strong>Net Profit</strong></td><td class="text-right"><strong class="${report.profit.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(report.profit.netProfit)}</strong></td></tr>
        <tr><td>Net Profit Margin</td><td class="text-right"><span class="${report.profit.profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">${report.profit.profitMargin.toFixed(1)}%</span></td></tr>
      </table>
    </div>

    ${report.categoryBreakdown.length > 0 ? `
    <div class="section">
      <div class="section-title">📁 Category Breakdown</div>
      <table>
        <thead><tr><th>Category</th><th class="text-right">Sales</th><th class="text-right">Profit</th><th class="text-right">Margin</th></tr></thead>
        <tbody>${categoryRows}</tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <div>Generated: ${now}</div>
      <div>Warehouse Management System © ${new Date().getFullYear()}</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1024,height=800');
    if (!win) { alert('Please allow popups to generate PDF.'); return; }
    win.document.write(html);
    win.document.close();
  };

  const handleShare = async () => {
    if (!report) return;
    const text = `📊 Profit & Loss Report\n\n` +
      `📅 Period: ${formatDate(startDate)} - ${formatDate(endDate)}\n` +
      `💰 Total Sales: ${formatCurrency(report.revenue.totalSales)}\n` +
      `📈 Net Profit: ${formatCurrency(report.profit.netProfit)}\n` +
      `📊 Profit Margin: ${report.profit.profitMargin.toFixed(1)}%\n` +
      `📦 Total Orders: ${formatNumber(report.revenue.totalOrders)}\n\n` +
      `Generated: ${new Date().toLocaleString()}`;
    
    if (navigator.share) {
      try { await navigator.share({ title: 'Profit & Loss Report', text }); } catch { }
    } else {
      await navigator.clipboard.writeText(text);
      alert('✅ Report copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const totalCosts = report ? report.costs.costOfGoodsSold + report.costs.operatingExpenses + 
                         report.costs.shippingCosts + report.costs.discountGiven + report.costs.taxPaid : 0;

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
            <button onClick={() => router.push('/reports')} className="text-gray-500 hover:text-gray-900">Reports</button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold">Profit & Loss</span>
          </nav>
          <div className="flex items-center gap-2">
            {report && (
              <>
                <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Financial Analytics</p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Report</h1>
              <p className="text-sm text-gray-500 mt-1">Revenue, cost and profit analysis</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Financial Report</span>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Select Period</h2>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPeriod === period
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Generating...</>
              ) : (
                <><BarChart3 className="w-4 h-4" /> Generate Report</>
              )}
            </button>
          </div>
        </div>

        {/* Report Display */}
        {report && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <DollarSign className="w-8 h-8 opacity-80" />
                  <span className="text-2xl font-bold">{formatCompactCurrency(report.revenue.totalSales)}</span>
                </div>
                <p className="text-sm opacity-80 mt-2">Total Sales</p>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                  <span className="text-2xl font-bold">{formatCompactCurrency(report.profit.netProfit)}</span>
                </div>
                <p className="text-sm opacity-80 mt-2">Net Profit</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <Percent className="w-8 h-8 opacity-80" />
                  <span className="text-2xl font-bold">{report.profit.profitMargin.toFixed(1)}%</span>
                </div>
                <p className="text-sm opacity-80 mt-2">Profit Margin</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="w-8 h-8 opacity-80" />
                  <span className="text-2xl font-bold">{formatNumber(report.revenue.totalOrders)}</span>
                </div>
                <p className="text-sm opacity-80 mt-2">Total Orders</p>
              </div>
            </div>

            {/* Period Info */}
            <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Report Period</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </div>

            {/* Revenue Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-gray-900">Revenue Summary</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Total Sales</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(report.revenue.totalSales)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-semibold text-gray-900">{formatNumber(report.revenue.totalOrders)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Items Sold</span>
                  <span className="font-semibold text-gray-900">{formatNumber(report.revenue.totalItemsSold)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Average Order Value</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(report.revenue.averageOrderValue)}</span>
                </div>
              </div>
            </div>

            {/* Costs Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-red-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-gray-900">Costs & Expenses</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Cost of Goods Sold</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(report.costs.costOfGoodsSold)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Operating Expenses</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(report.costs.operatingExpenses)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Shipping Costs</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(report.costs.shippingCosts)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Discounts Given</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(report.costs.discountGiven)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Tax Paid</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(report.costs.taxPaid)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
                  <span className="font-semibold text-gray-900">Total Costs</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalCosts)}</span>
                </div>
              </div>
            </div>

            {/* Profit Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-gray-900">Profit Analysis</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Gross Profit</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(report.profit.grossProfit)}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Gross Margin</span>
                  <span className="font-semibold text-gray-900">{report.profit.grossMargin.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
                  <span className="font-semibold text-gray-900">Net Profit</span>
                  <span className={`font-bold text-lg ${getProfitColor(report.profit.netProfit)}`}>
                    {formatCurrency(report.profit.netProfit)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-gray-600">Net Profit Margin</span>
                  <span className={`font-semibold ${getProfitColor(report.profit.profitMargin)}`}>
                    {report.profit.profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {report.categoryBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-purple-500 rounded-full" />
                    <h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Category</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Sales</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Profit</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.categoryBreakdown.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900">{cat.categoryName}</td>
                          <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(cat.sales)}</td>
                          <td className={`px-6 py-3 text-right text-sm font-medium ${getProfitColor(cat.profit)}`}>
                            {formatCurrency(cat.profit)}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">{cat.profitMargin.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">TOTAL</td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(report.revenue.totalSales)}</td>
                        <td className={`px-6 py-3 text-right text-sm font-bold ${getProfitColor(report.profit.netProfit)}`}>
                          {formatCurrency(report.profit.netProfit)}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{report.profit.profitMargin.toFixed(1)}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!report && !generating && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500">Select a date range and click "Generate Report" to view Profit & Loss analysis</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">System-generated financial report - For queries, contact administrator</p>
          <p className="text-xs text-gray-400">Warehouse Management System © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}