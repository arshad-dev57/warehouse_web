'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Download, Share2, Printer, Calendar, Users,
  Receipt, TrendingUp, DollarSign, ChevronLeft,
  ChevronRight, Search, Filter, X, ArrowLeft
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface SalesData {
  name: string;
  invoiceCount: number;
  sales: number;
  salesWithTax: number;
}

interface SummaryData {
  totalOrders: number;
  totalCustomers: number;
  totalSales: number;
  totalSalesWithTax: number;
}

export default function SalesReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalOrders: 0,
    totalCustomers: 0,
    totalSales: 0,
    totalSalesWithTax: 0
  });
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSalesData();
  }, [startDate, endDate]);

  const loadSalesData = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/reports/sales-by-customer?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setSalesData(data.data || []);
        setSummary(data.summary || {
          totalOrders: 0,
          totalCustomers: 0,
          totalSales: 0,
          totalSalesWithTax: 0
        });
      }
    } catch (err) {
      console.error(err);
      // Demo data for preview
      setSalesData([
        { name: 'ABC Corporation', invoiceCount: 5, sales: 15000, salesWithTax: 16500 },
        { name: 'XYZ Enterprises', invoiceCount: 3, sales: 8500, salesWithTax: 9350 },
        { name: 'PQR Industries', invoiceCount: 4, sales: 12000, salesWithTax: 13200 },
        { name: 'LMN Traders', invoiceCount: 2, sales: 5500, salesWithTax: 6050 },
        { name: 'RST Solutions', invoiceCount: 6, sales: 22000, salesWithTax: 24200 },
        { name: 'UVW Group', invoiceCount: 3, sales: 9500, salesWithTax: 10450 },
      ]);
      setSummary({
        totalOrders: 23,
        totalCustomers: 6,
        totalSales: 72500,
        totalSalesWithTax: 79750
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
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

  const filteredData = salesData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportPDF = () => {
    const now = new Date().toLocaleString();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const tableRows = filteredData.map(item => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px;">${item.name}</td>
        <td style="padding:12px;text-align:center;">${item.invoiceCount}</td>
        <td style="padding:12px;text-align:right;">${formatCurrency(item.sales)}</td>
        <td style="padding:12px;text-align:right;color:#059669;font-weight:600;">${formatCurrency(item.salesWithTax)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales by Customer Report - ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Inter',sans-serif;background:white;padding:40px;}
    @media print{body{padding:20px;}}
    .header{background:#1a2a3a;color:white;padding:30px;margin-bottom:30px;border-radius:12px;}
    .title{font-size:24px;font-weight:700;margin-bottom:8px;}
    .subtitle{font-size:13px;opacity:0.8;}
    .date-range{background:#f0f0f0;padding:12px;border-radius:8px;margin-bottom:25px;display:inline-block;}
    .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px;}
    .kpi-card{background:#f8fafc;border-radius:12px;padding:20px;text-align:center;}
    .kpi-value{font-size:28px;font-weight:700;color:#1a2a3a;margin-top:8px;}
    table{width:100%;border-collapse:collapse;margin-top:20px;}
    th{background:#f8fafc;padding:12px;text-align:left;font-size:12px;font-weight:600;color:#475569;border-bottom:2px solid #e5e7eb;}
    td{padding:12px;border-bottom:1px solid #f0f0f0;}
    .total-row{background:#f8fafc;font-weight:700;border-top:2px solid #e5e7eb;}
    .footer{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af;}
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Sales by Customer</div>
    <div class="subtitle">Marketing Business Bureau</div>
  </div>

  <div class="date-range">
    📅 ${formatDate(startDate)} - ${formatDate(endDate)}
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div>📊 Total Orders</div><div class="kpi-value">${formatNumber(summary.totalOrders)}</div></div>
    <div class="kpi-card"><div>👥 Total Customers</div><div class="kpi-value">${formatNumber(summary.totalCustomers)}</div></div>
    <div class="kpi-card"><div>💰 Total Sales</div><div class="kpi-value">${formatCurrency(summary.totalSales)}</div></div>
  </div>

  <table>
    <thead><tr><th>Customer Name</th><th style="text-align:center;">Invoices</th><th style="text-align:right;">Sales</th><th style="text-align:right;">Sales With Tax</th></tr></thead>
    <tbody>${tableRows}</tbody>
    <tfoot><tr class="total-row"><td><strong>TOTAL</strong></td><td style="text-align:center;"><strong>${formatNumber(summary.totalOrders)}</strong></td><td style="text-align:right;"><strong>${formatCurrency(summary.totalSales)}</strong></td><td style="text-align:right;"><strong>${formatCurrency(summary.totalSalesWithTax)}</strong></td></tr></tfoot>
  </table>

  <div class="footer">
    <div>Generated: ${now}</div>
    <div>Warehouse Management System</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1024,height=800');
    if (!win) { alert('Please allow popups to generate PDF.'); return; }
    win.document.write(html);
    win.document.close();
  };

  const handleShare = async () => {
    const text = `📊 Sales by Customer Report\n\n` +
      `📅 Period: ${formatDate(startDate)} - ${formatDate(endDate)}\n` +
      `📦 Total Orders: ${formatNumber(summary.totalOrders)}\n` +
      `👥 Total Customers: ${formatNumber(summary.totalCustomers)}\n` +
      `💰 Total Sales: ${formatCurrency(summary.totalSales)}\n` +
      `💵 Total Sales With Tax: ${formatCurrency(summary.totalSalesWithTax)}\n\n` +
      `📅 Generated: ${new Date().toLocaleString()}`;
    
    if (navigator.share) {
      try { await navigator.share({ title: 'Sales Report', text }); } catch { }
    } else {
      await navigator.clipboard.writeText(text);
      alert('✅ Report copied to clipboard!');
    }
  };

  const handlePrint = () => { window.print(); };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading sales data...</p>
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
            <button onClick={() => router.push('/reports')} className="text-gray-500 hover:text-gray-900">Reports</button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold">Sales by Customer</span>
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
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
          <p className="text-xs font-medium tracking-wider opacity-70 mb-2">Marketing Business Bureau</p>
          <h1 className="text-2xl md:text-3xl font-bold">Sales by Customer</h1>
          <div className="mt-4 flex items-center gap-2">
            <div className="bg-white/20 rounded-lg px-4 py-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDate(startDate)} - {formatDate(endDate)}</span>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <button
              onClick={loadSalesData}
              className="mt-5 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{formatNumber(summary.totalOrders)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Total Customers</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{formatNumber(summary.totalCustomers)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Total Sales</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(summary.totalSales)}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer Name</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Invoices</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Sales</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Sales With Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No sales data found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{formatNumber(item.invoiceCount)}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(item.sales)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">{formatCurrency(item.salesWithTax)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">TOTAL</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-900">{formatNumber(summary.totalOrders)}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(summary.totalSales)}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(summary.totalSalesWithTax)}</td>
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