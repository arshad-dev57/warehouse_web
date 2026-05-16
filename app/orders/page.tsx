'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Eye, Home, Package, Clock, CheckCircle, XCircle,
  Truck, Receipt, ChevronLeft, ChevronRight, Plus, X,
  User, CreditCard, Minus, Trash2, RefreshCw,
  Phone,
  MapPin,
  Calendar,
  FileText
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

// Types
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

// Helper function to safely get order amount
const getOrderAmount = (order: Order) => {
  const amount = order.total || order.subtotal || 0;
  return amount.toFixed(2);
};

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactElement }> = {
    pending: { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800',
      icon: <Clock className="w-3 h-3" />
    },
    processing: { 
      bg: 'bg-blue-100', 
      text: 'text-blue-800',
      icon: <Truck className="w-3 h-3" />
    },
    completed: { 
      bg: 'bg-green-100', 
      text: 'text-green-800',
      icon: <CheckCircle className="w-3 h-3" />
    },
    cancelled: { 
      bg: 'bg-red-100', 
      text: 'text-red-800',
      icon: <XCircle className="w-3 h-3" />
    }
  };

  const style = styles[status] || styles.pending;
  const labels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.icon}
      {labels[status]}
    </span>
  );
}

// Order Card Component (Mobile)
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 mb-3 cursor-pointer hover:shadow-md transition"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
          <p className="text-sm text-gray-500 mt-0.5">{order.customerName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm text-gray-600">{order.items?.length || 0} items</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            ${getOrderAmount(order)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Order Details Modal with Status Update
function OrderDetailsModal({ order, onClose, onStatusChange }: { 
  order: Order; 
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const userRole = getUserRole();
  const canChangeStatus = userRole === 'admin' || userRole === 'manager';

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'processing', label: 'Processing', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status) {
      onClose();
      return;
    }
    
    setUpdating(true);
    const token = getToken();
    
    try {
      const response = await fetch(`${API_URL}/orders/${order._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: selectedStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onStatusChange(order._id, selectedStatus);
        onClose();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const subtotal = order.subtotal || order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const total = order.total || subtotal - (order.discount || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
              <p className="text-sm text-gray-500">{order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-5 space-y-5">
          {/* Status Section with Update - Only for Admin/Manager */}
          {canChangeStatus && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Order Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 bg-white"
                    disabled={updating}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {selectedStatus !== order.status && (
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
                  >
                    {updating ? (
                      <><div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" /> Updating...</>
                    ) : (
                      <><RefreshCw className="w-3.5 h-3.5" /> Update Status</>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Current Status: <span className="font-medium">{order.status}</span>
              </p>
            </div>
          )}

          {/* Status Display for Staff (no update) */}
          {!canChangeStatus && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Order Status</span>
              <StatusBadge status={order.status} />
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer Information
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{order.customerPhone}</span>
                </div>
              )}
              {order.customerAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{order.customerAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4" /> Order Items
            </h4>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="divide-y">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-xs text-gray-500">${item.price} each</span>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Order Summary
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="font-medium text-red-600">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Notes
              </h4>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Order Modal (Simplified)
function CreateOrderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    setSubmitting(true);
    const token = getToken();

    const orderData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      items: [], // In a full implementation, you'd add product selection
      discount: 0,
      notes: ''
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Order created successfully!');
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to create order');
      }
    } catch (err) {
      setError('Error creating order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Create Order</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="Enter delivery address"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">* Product selection will be added in next version</p>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Orders Page
export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0
  });
  const PER_PAGE = 10;

  const userRole = getUserRole();
  const canChangeStatus = userRole === 'admin' || userRole === 'manager';
  const canCreateOrder = userRole === 'admin' || userRole === 'manager';

  const tabs = [
    { id: 'all', label: 'All', icon: Receipt },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Truck },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle }
  ];

  useEffect(() => {
    loadOrders();
    loadCounts();
  }, [page, selectedStatus]);

  const loadOrders = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', PER_PAGE.toString());
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (search) params.append('search', search);

      const response = await fetch(`${API_URL}/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalOrders(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/orders/counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const countsData = data.data || {};
        setCounts({
          all: (countsData.pending || 0) + (countsData.processing || 0) + (countsData.completed || 0) + (countsData.cancelled || 0),
          pending: countsData.pending || 0,
          processing: countsData.processing || 0,
          completed: countsData.completed || 0,
          cancelled: countsData.cancelled || 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadOrders();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        handleSearch();
      } else {
        setPage(1);
        loadOrders();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId ? { ...order, status: newStatus as any } : order
      )
    );
    loadCounts();
  };

  const getStatusColor = (statusId: string) => {
    const colors: Record<string, string> = {
      all: 'bg-gray-900 text-white',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[statusId] || colors.all;
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition">
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">Orders</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalOrders} order{totalOrders !== 1 ? 's' : ''} total
            </p>
          </div>
          {canCreateOrder && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
            >
              <Plus className="w-4 h-4" /> Create Order
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatus(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedStatus === tab.id
                  ? getStatusColor(tab.id)
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                selectedStatus === tab.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {counts[tab.id as keyof typeof counts] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Orders Table - Desktop */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order #</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Items</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.customerName}</p>
                          {order.customerPhone && (
                            <p className="text-xs text-gray-500 mt-0.5">{order.customerPhone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{order.items?.length || 0} items</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          ${getOrderAmount(order)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">{page}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders Cards - Mobile/Tablet */}
        <div className="md:hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard 
                key={order._id} 
                order={order} 
                onClick={() => handleViewOrder(order)} 
              />
            ))
          )}

          {/* Pagination for mobile */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">System-generated order list</p>
          <p className="text-xs text-gray-400">Warehouse Management System © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && canCreateOrder && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadOrders();
            loadCounts();
          }}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}