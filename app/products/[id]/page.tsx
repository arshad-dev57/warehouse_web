'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Package, ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown,
  MapPin, Calendar, DollarSign, Box, AlertTriangle, CheckCircle,
  Printer, Plus, Minus, Home, X, ChevronLeft, ChevronRight,
  Eye, Truck, FileText
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

// Get user role from localStorage
const getUserRole = () => {
  if (typeof window === 'undefined') return 'staff';
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

// Stock Badge Component
function StockBadge({ current, minimum }: { current: number; minimum: number }) {
  if (current === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
        Out of Stock
      </span>
    );
  }
  if (current < minimum) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
        <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
      <CheckCircle className="w-3.5 h-3.5" /> In Stock
    </span>
  );
}

// Image Gallery Component
function ImageGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
        <Package className="w-16 h-16 text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div className="relative h-64 bg-gray-100 rounded-xl overflow-hidden">
        <img
          src={images[currentIndex]}
          alt="Product"
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setShowLightbox(true)}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex(i => Math.min(images.length - 1, i + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button onClick={() => setShowLightbox(false)} className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-lg">
            <X className="w-6 h-6" />
          </button>
          <img src={images[currentIndex]} alt="Product" className="max-w-full max-h-full object-contain p-4" />
        </div>
      )}
    </>
  );
}

// Stock In Modal
function StockInModal({ product, onClose, onSuccess }: { product: any; onClose: () => void; onSuccess: () => void }) {
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setSuppliers(data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    if (!quantity || parseInt(quantity) <= 0) {
      alert('Please enter valid quantity');
      return;
    }

    setSubmitting(true);
    const token = getToken();

    const body: any = {
      productId: product._id,
      quantity: parseInt(quantity),
      reason: 'purchase',
      date: new Date().toISOString().split('T')[0]
    };
    if (supplierId) body.supplierId = supplierId;
    if (reference) body.reference = reference;
    if (notes) body.notes = notes;

    try {
      const response = await fetch(`${API_URL}/stock/in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Added ${quantity} units successfully!`);
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Failed to add stock');
      }
    } catch (err) {
      alert('Error adding stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Add Stock</h3>
              <p className="text-sm text-gray-500">Increase product inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500 mt-1">SKU: {product.sku} | Current Stock: {product.currentStock}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter quantity"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier (Optional)</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference / PO Number</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              placeholder="e.g., PO-2025-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              placeholder="Additional notes..."
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Processing...</>
            ) : (
              'Add Stock'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Stock Out Modal
function StockOutModal({ product, onClose, onSuccess }: { product: any; onClose: () => void; onSuccess: () => void }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('sale');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: 'sale', label: 'Sale' },
    { value: 'damage', label: 'Damaged Goods' },
    { value: 'expired', label: 'Expired Products' },
    { value: 'return_to_supplier', label: 'Return to Supplier' },
    { value: 'transfer', label: 'Transfer to Other Warehouse' },
    { value: 'adjustment', label: 'Stock Adjustment' },
  ];

  const handleSubmit = async () => {
    if (!quantity || parseInt(quantity) <= 0) {
      alert('Please enter valid quantity');
      return;
    }
    if (parseInt(quantity) > product.currentStock) {
      alert(`Insufficient stock! Available: ${product.currentStock}`);
      return;
    }

    setSubmitting(true);
    const token = getToken();

    const body: any = {
      productId: product._id,
      quantity: parseInt(quantity),
      reason: reason,
      date: new Date().toISOString().split('T')[0]
    };
    if (reference) body.reference = reference;
    if (notes) body.notes = notes;

    try {
      const response = await fetch(`${API_URL}/stock/out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Removed ${quantity} units successfully!`);
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Failed to remove stock');
      }
    } catch (err) {
      alert('Error removing stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Minus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Remove Stock</h3>
              <p className="text-sm text-gray-500">Decrease product inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500 mt-1">SKU: {product.sku} | Current Stock: {product.currentStock}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={product.currentStock}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter quantity"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">Maximum available: {product.currentStock} units</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason <span className="text-red-500">*</span></label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference / Order Number</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              placeholder="e.g., ORDER-2025-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              placeholder="Additional notes..."
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Processing...</>
            ) : (
              'Remove Stock'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteModal({ product, onConfirm, onClose, loading }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Delete Product</h3>
          <p className="text-gray-500 mb-6">
            Are you sure you want to delete <span className="font-medium">{product?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Product Details Page
export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userRole, setUserRole] = useState<string>('staff');

  // Permission flags
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';
  
  // Permissions for actions
  const canEdit = isAdmin || isManager;  // Manager can edit
  const canDelete = isAdmin;              // Only Admin can delete
  const canStockIn = isAdmin || isManager;  // Manager can do stock in
  const canStockOut = isAdmin || isManager; // Manager can do stock out
  const canView = true; // Everyone can view

  useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
    if (productId) {
      loadProduct();
      loadStockHistory();
    }
  }, [productId]);

  const loadProduct = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.message || 'Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadStockHistory = async () => {
    setHistoryLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/stock/history/${productId}?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStockHistory(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRefresh = () => {
    loadProduct();
    loadStockHistory();
  };

  const handleDelete = async () => {
    if (!canDelete) {
      alert('You do not have permission to delete products');
      return;
    }
    setDeleting(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        router.push('/products');
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting product');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getProfit = () => {
    if (!product) return { amount: 0, margin: 0, color: 'text-gray-600' };
    const profit = product.sellingPrice - product.costPrice;
    const margin = product.costPrice > 0 ? (profit / product.costPrice) * 100 : 0;
    let color = 'text-gray-600';
    if (profit > 0) color = 'text-green-600';
    if (profit < 0) color = 'text-red-600';
    return { amount: profit, margin, color };
  };

  const getExpiryStatus = () => {
    if (!product?.expiryDate) return { text: 'No expiry date', color: 'text-gray-500' };
    const expiry = new Date(product.expiryDate);
    const today = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { text: 'Expired', color: 'text-red-600' };
    if (daysLeft <= 30) return { text: `Expires in ${daysLeft} days`, color: 'text-orange-600' };
    return { text: expiry.toLocaleDateString(), color: 'text-gray-600' };
  };

  const printBarcode = () => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head>
          <title>Barcode - ${product?.name}</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: monospace;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            .barcode svg {
              width: 300px;
              height: 80px;
            }
            .product-name {
              font-size: 16px;
              margin-top: 20px;
              font-weight: bold;
            }
            .sku {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="barcode">
              <svg width="300" height="80" viewBox="0 0 300 80">
                ${Array.from({ length: 40 }).map((_, i) => 
                  `<rect x="${i * 7}" y="10" width="2" height="50" fill="black" />`
                ).join('')}
              </svg>
            </div>
            <div class="product-name">${product?.name}</div>
            <div class="sku">SKU: ${product?.sku}</div>
            ${product?.barcode?.number ? `<div class="sku">Barcode: ${product.barcode.number}</div>` : ''}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow?.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">{error || 'The product you are looking for does not exist.'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-black text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  const profit = getProfit();
  const expiry = getExpiryStatus();

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
        <span className="text-gray-400">/</span>
        <button onClick={() => router.push('/products')} className="text-gray-500 hover:text-gray-900 transition">
          Products
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      {/* Header with Actions - Conditional based on role */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          {/* Edit Button - Admin and Manager can edit */}
          {canEdit && (
            <button 
              onClick={() => router.push(`/products/add?id=${product._id}`)} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}
          {/* Delete Button - Only Admin can delete */}
          {canDelete && (
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Product Images */}
      <div className="mb-6">
        <ImageGallery images={product.imageUrls} />
      </div>

      {/* Title & SKU */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="text-sm text-gray-500">SKU: <span className="font-mono">{product.sku}</span></span>
              {product.barcode?.number && (
                <span className="text-sm text-gray-500">Barcode: <span className="font-mono">{product.barcode.number}</span></span>
              )}
            </div>
          </div>
          <StockBadge current={product.currentStock} minimum={product.minimumStock} />
        </div>
      </div>

      {/* Stock Status Card */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Box className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">Current Stock</p>
            <p className="text-2xl font-bold text-gray-900">{product.currentStock}</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500">Minimum Stock</p>
            <p className="text-2xl font-bold text-gray-900">{product.minimumStock}</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500">Maximum Stock</p>
            <p className="text-2xl font-bold text-gray-900">{product.maximumStock}</p>
          </div>
        </div>

        {product.currentStock < product.minimumStock && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-sm text-orange-700">Low stock alert! Only {product.currentStock} units left. Minimum required is {product.minimumStock}.</p>
          </div>
        )}
      </div>

      {/* Quick Actions - Conditional based on role */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Stock In - Admin and Manager can do */}
        {canStockIn && (
          <button 
            onClick={() => setShowStockInModal(true)}
            className="flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" /> Stock In
          </button>
        )}
        {/* Stock Out - Admin and Manager can do */}
        {canStockOut && (
          <button 
            onClick={() => setShowStockOutModal(true)}
            className="flex items-center justify-center gap-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            <Minus className="w-4 h-4" /> Stock Out
          </button>
        )}
        {/* Print Barcode - Everyone can print */}
        <button 
          onClick={printBarcode}
          className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Printer className="w-4 h-4" /> Print Barcode
        </button>
      </div>

      {/* Pricing Section - Everyone can view */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Pricing Information</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Cost Price</p>
            <p className="text-xl font-semibold">${product.costPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Selling Price</p>
            <p className="text-xl font-semibold">${product.sellingPrice.toFixed(2)}</p>
          </div>
        </div>
        <div className="pt-4 border-t flex justify-between items-center">
          <span className="text-sm font-medium">Profit Margin</span>
          <span className={`text-lg font-bold ${profit.color}`}>
            ${profit.amount.toFixed(2)} ({profit.margin.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Location Section - Everyone can view */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Warehouse Location</h3>
          <MapPin className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-center">
          <span className="text-2xl font-mono font-bold bg-gray-100 px-4 py-2 rounded-lg">{product.location}</span>
          <p className="text-xs text-gray-400 mt-2">Aisle • Rack • Bin</p>
        </div>
      </div>

      {/* Additional Info - Everyone can view */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Category</span>
            <span className="font-medium">{product.categoryName}</span>
          </div>
          {product.supplierName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Supplier</span>
              <span className="font-medium">{product.supplierName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Added On</span>
            <span className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expiry Date</span>
            <span className={`font-medium ${expiry.color}`}>{expiry.text}</span>
          </div>
        </div>
        {product.description && (
          <>
            <div className="h-px bg-gray-200 my-4" />
            <div>
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-gray-700">{product.description}</p>
            </div>
          </>
        )}
      </div>

      {/* Stock History - Everyone can view */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Stock Movement History</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 transition">View All →</button>
        </div>
        <div className="divide-y">
          {historyLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : stockHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No stock movements yet</div>
          ) : (
            stockHistory.map((item: any) => (
              <div key={item._id} className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-full ${item.type === 'stock_in' ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {item.type === 'stock_in' ? 
                    <TrendingUp className="w-4 h-4 text-green-600" /> : 
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                  }
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.quantity} units {item.type === 'stock_in' ? 'added' : 'removed'}</p>
                  <p className="text-sm text-gray-500">{item.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-400">{item.createdBy?.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals - Conditional based on role */}
      {showStockInModal && canStockIn && (
        <StockInModal 
          product={product} 
          onClose={() => setShowStockInModal(false)} 
          onSuccess={handleRefresh}
        />
      )}
      {showStockOutModal && canStockOut && (
        <StockOutModal 
          product={product} 
          onClose={() => setShowStockOutModal(false)} 
          onSuccess={handleRefresh}
        />
      )}
      {showDeleteModal && canDelete && (
        <DeleteModal 
          product={product} 
          onConfirm={handleDelete} 
          onClose={() => setShowDeleteModal(false)} 
          loading={deleting} 
        />
      )}
    </div>
  );
}