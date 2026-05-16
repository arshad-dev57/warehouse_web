'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Package, DollarSign, AlertTriangle, TrendingUp,
  Share2, Printer, CheckCircle,
  Building2, ArrowLeft, PieChart,
  Layers, Download
} from 'lucide-react';
import ReportsLayout from '../layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface CategorySummary {
  id: string;
  name: string;
  count: number;
  value: number;
  color?: string;
}

interface ReportData {
  totalProducts: number;
  totalStockValue: number;
  averagePrice: number;
  lowStockCount: number;
  outOfStockCount: number;
  categorySummary: CategorySummary[];
}

const CATEGORY_COLORS = [
  '#1e3a5f', '#2563eb', '#0891b2', '#0d9488', '#059669',
  '#ca8a04', '#dc2626', '#7c3aed', '#db2777', '#ea580c'
];

export default function StockSummaryReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    totalProducts: 0,
    totalStockValue: 0,
    averagePrice: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categorySummary: []
  });

  useEffect(() => { loadReportData(); }, []);

  const loadReportData = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const productsRes = await fetch(`${API_URL}/products?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = await productsRes.json();
      const products = productsData.data || [];

      const categoriesRes = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const categoriesData = await categoriesRes.json();
      const categories = categoriesData.data || [];

      let totalStockValue = 0;
      let totalPriceSum = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      products.forEach((product: any) => {
        totalStockValue += (product.sellingPrice || 0) * (product.currentStock || 0);
        totalPriceSum += product.sellingPrice || 0;
        if (product.currentStock === 0) outOfStockCount++;
        else if (product.currentStock <= product.minimumStock) lowStockCount++;
      });

      const categorySummary = categories.map((category: any, idx: number) => {
        const categoryProducts = products.filter((p: any) => p.categoryId === category._id);
        const totalValue = categoryProducts.reduce((sum: number, p: any) =>
          sum + ((p.sellingPrice || 0) * (p.currentStock || 0)), 0);
        return {
          id: category._id,
          name: category.name,
          count: categoryProducts.length,
          value: totalValue,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
        };
      }).filter((c: any) => c.count > 0);

      setReportData({
        totalProducts: products.length,
        totalStockValue,
        averagePrice: products.length > 0 ? totalPriceSum / products.length : 0,
        lowStockCount,
        outOfStockCount,
        categorySummary
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const fmtNum = (value: number) => new Intl.NumberFormat('en-US').format(value);

  const fmtCompact = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  // ─── PDF / Print ─────────────────────────────────────────────────────────────
  // Pure print-window approach — no html2pdf, no html2canvas, no lab() errors.
  const handlePDF = () => {
    const now = new Date().toLocaleString();
    const dateStr = new Date().toISOString().split('T')[0];

    const totalCategoryValue = reportData.totalStockValue || 1;

    const categoryRows = reportData.categorySummary.map((cat, i) => {
      const pct = ((cat.value / totalCategoryValue) * 100).toFixed(1);
      const barWidth = Math.max(4, Math.round((cat.value / totalCategoryValue) * 200));
      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 14px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${cat.color};margin-right:8px;"></span>
            <span style="font-weight:500;color:#111827;">${cat.name}</span>
          </td>
          <td style="padding:10px 14px;text-align:center;color:#374151;">${fmtNum(cat.count)}</td>
          <td style="padding:10px 14px;text-align:right;font-weight:600;color:#111827;">${fmt(cat.value)}</td>
          <td style="padding:10px 14px;text-align:center;">
            <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;">
              <div style="width:${barWidth}px;height:6px;background:${cat.color};border-radius:3px;"></div>
              <span style="font-size:12px;color:#6b7280;min-width:36px;text-align:right;">${pct}%</span>
            </div>
          </td>
        </tr>`;
    }).join('');

    const alertBanner = (reportData.lowStockCount > 0 || reportData.outOfStockCount > 0) ? `
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 18px;margin-bottom:28px;">
        <div style="font-weight:700;color:#92400e;font-size:13px;margin-bottom:6px;">⚠ STOCK ALERTS REQUIRE ATTENTION</div>
        <div style="display:flex;gap:24px;">
          ${reportData.lowStockCount > 0 ? `<span style="font-size:13px;color:#b45309;">● ${fmtNum(reportData.lowStockCount)} products below minimum stock level</span>` : ''}
          ${reportData.outOfStockCount > 0 ? `<span style="font-size:13px;color:#dc2626;">● ${fmtNum(reportData.outOfStockCount)} products completely out of stock</span>` : ''}
        </div>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Stock Summary Report — ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'IBM Plex Sans',sans-serif;background:#f8fafc;color:#111827;padding:0;}
    @media print{
      body{background:white;}
      .no-print{display:none!important;}
      @page{margin:18mm 15mm;size:A4;}
    }
    .page{max-width:860px;margin:0 auto;background:white;padding:48px 52px;}
    /* Header */
    .header{border-bottom:3px solid #111827;padding-bottom:24px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-start;}
    .header-left .company{font-size:11px;font-weight:700;letter-spacing:3px;color:#6b7280;text-transform:uppercase;margin-bottom:6px;}
    .header-left .report-title{font-size:26px;font-weight:700;color:#111827;line-height:1.2;}
    .header-left .report-sub{font-size:13px;color:#6b7280;margin-top:4px;}
    .header-right{text-align:right;}
    .header-right .report-id{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9ca3af;letter-spacing:1px;}
    .header-right .report-date{font-size:12px;color:#6b7280;margin-top:4px;}
    .header-right .badge{display:inline-block;background:#111827;color:white;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:3px;margin-top:8px;}
    /* KPI Grid */
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;}
    .kpi-card{border-radius:8px;padding:18px 16px;color:white;position:relative;overflow:hidden;}
    .kpi-card::after{content:'';position:absolute;right:-12px;top:-12px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.1);}
    .kpi-card.blue{background:linear-gradient(135deg,#1d4ed8,#1e40af);}
    .kpi-card.emerald{background:linear-gradient(135deg,#059669,#047857);}
    .kpi-card.violet{background:linear-gradient(135deg,#7c3aed,#6d28d9);}
    .kpi-card.amber{background:linear-gradient(135deg,#d97706,#b45309);}
    .kpi-label{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;opacity:0.8;margin-bottom:10px;}
    .kpi-value{font-size:22px;font-weight:700;letter-spacing:-0.5px;}
    /* Section */
    .section{margin-bottom:28px;}
    .section-header{display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:8px;border-bottom:1.5px solid #e5e7eb;}
    .section-num{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#9ca3af;font-weight:600;letter-spacing:1px;}
    .section-title{font-size:14px;font-weight:700;color:#111827;letter-spacing:0.3px;text-transform:uppercase;}
    /* Summary table */
    .summary-table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;}
    .summary-table tr{border-bottom:1px solid #f3f4f6;}
    .summary-table tr:last-child{border-bottom:none;}
    .summary-table td{padding:11px 16px;font-size:13px;}
    .summary-table .label{color:#374151;font-weight:500;}
    .summary-table .val{text-align:right;font-weight:700;color:#111827;font-family:'IBM Plex Mono',monospace;font-size:14px;}
    .summary-table .icon-cell{display:flex;align-items:center;gap:10px;}
    .icon-dot{width:8px;height:8px;border-radius:50%;}
    /* Category table */
    .cat-table{width:100%;border-collapse:collapse;}
    .cat-table thead tr{background:#f9fafb;border-bottom:2px solid #e5e7eb;}
    .cat-table th{padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#6b7280;text-align:left;}
    .cat-table th.right{text-align:right;}
    .cat-table th.center{text-align:center;}
    .cat-table tbody tr:nth-child(even){background:#f9fafb;}
    .cat-table tfoot tr{background:#111827;color:white;}
    .cat-table tfoot td{padding:11px 14px;font-size:13px;font-weight:700;}
    .cat-table tfoot td.right{text-align:right;}
    .cat-table tfoot td.center{text-align:center;}
    /* Footer */
    .report-footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;}
    .footer-left{font-size:10px;color:#9ca3af;line-height:1.6;}
    .footer-right{font-size:10px;color:#9ca3af;text-align:right;}
    .confidential{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d1d5db;margin-top:4px;}
    /* Print button */
    .print-bar{display:flex;justify-content:center;gap:12px;padding:16px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;}
    .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'IBM Plex Sans',sans-serif;}
    .btn-primary{background:#111827;color:white;}
    .btn-secondary{background:white;color:#374151;border:1px solid #d1d5db;}
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="btn btn-primary" onclick="window.print()">🖨 Print / Save as PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
  </div>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="company">Warehouse Management System</div>
        <div class="report-title">Stock Summary Report</div>
        <div class="report-sub">Complete Inventory Overview &amp; Analysis</div>
      </div>
      <div class="header-right">
        <div class="report-id">RPT-${Date.now().toString(36).toUpperCase()}</div>
        <div class="report-date">Generated: ${now}</div>
        <div class="badge">Confidential</div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-label">Total Products</div>
        <div class="kpi-value">${fmtNum(reportData.totalProducts)}</div>
      </div>
      <div class="kpi-card emerald">
        <div class="kpi-label">Stock Value</div>
        <div class="kpi-value">${fmtCompact(reportData.totalStockValue)}</div>
      </div>
      <div class="kpi-card violet">
        <div class="kpi-label">Avg. Price</div>
        <div class="kpi-value">${fmtCompact(reportData.averagePrice)}</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">Stock Alerts</div>
        <div class="kpi-value">${fmtNum(reportData.lowStockCount + reportData.outOfStockCount)}</div>
      </div>
    </div>

    ${alertBanner}

    <!-- Section 1: Overall Summary -->
    <div class="section">
      <div class="section-header">
        <span class="section-num">01</span>
        <span class="section-title">Overall Summary</span>
      </div>
      <table class="summary-table">
        <tr><td class="label"><div class="icon-cell"><div class="icon-dot" style="background:#1d4ed8;"></div>Total Products</div></td><td class="val">${fmtNum(reportData.totalProducts)}</td></tr>
        <tr><td class="label"><div class="icon-cell"><div class="icon-dot" style="background:#059669;"></div>Total Stock Value</div></td><td class="val">${fmt(reportData.totalStockValue)}</td></tr>
        <tr><td class="label"><div class="icon-cell"><div class="icon-dot" style="background:#7c3aed;"></div>Average Price per Item</div></td><td class="val">${fmt(reportData.averagePrice)}</td></tr>
        <tr><td class="label"><div class="icon-cell"><div class="icon-dot" style="background:#d97706;"></div>Low Stock Items</div></td><td class="val" style="color:${reportData.lowStockCount > 0 ? '#d97706' : '#111827'};">${fmtNum(reportData.lowStockCount)}</td></tr>
        <tr><td class="label"><div class="icon-cell"><div class="icon-dot" style="background:#dc2626;"></div>Out of Stock Items</div></td><td class="val" style="color:${reportData.outOfStockCount > 0 ? '#dc2626' : '#111827'};">${fmtNum(reportData.outOfStockCount)}</td></tr>
      </table>
    </div>

    <!-- Section 2: Category Breakdown -->
    <div class="section">
      <div class="section-header">
        <span class="section-num">02</span>
        <span class="section-title">Category-wise Breakdown</span>
      </div>
      <table class="cat-table">
        <thead>
          <tr>
            <th>Category</th>
            <th class="center">Products</th>
            <th class="right">Stock Value</th>
            <th class="right">Share</th>
          </tr>
        </thead>
        <tbody>${categoryRows}</tbody>
        <tfoot>
          <tr>
            <td>TOTAL</td>
            <td class="center">${fmtNum(reportData.totalProducts)}</td>
            <td class="right">${fmt(reportData.totalStockValue)}</td>
            <td class="right">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Footer -->
    <div class="report-footer">
      <div class="footer-left">
        This is a system-generated report. For queries, contact your system administrator.<br>
        Warehouse Management System &copy; ${new Date().getFullYear()}
      </div>
      <div class="footer-right">
        Page 1 of 1<br>
        <div class="confidential">Internal Use Only</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=800');
    if (!win) { alert('Please allow popups to generate the PDF.'); return; }
    win.document.write(html);
    win.document.close();
  };

  // Share
  const shareReport = async () => {
    const text = `📊 Stock Summary Report\n\n` +
      `📦 Total Products: ${fmtNum(reportData.totalProducts)}\n` +
      `💰 Total Stock Value: ${fmt(reportData.totalStockValue)}\n` +
      `📈 Average Price: ${fmt(reportData.averagePrice)}\n` +
      `⚠️ Low Stock: ${fmtNum(reportData.lowStockCount)}\n` +
      `❌ Out of Stock: ${fmtNum(reportData.outOfStockCount)}\n\n` +
      `📅 ${new Date().toLocaleString()}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Stock Summary Report', text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert('✅ Report copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-gray-900 animate-spin" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Generating report…</p>
      </div>
    );
  }

  const hasAlerts = reportData.lowStockCount > 0 || reportData.outOfStockCount > 0;
  const totalCatValue = reportData.totalStockValue || 1;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
              <Home className="w-3.5 h-3.5" /><span>Dashboard</span>
            </button>
            <span className="text-gray-300">/</span>
            <button onClick={() => router.push('/reports')} className="text-gray-500 hover:text-gray-900 transition-colors">Reports</button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold">Stock Summary</span>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={shareReport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={handlePDF} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        {/* Page Title */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Warehouse Management System</p>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stock Summary Report</h1>
            <p className="text-sm text-gray-500 mt-1">Generated {new Date().toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Live Data</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: fmtNum(reportData.totalProducts), bg: 'from-blue-700 to-blue-900', icon: Package },
            { label: 'Total Stock Value', value: fmtCompact(reportData.totalStockValue), bg: 'from-emerald-600 to-emerald-800', icon: DollarSign },
            { label: 'Average Price', value: fmtCompact(reportData.averagePrice), bg: 'from-violet-600 to-violet-800', icon: TrendingUp },
            { label: 'Stock Alerts', value: fmtNum(reportData.lowStockCount + reportData.outOfStockCount), bg: 'from-amber-500 to-amber-700', icon: AlertTriangle },
          ].map(({ label, value, bg, icon: Icon }) => (
            <div key={label} className={`bg-gradient-to-br ${bg} rounded-2xl p-5 text-white relative overflow-hidden`}>
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
              <Icon className="w-5 h-5 opacity-70 mb-3" />
              <div className="text-2xl font-bold tracking-tight">{value}</div>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Alert Banner */}
        {hasAlerts && (
          <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 text-sm">Stock Alerts Require Attention</p>
              <div className="flex flex-wrap gap-4 mt-1">
                {reportData.lowStockCount > 0 && (
                  <span className="text-sm text-amber-700">
                    <span className="font-semibold">{fmtNum(reportData.lowStockCount)}</span> products below minimum stock
                  </span>
                )}
                {reportData.outOfStockCount > 0 && (
                  <span className="text-sm text-red-600">
                    <span className="font-semibold">{fmtNum(reportData.outOfStockCount)}</span> products out of stock
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Overall Summary */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 tracking-widest">01</span>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Overall Summary</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: 'Total Products', value: fmtNum(reportData.totalProducts), dot: '#1d4ed8' },
                { label: 'Total Stock Value', value: fmt(reportData.totalStockValue), dot: '#059669' },
                { label: 'Average Price', value: fmt(reportData.averagePrice), dot: '#7c3aed' },
                {
                  label: 'Low Stock Items', value: fmtNum(reportData.lowStockCount), dot: '#d97706',
                  valueClass: reportData.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'
                },
                {
                  label: 'Out of Stock', value: fmtNum(reportData.outOfStockCount), dot: '#dc2626',
                  valueClass: reportData.outOfStockCount > 0 ? 'text-red-600' : 'text-gray-900'
                },
              ].map(({ label, value, dot, valueClass }) => (
                <div key={label} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${valueClass || 'text-gray-900'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 tracking-widest">02</span>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Category Breakdown</h2>
            </div>

            {reportData.categorySummary.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">No category data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.categorySummary.map((cat) => {
                      const pct = ((cat.value / totalCatValue) * 100).toFixed(1);
                      return (
                        <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-sm text-gray-600 tabular-nums">{fmtNum(cat.count)}</span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="text-sm font-bold text-gray-900 tabular-nums">{fmt(cat.value)}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                              </div>
                              <span className="text-xs text-gray-500 tabular-nums w-9 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-900">
                      <td className="px-6 py-3.5 text-sm font-bold text-white">TOTAL</td>
                      <td className="px-4 py-3.5 text-center text-sm font-bold text-white tabular-nums">{fmtNum(reportData.totalProducts)}</td>
                      <td className="px-6 py-3.5 text-right text-sm font-bold text-white tabular-nums">{fmt(reportData.totalStockValue)}</td>
                      <td className="px-6 py-3.5 text-right text-sm font-bold text-white">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            System-generated report &mdash; For queries, contact your administrator
          </p>
          <p className="text-xs text-gray-400 font-medium">
            Warehouse Management System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
    