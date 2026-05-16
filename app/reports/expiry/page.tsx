'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Package, Calendar, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Share2, Printer, Download,
  Clock, XCircle, Eye, Layers, Truck
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface ExpiryProduct {
  _id: string;
  name: string;
  sku: string;
  currentStock: number;
  sellingPrice: number;
  expiryDate: string;
  categoryName?: string;
  imageUrls?: string[];
}

interface ReportData {
  expiringSoon: ExpiryProduct[];
  expired: ExpiryProduct[];
  allWithExpiry: ExpiryProduct[];
  stats: {
    total: number;
    expiringCount: number;
    expiredCount: number;
    healthyCount: number;
  };
}

export default function ExpiryReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expiring' | 'expired' | 'all'>('expiring');
  const [reportData, setReportData] = useState<ReportData>({
    expiringSoon: [],
    expired: [],
    allWithExpiry: [],
    stats: {
      total: 0,
      expiringCount: 0,
      expiredCount: 0,
      healthyCount: 0
    }
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
      
      const today = new Date();
      const expiringSoon: ExpiryProduct[] = [];
      const expired: ExpiryProduct[] = [];
      const allWithExpiry: ExpiryProduct[] = [];
      let healthyCount = 0;

      products.forEach((product: any) => {
        if (product.expiryDate) {
          const expiryDate = new Date(product.expiryDate);
          const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          allWithExpiry.push(product);
          
          if (daysLeft < 0) {
            expired.push(product);
          } else if (daysLeft <= 30) {
            expiringSoon.push(product);
          } else {
            healthyCount++;
          }
        }
      });

      // Sort expiring soon by days left (ascending)
      expiringSoon.sort((a, b) => {
        const daysA = Math.ceil((new Date(a.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const daysB = Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysA - daysB;
      });

      // Sort expired by date (oldest first)
      expired.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      setReportData({
        expiringSoon,
        expired,
        allWithExpiry: allWithExpiry.sort((a, b) => 
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        ),
        stats: {
          total: allWithExpiry.length,
          expiringCount: expiringSoon.length,
          expiredCount: expired.length,
          healthyCount
        }
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

  const getDaysLeft = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (daysLeft: number) => {
    if (daysLeft < 0) return { bg: 'bg-red-100', text: 'text-red-700', badge: 'Expired' };
    if (daysLeft <= 7) return { bg: 'bg-red-100', text: 'text-red-700', badge: 'Critical' };
    if (daysLeft <= 15) return { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'Urgent' };
    if (daysLeft <= 30) return { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'Expiring Soon' };
    return { bg: 'bg-green-100', text: 'text-green-700', badge: 'Good' };
  };

  const handleExportPDF = () => {
    const now = new Date().toLocaleString();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const getExpiryRows = (products: ExpiryProduct[], title: string) => {
      if (products.length === 0) return '';
      return `
        <div style="margin-bottom:30px;">
          <div style="background:#f8fafc;padding:12px 16px;border-bottom:2px solid #e5e7eb;">
            <h3 style="font-size:14px;font-weight:700;color:#1a1a2e;">${title}</h3>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:12px;text-align:left;font-size:11px;font-weight:700;">Product</th>
                <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;">Stock</th>
                <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;">Expiry Date</th>
                <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;">Days Left</th>
                <th style="padding:12px;text-align:right;font-size:11px;font-weight:700;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(product => {
                const daysLeft = getDaysLeft(product.expiryDate);
                const status = getStatusColor(daysLeft);
                return `
                  <tr style="border-bottom:1px solid #e5e7eb;">
                    <td style="padding:12px;">
                      <div style="font-weight:500;">${product.name}</div>
                      <div style="font-size:11px;color:#6b7280;">SKU: ${product.sku}</div>
                    </td>
                    <td style="padding:12px;text-align:center;">${product.currentStock}</td>
                    <td style="padding:12px;text-align:center;">${new Date(product.expiryDate).toLocaleDateString()}</td>
                    <td style="padding:12px;text-align:center;">
                      <span style="display:inline-block;padding:4px 8px;background:${status.bg};color:${status.text};border-radius:4px;font-size:11px;font-weight:600;">
                        ${daysLeft < 0 ? 'Expired' : `${daysLeft} days`}
                      </span>
                    </td>
                    <td style="padding:12px;text-align:right;font-weight:600;">${formatCurrency(product.sellingPrice * product.currentStock)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Expiry Report — ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'IBM Plex Sans',sans-serif;background:#f8fafc;padding:0;}
    @media print{body{background:white;}@page{margin:18mm 15mm;}}
    .page{max-width:1000px;margin:0 auto;background:white;padding:48px 52px;}
    .header{border-bottom:3px solid #111827;padding-bottom:24px;margin-bottom:32px;display:flex;justify-content:space-between;}
    .company{font-size:11px;font-weight:700;letter-spacing:3px;color:#6b7280;margin-bottom:6px;}
    .report-title{font-size:26px;font-weight:700;color:#111827;}
    .report-sub{font-size:13px;color:#6b7280;margin-top:4px;}
    .badge{display:inline-block;background:#dc2626;color:white;font-size:10px;font-weight:600;padding:4px 10px;border-radius:3px;}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;}
    .kpi-card{border-radius:8px;padding:18px 16px;color:white;}
    .kpi-card.red{background:linear-gradient(135deg,#dc2626,#b91c1c);}
    .kpi-card.orange{background:linear-gradient(135deg,#ea580c,#c2410c);}
    .kpi-card.yellow{background:linear-gradient(135deg,#d97706,#b45309);}
    .kpi-card.green{background:linear-gradient(135deg,#059669,#047857);}
    .kpi-label{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;opacity:0.8;margin-bottom:10px;}
    .kpi-value{font-size:24px;font-weight:700;}
    .section-title{font-size:16px;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;}
    .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;}
    .footer-text{font-size:10px;color:#9ca3af;}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="company">Warehouse Management System</div>
        <div class="report-title">Product Expiry Report</div>
        <div class="report-sub">Products nearing expiration date</div>
      </div>
      <div>
        <div class="badge">EXPIRY TRACKING</div>
        <div style="font-size:11px;color:#6b7280;margin-top:8px;">${now}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card red">
        <div class="kpi-label">Expired</div>
        <div class="kpi-value">${reportData.stats.expiredCount}</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Expiring Soon</div>
        <div class="kpi-value">${reportData.stats.expiringCount}</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-label">With Expiry</div>
        <div class="kpi-value">${reportData.stats.total}</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Healthy</div>
        <div class="kpi-value">${reportData.stats.healthyCount}</div>
      </div>
    </div>

    ${reportData.expired.length > 0 ? getExpiryRows(reportData.expired, '📅 Expired Products') : ''}
    ${reportData.expiringSoon.length > 0 ? getExpiryRows(reportData.expiringSoon, '⚠️ Expiring Soon (< 30 days)') : ''}
    ${reportData.allWithExpiry.length > 0 ? getExpiryRows(reportData.allWithExpiry.slice(0, 20), '📋 All Products with Expiry Dates') : ''}

    <div class="footer">
      <div class="footer-text">System-generated report - For queries, contact administrator</div>
      <div class="footer-text">Warehouse Management System © ${new Date().getFullYear()}</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1024,height=800');
    if (!win) { alert('Please allow popups to generate the PDF.'); return; }
    win.document.write(html);
    win.document.close();
  };

  const shareReport = async () => {
    const text = `📅 Expiry Report\n\n` +
      `✅ Expired: ${reportData.stats.expiredCount}\n` +
      `⚠️ Expiring Soon: ${reportData.stats.expiringCount}\n` +
      `📦 With Expiry Dates: ${reportData.stats.total}\n` +
      `💚 Healthy Products: ${reportData.stats.healthyCount}\n\n` +
      `📅 ${new Date().toLocaleString()}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Expiry Report', text }); } catch { }
    } else {
      await navigator.clipboard.writeText(text);
      alert('✅ Report copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getExpiryCard = (product: ExpiryProduct) => {
    const daysLeft = getDaysLeft(product.expiryDate);
    const status = getStatusColor(daysLeft);
    const isExpired = daysLeft < 0;
    const isExpiring = daysLeft <= 30 && daysLeft >= 0;
    
    return (
      <div key={product._id} className={`bg-white rounded-xl border p-4 hover:shadow-md transition ${
        isExpired ? 'border-red-200' : isExpiring ? 'border-orange-200' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          {/* Days Left Badge */}
          <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${status.bg}`}>
            <span className={`text-xl font-bold ${status.text}`}>
              {isExpired ? '0' : daysLeft}
            </span>
            <span className={`text-xs ${status.text}`}>
              {isExpired ? 'Expired' : 'days'}
            </span>
          </div>
          
          {/* Product Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">SKU: {product.sku}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text}`}>
                {status.badge}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-600">Stock: {product.currentStock}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date(product.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Value */}
          <div className="text-right">
            <p className="text-sm text-gray-500">Value at risk</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(product.sellingPrice * product.currentStock)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-orange-600 animate-spin" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading expiry data...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'expiring', label: 'Expiring Soon', count: reportData.stats.expiringCount, icon: Clock, color: 'orange' },
    { id: 'expired', label: 'Expired', count: reportData.stats.expiredCount, icon: XCircle, color: 'red' },
    { id: 'all', label: 'All Products', count: reportData.stats.total, icon: Package, color: 'blue' }
  ];

  const getCurrentProducts = () => {
    switch (activeTab) {
      case 'expiring': return reportData.expiringSoon;
      case 'expired': return reportData.expired;
      default: return reportData.allWithExpiry;
    }
  };

  const currentProducts = getCurrentProducts();

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
            <span className="text-gray-900 font-semibold">Expiry Report</span>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={shareReport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
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
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Warehouse Management System</p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Expiry Report</h1>
              <p className="text-sm text-gray-500 mt-1">Track products nearing expiration date</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs font-semibold text-orange-700">Expiry Tracking</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <XCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{formatNumber(reportData.stats.expiredCount)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Expired Products</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{formatNumber(reportData.stats.expiringCount)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Expiring Soon</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <Package className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{formatNumber(reportData.stats.total)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">With Expiry Dates</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{formatNumber(reportData.stats.healthyCount)}</span>
            </div>
            <p className="text-sm opacity-80 mt-2">Healthy Products</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {formatNumber(tab.count)}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {currentProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500">
                {activeTab === 'expiring' && 'No products expiring in the next 30 days.'}
                {activeTab === 'expired' && 'No expired products found.'}
                {activeTab === 'all' && 'No products with expiry dates found.'}
              </p>
            </div>
          ) : (
            currentProducts.map(product => getExpiryCard(product))
          )}
        </div>

        {/* Summary Footer */}
        {currentProducts.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Total Value at Risk</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(currentProducts.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Total Items</p>
                <p className="text-2xl font-bold">{formatNumber(currentProducts.length)}</p>
              </div>
            </div>
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