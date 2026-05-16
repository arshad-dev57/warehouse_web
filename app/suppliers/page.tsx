'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Edit, Trash2, MoreVertical, Home,
  Building2, Phone, Mail, MapPin, CreditCard, CheckCircle,
  XCircle, AlertCircle, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface Supplier {
  _id: string;
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  paymentTerms?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
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

// Permission checks
const canAddSupplier = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canEditSupplier = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canDeleteSupplier = () => {
  const role = getUserRole();
  return role === 'admin';
};

const canToggleStatus = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

// Add Supplier Modal
function AddSupplierModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    paymentTerms: 'immediate'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const paymentTermsOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: '7_days', label: '7 Days' },
    { value: '15_days', label: '15 Days' },
    { value: '30_days', label: '30 Days' }
  ];

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    setSubmitting(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to create supplier');
      }
    } catch (err) {
      setError('Error creating supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Add Supplier</h3>
              <p className="text-sm text-gray-500">Add a new supplier to your system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900"
              placeholder="Enter company name"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
              placeholder="Enter contact person name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
            <input
              type="text"
              value={formData.gstNumber}
              onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
              placeholder="Enter GST number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            >
              {paymentTermsOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Creating...</>
            ) : (
              'Add Supplier'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Supplier Modal
function EditSupplierModal({ supplier, onClose, onSuccess }: { supplier: Supplier; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: supplier.name,
    contactPerson: supplier.contactPerson || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    address: supplier.address || '',
    gstNumber: supplier.gstNumber || '',
    paymentTerms: supplier.paymentTerms || 'immediate'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const paymentTermsOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: '7_days', label: '7 Days' },
    { value: '15_days', label: '15 Days' },
    { value: '30_days', label: '30 Days' }
  ];

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    setSubmitting(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/suppliers/${supplier._id || supplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to update supplier');
      }
    } catch (err) {
      setError('Error updating supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Edit Supplier</h3>
              <p className="text-sm text-gray-500">Update supplier information</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
            <input
              type="text"
              value={formData.gstNumber}
              onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            >
              {paymentTermsOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Updating...</>
            ) : (
              'Update Supplier'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Supplier Modal
function DeleteSupplierModal({ supplier, onClose, onSuccess }: { supplier: Supplier; onClose: () => void; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/suppliers/${supplier._id || supplier.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Failed to delete supplier');
      }
    } catch (err) {
      alert('Error deleting supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Supplier</h3>
          <p className="text-gray-500 mb-6">
            Are you sure you want to delete <span className="font-medium text-gray-900">{supplier.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {submitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Deleting...</>
              ) : (
                'Delete Supplier'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Status Modal
function ToggleStatusModal({ supplier, onClose, onSuccess }: { supplier: Supplier; onClose: () => void; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const newStatus = supplier.status === 'active' ? 'inactive' : 'active';

  const handleToggle = async () => {
    setSubmitting(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/suppliers/${supplier._id || supplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {supplier.status === 'active' ? (
              <XCircle className="w-7 h-7 text-yellow-600" />
            ) : (
              <CheckCircle className="w-7 h-7 text-green-600" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {supplier.status === 'active' ? 'Deactivate' : 'Activate'} Supplier
          </h3>
          <p className="text-gray-500 mb-6">
            Are you sure you want to {supplier.status === 'active' ? 'deactivate' : 'activate'} <span className="font-medium text-gray-900">{supplier.name}</span>?
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={handleToggle}
              disabled={submitting}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white flex items-center justify-center gap-2 transition ${
                supplier.status === 'active' 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Processing...</>
              ) : (
                supplier.status === 'active' ? 'Deactivate' : 'Activate'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Supplier Card Component (Mobile)
function SupplierCard({ supplier, onEdit, onDelete, onToggle, canEdit, canDelete, canToggle }: { 
  supplier: Supplier; 
  onEdit: () => void; 
  onDelete: () => void;
  onToggle: () => void;
  canEdit: boolean;
  canDelete: boolean;
  canToggle: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{supplier.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                supplier.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {supplier.status}
              </span>
            </div>
            {supplier.contactPerson && (
              <p className="text-xs text-gray-500 mt-1">{supplier.contactPerson}</p>
            )}
            {supplier.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" /> {supplier.phone}
              </p>
            )}
          </div>
        </div>
        
        {(canEdit || canDelete || canToggle) && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                {canToggle && (
                  <button
                    onClick={() => { onToggle(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-xl"
                  >
                    {supplier.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Suppliers Page
export default function SuppliersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [togglingSupplier, setTogglingSupplier] = useState<Supplier | null>(null);
  const [userRole, setUserRole] = useState<string>('staff');
  const PER_PAGE = 10;

  // Permission checks
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';
  const canAdd = isAdmin || isManager;
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;
  const canToggle = isAdmin || isManager;

  useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
    loadSuppliers();
  }, [page, search]);

  const loadSuppliers = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', PER_PAGE.toString());
      if (search) params.append('search', search);

      const response = await fetch(`${API_URL}/suppliers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalSuppliers(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadSuppliers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRefresh = () => {
    loadSuppliers();
  };

  if (loading && page === 1) {
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
        <span className="text-gray-900 font-medium">Suppliers</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalSuppliers} supplier{totalSuppliers !== 1 ? 's' : ''} total
          </p>
        </div>
        
        {/* Add Supplier Button - Only Admin and Manager */}
        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search suppliers by name, contact or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* Suppliers Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">#</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Company</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Contact Person</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Phone</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier, index) => (
                  <tr key={supplier._id || supplier.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium text-gray-900">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.contactPerson || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.email || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {supplier.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle Status Button - Admin and Manager */}
                        {canToggle && (
                          <button
                            onClick={() => setTogglingSupplier(supplier)}
                            className={`p-2 rounded-lg transition ${
                              supplier.status === 'active' 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={supplier.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {supplier.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        )}
                        {/* Edit Button - Admin and Manager */}
                        {canEdit && (
                          <button
                            onClick={() => setEditingSupplier(supplier)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {/* Delete Button - Admin Only */}
                        {canDelete && (
                          <button
                            onClick={() => setDeletingSupplier(supplier)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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

      {/* Suppliers Cards - Mobile/Tablet */}
      <div className="md:hidden space-y-3">
        {suppliers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No suppliers found</p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <SupplierCard
              key={supplier._id || supplier.id}
              supplier={supplier}
              onEdit={() => setEditingSupplier(supplier)}
              onDelete={() => setDeletingSupplier(supplier)}
              onToggle={() => setTogglingSupplier(supplier)}
              canEdit={canEdit}
              canDelete={canDelete}
              canToggle={canToggle}
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

      {/* Modals - Only show if user has permission */}
      {showAddModal && canAdd && (
        <AddSupplierModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleRefresh}
        />
      )}
      {editingSupplier && canEdit && (
        <EditSupplierModal
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSuccess={handleRefresh}
        />
      )}
      {deletingSupplier && canDelete && (
        <DeleteSupplierModal
          supplier={deletingSupplier}
          onClose={() => setDeletingSupplier(null)}
          onSuccess={handleRefresh}
        />
      )}
      {togglingSupplier && canToggle && (
        <ToggleStatusModal
          supplier={togglingSupplier}
          onClose={() => setTogglingSupplier(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}