'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Package, AlertTriangle, TrendingUp, TrendingDown,
  Share2, Printer, Download, Eye, ShoppingCart,
  Layers, ChevronRight, Truck, Clock, CheckCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  sellingPrice: number;
  categoryName?: string;
  imageUrls?: string[];
}

interface ReportData {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  lowStockProducts: LowStockProduct[];
  outOfStockProducts: LowStockProduct[];
}

export default function LowStockReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
    lowStockProducts: [],
    outOfStockProducts: []
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const productsRes = await fetch(`${API_URL}/products?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = await productsRes.json();
      const products = productsData.data || [];

      let lowStockCount = 0;
      let outOfStockCount = 0;
      let totalValue = 0;
      const lowStockProducts: LowStockProduct[] = [];
      const outOfStockProducts: LowStockProduct[] = [];

      products.forEach((product: any) => {
        if (product.currentStock === 0) {
          outOfStockCount++;
          outOfStockProducts.push(product);
        } else if (product.currentStock <= product.minimumStock) {
          lowStockCount++;
          lowStockProducts.push(product);
        }
        totalValue += (product.sellingPrice || 0) * (product.currentStock || 0);
      });

      setReportData({
        totalProducts: products.length,
        lowStockCount,
        outOfStockCount,
        totalValue,
        lowStockProducts: lowStockProducts.sort((a, b) => 
          (a.currentStock / a.minimumStock) - (b.currentStock / b.minimumStock)
        ),
        outOfStockProducts
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const getStockPercentage = (current: number, minimum: number) => {
    return Math.min(100, Math.round((current / minimum) * 100));
  };

  const getStatusColor = (current: number, minimum: number) => {
    if (current === 0) return 'text-red-600 bg-red-50';
    if (current < minimum / 2) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getRequiredQuantity = (current: number, minimum: number) => {
    return minimum - current;
  };

  const handleReorder = (productId: string) => {
    router.push(`/stock/in?productId=${productId}`);
  };

  const handleBulkReorder = () => {
    router.push('/stock/in');
  };

  const handlePDF = () => {
    const now = new Date().toLocaleString();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const lowStockRows = reportData.lowStockProducts.map(product => {
      const needed = getRequiredQuantity(product.currentStock, product.minimumStock);
      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 14px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;background:#fef3c7;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <span style="font-weight:700;color:#d97706;">${product.currentStock}</span>
              </div>
              <div>
                <div style="font-weight:600;color:#111827;">${product.name}</div>
                <div style="font-size:12px;color:#6b7280;">SKU: ${product.sku}</div>
              </div>
            </div>
           </td>
          <td style="padding:12px 14px;text-align:center;color:#374151;">${product.minimumStock}</td>
          <td style="padding:12px 14px;text-align:center;">
            <div style="display:inline-block;padding:4px 8px;background:#fee2e2;color:#dc2626;border-radius:6px;font-size:12px;font-weight:600;">
              Need ${needed}
            </div>
          </td>
          <td style="padding:12px 14px;text-align:right;font-weight:600;color:#d97706;">${formatCurrency(product.sellingPrice)}</td>
        </tr>`;
    }).join('');

    const outOfStockRows = reportData.outOfStockProducts.map(product => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px 14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;background:#fee2e2;border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <span style="font-weight:700;color:#dc2626;">0</span>
            </div>
            <div>
              <div style="font-weight:600;color:#111827;">${product.name}</div>
              <div style="font-size:12px;color:#6b7280;">SKU: ${product.sku}</div>
            </div>
          </div>
        </td>
        <td style="padding:12px 14px;text-align:center;color:#374151;">${product.minimumStock}</td>
        <td style="padding:12px 14px;text-align:center;">
          <div style="display:inline-block;padding:4px 8px;background:#dc2626;color:white;border-radius:6px;font-size:12px;font-weight:600;">
            Out of Stock
          </div>
        </td>
        <td style="padding:12px 14px;text-align:right;font-weight:600;color:#dc2626;">${formatCurrency(product.sellingPrice)}</td>
       </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Low Stock Report — ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'IBM Plex Sans',sans-serif;background:#f8fafc;padding:0;}
    @media print{
      body{background:white;}
      @page{margin:18mm 15mm;size:A4;}
    }
    .page{max-width:860px;margin:0 auto;background:white;padding:48px 52px;}
    .header{border-bottom:3px solid #111827;padding-bottom:24px;margin-bottom:32px;display:flex;justify-content:space-between;}
    .company{font-size:11px;font-weight:700;letter-spacing:3px;color:#6b7280;text-transform:uppercase;margin-bottom:6px;}
    .report-title{font-size:26px;font-weight:700;color:#111827;}
    .report-sub{font-size:13px;color:#6b7280;margin-top:4px;}
    .badge{display:inline-block;background:#dc2626;color:white;font-size:10px;font-weight:600;padding:4px 10px;border-radius:3px;}
    .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;}
    .kpi-card{border-radius:8px;padding:18px 16px;color:white;position:relative;overflow:hidden;}
    .kpi-card.red{background:linear-gradient(135deg,#dc2626,#b91c1c);}
    .kpi-card.orange{background:linear-gradient(135deg,#ea580c,#c2410c);}
    .kpi-card.emerald{background:linear-gradient(135deg,#059669,#047857);}
    .kpi-label{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;opacity:0.8;margin-bottom:10px;}
    .kpi-value{font-size:22px;font-weight:700;}
    .section{margin-bottom:28px;}
    .section-header{display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:8px;border-bottom:1.5px solid #e5e7eb;}
    .section-num{font-family:monospace;font-size:10px;color:#9ca3af;font-weight:600;}
    .section-title{font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;}
    table{width:100%;border-collapse:collapse;}
    thead tr{background:#f9fafb;border-bottom:2px solid #e5e7eb;}
    th{padding:12px 14px;font-size:11px;font-weight:700;color:#6b7280;text-align:left;}
    th.right{text-align:right;}
    th.center{text-align:center;}
    tfoot tr{background:#111827;color:white;}
    tfoot td{padding:12px 14px;font-size:13px;font-weight:700;}
    .report-footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;}
    .footer-text{font-size:10px;color:#9ca3af;}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="company">Warehouse Management System</div>
        <div class="report-title">Low Stock Report</div>
        <div class="report-sub">Products requiring immediate attention</div>
      </div>
      <div>
        <div class="badge">URGENT</div>
        <div style="font-size:11px;color:#6b7280;margin-top:8px;">${now}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card red">
        <div class="kpi-label">Out of Stock</div>
        <div class="kpi-value">${reportData.outOfStockCount}</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Low Stock</div>
        <div class="kpi-value">${reportData.lowStockCount}</div>
      </div>
      <div class="kpi-card emerald">
        <div class="kpi-label">At Risk Value</div>
        <div class="kpi-value">${formatCurrency(reportData.totalValue)}</div>
      </div>
    </div>

    ${reportData.outOfStockProducts.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-num">01</span>
        <span class="section-title">Out of Stock Items (Critical)</span>
      </div>
      <table>
        <thead><tr><th>Product</th><th class="center">Min Stock</th><th class="center">Status</th><th class="right">Price</th></tr></thead>
        <tbody>${outOfStockRows}</tbody>
      </table>
    </div>
    ` : ''}

    ${reportData.lowStockProducts.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-num">02</span>
        <span class="section-title">Low Stock Items</span>
      </div>
      <table>
        <thead><tr><th>Product</th><th class="center">Min Stock</th><th class="center">Required</th><th class="right">Price</th></tr></thead>
        <tbody>${lowStockRows}</tbody>
        <tfoot><tr><td colspan="3">Total Items Needing Reorder</td><td class="right">${reportData.lowStockProducts.length}</td></tr></tfoot>
      </table>
    </div>
    ` : ''}

    <div class="report-footer">
      <div class="footer-text">System-generated report. Contact administrator for queries.</div>
      <div class="footer-text">Warehouse Management System © ${new Date().getFullYear()}</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=800');
    if (!win) { alert('Please allow popups to generate the PDF.'); return; }
    win.document.write(html);
    win.document.close();
  };

  const shareReport = async () => {
    const text = `📊 Low Stock Report\n\n` +
      `⚠️ Out of Stock: ${reportData.outOfStockCount}\n` +
      `🟠 Low Stock: ${reportData.lowStockCount}\n` +
      `💰 At Risk Value: ${formatCurrency(reportData.totalValue)}\n\n` +
      `📅 ${new Date().toLocaleString()}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Low Stock Report', text }); } catch { }
    } else {
      await navigator.clipboard.writeText(text);
      alert('✅ Report copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-orange-600 animate-spin" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading report data...</p>
      </div>
    );
  }

  const totalCritical = reportData.lowStockCount + reportData.outOfStockCount;

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
            <span className="text-gray-900 font-semibold">Low Stock</span>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={shareReport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={handlePDF} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Warehouse Management System</p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Low Stock Report</h1>
              <p className="text-sm text-gray-500 mt-1">Products requiring immediate attention</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-semibold text-red-700">URGENT</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{formatNumber(reportData.outOfStockCount)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Out of Stock</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <TrendingDown className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{formatNumber(reportData.lowStockCount)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Low Stock Items</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <Package className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{formatCurrency(reportData.totalValue)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">At Risk Inventory Value</p>
          </div>
        </div>

        {/* Critical Alert Banner */}
        {totalCritical > 0 && (
          <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-900 text-sm">Critical Stock Alert</p>
              <p className="text-sm text-red-700 mt-0.5">
                {reportData.outOfStockCount > 0 && `${formatNumber(reportData.outOfStockCount)} products out of stock. `}
                {reportData.lowStockCount > 0 && `${formatNumber(reportData.lowStockCount)} products below minimum level. `}
                Immediate action required to prevent stockouts.
              </p>
            </div>
          </div>
        )}

        {/* Out of Stock Section */}
        {reportData.outOfStockProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-red-500 rounded-full" />
                <h2 className="text-lg font-semibold text-gray-900">Out of Stock Items</h2>
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  {formatNumber(reportData.outOfStockProducts.length)}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Min Stock</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.outOfStockProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-red-50/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-red-600">0</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4 text-center text-gray-600">{product.minimumStock}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Out of Stock
                        </span>
                       </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(product.sellingPrice)}
                       </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleReorder(product._id)}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                        >
                          Reorder Now
                        </button>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Low Stock Section */}
        {reportData.lowStockProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-white border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-orange-500 rounded-full" />
                <h2 className="text-lg font-semibold text-gray-900">Low Stock Items</h2>
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {formatNumber(reportData.lowStockProducts.length)}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Current</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Min Stock</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Required</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.lowStockProducts.map((product) => {
                    const needed = getRequiredQuantity(product.currentStock, product.minimumStock);
                    const percentage = getStockPercentage(product.currentStock, product.minimumStock);
                    const statusColor = getStatusColor(product.currentStock, product.minimumStock);
                    return (
                      <tr key={product._id} className="hover:bg-orange-50/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${statusColor} rounded-lg flex items-center justify-center`}>
                              <span className="text-sm font-bold text-orange-700">{product.currentStock}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            </div>
                          </div>
                         </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-semibold text-gray-900">{product.currentStock}</span>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                         </td>
                        <td className="px-6 py-4 text-center text-gray-600">{product.minimumStock}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                            <Truck className="w-3 h-3" /> Need {needed}
                          </span>
                         </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(product.sellingPrice)}
                         </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleReorder(product._id)}
                            className="px-3 py-1.5 border border-orange-300 text-orange-600 text-sm rounded-lg hover:bg-orange-50 transition"
                          >
                            Reorder
                          </button>
                         </td>
                       </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={5} className="px-6 py-3 text-sm font-semibold text-gray-900">
                      Total Items Needing Reorder
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={handleBulkReorder}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 ml-auto"
                      >
                        <ShoppingCart className="w-4 h-4" /> Bulk Reorder
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalCritical === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stock Issues</h3>
            <p className="text-gray-500">All products are above minimum stock levels. Great job!</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">System-generated report - For queries, contact administrator</p>
          <p className="text-xs text-gray-400">Warehouse Management System © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}