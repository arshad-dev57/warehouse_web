'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X, Search, Package, CheckCircle, AlertTriangle,
  Calendar, FileText, Home, Minus, Truck,
  Hash, Calendar as CalendarIcon
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface Product {
  _id: string;
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  sellingPrice: number;
  costPrice: number;
  imageUrls?: string[];
}
function ProductSearchModal({ onSelect, onClose }: { onSelect: (product: Product) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/products/search?q=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) searchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-xl font-semibold">Select Product</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-500 mt-3">Searching products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {search ? 'No products found' : 'Type to search products'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => {
                    onSelect(product);
                    onClose();
                  }}
                  className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition text-left cursor-pointer"
                >
                  {product.imageUrls?.[0] ? (
                    <img src={product.imageUrls[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                      <span className="text-xs text-gray-500">Stock: {product.currentStock}</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-orange-600 text-white rounded-lg text-sm pointer-events-none">
                    Select
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StockOutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdFromUrl = searchParams.get('productId');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('sale');
  const [reference, setReference] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [isProductFromDetails, setIsProductFromDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reasons = [
    { value: 'sale', label: 'Sale' },
    { value: 'damage', label: 'Damaged Goods' },
    { value: 'expired', label: 'Expired Products' },
    { value: 'return_to_supplier', label: 'Return to Supplier' },
    { value: 'transfer', label: 'Transfer to Other Warehouse' },
    { value: 'adjustment', label: 'Stock Adjustment' },
  ];

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    
    if (productIdFromUrl) {
      loadProductFromId(productIdFromUrl);
      setIsProductFromDetails(true);
    }
  }, [productIdFromUrl]);

  const loadProductFromId = async (id: string) => {
    setLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedProduct(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedProduct) newErrors.product = 'Please select a product';
    if (!quantity) newErrors.quantity = 'Quantity is required';
    else if (parseInt(quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    else if (selectedProduct && parseInt(quantity) > selectedProduct.currentStock) {
      newErrors.quantity = `Insufficient stock! Available: ${selectedProduct.currentStock}`;
    }
    if (!reason) newErrors.reason = 'Please select a reason';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    const token = getToken();
    
    const body = {
      productId: selectedProduct!._id || selectedProduct!.id,
      quantity: parseInt(quantity),
      reason: reason,
      date: selectedDate,
      reference: reference || undefined,
      notes: notes || undefined
    };
    
    try {
      const response = await fetch(`${API_URL}/stock/out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Stock removed successfully!');
        router.back();
      } else {
        alert(data.message || 'Failed to remove stock');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Stock Out</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Truck className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Out</h1>
          <p className="text-sm text-gray-500 mt-0.5">Remove stock from your warehouse inventory</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Product <span className="text-red-500">*</span>
          </label>
          <button
            onClick={() => setShowProductModal(true)}
            disabled={isProductFromDetails}
            className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
              errors.product ? 'border-red-300 bg-red-50' : 
              isProductFromDetails ? 'border-orange-300 bg-orange-50' : 
              selectedProduct ? 'border-orange-300 bg-orange-50' : 'border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50'
            }`}
          >
            <div className="flex items-center gap-4">
              {selectedProduct ? (
                <>
                  {selectedProduct.imageUrls?.[0] ? (
                    <img src={selectedProduct.imageUrls[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
                      <Package className="w-7 h-7 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">{selectedProduct.name}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-gray-500">SKU: {selectedProduct.sku}</span>
                      <span className="text-sm text-gray-500">Current Stock: <span className="font-medium">{selectedProduct.currentStock}</span></span>
                    </div>
                    {isProductFromDetails && (
                      <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Product from details page
                      </p>
                    )}
                  </div>
                  {!isProductFromDetails && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); }}
                      className="p-2 hover:bg-white/50 rounded-lg"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Search className="w-7 h-7 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Click to select product</p>
                    <p className="text-sm text-gray-500 mt-1">Search by name or SKU</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </>
              )}
            </div>
          </button>
          {errors.product && <p className="text-red-500 text-sm mt-2">{errors.product}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={selectedProduct?.currentStock}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="Enter quantity"
            />
          </div>
          {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
          {selectedProduct && parseInt(quantity) > selectedProduct.currentStock && (
            <p className="text-red-500 text-xs mt-1">Maximum available: {selectedProduct.currentStock} units</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reference / Order Number</label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., ORDER-2025-001"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Add any additional notes..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Processing...</>
            ) : (
              <><Minus className="w-4 h-4" /> Remove Stock</>
            )}
          </button>
        </div>
      </div>

      {/* Product Search Modal */}
      {showProductModal && (
        <ProductSearchModal
          onSelect={(product) => {
            setSelectedProduct(product);
            setShowProductModal(false);
          }}
          onClose={() => setShowProductModal(false)}
        />
      )}
    </div>
  );
 
}