'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Plus, Search, Edit, Trash2,
  ChevronLeft, ChevronRight, X, Users as UsersIcon,
  AlertCircle, MoreVertical, CheckCircle, XCircle, Save,
  Shield
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

type UserRole = 'admin' | 'manager' | 'staff';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// Get user role from localStorage
const getUserRoleFromStorage = () => {
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

// Get role color
const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'admin': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
    case 'manager': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
    default: return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
  }
};

// Delete Modal
function DeleteUserModal({ user, onConfirm, onClose, loading }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete User</h3>
          <p className="text-gray-500 mb-6">
            Are you sure you want to delete <span className="font-medium text-gray-900">{user?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add User Modal - Only visible to Admin
function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    role: 'staff' as UserRole,
    password: '',
    confirmPassword: '',
    acceptedTerms: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.name) { setError('Name is required'); return; }
    if (!formData.email) { setError('Email is required'); return; }
    if (!formData.email.includes('@')) { setError('Invalid email'); return; }
    if (!formData.country) { setError('Country is required'); return; }
    if (!formData.password) { setError('Password is required'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }

    setSubmitting(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          role: formData.role,
          password: formData.password,
          acceptedTerms: formData.acceptedTerms
        })
      });
      const data = await response.json();
      if (data.success) { onSuccess(); onClose(); }
      else setError(data.message || 'Failed to create user');
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl"><UsersIcon className="w-5 h-5 text-white" /></div>
            <div><h3 className="text-xl font-bold text-gray-900">Add User</h3><p className="text-sm text-gray-500">Create a new user account</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <input type="text" placeholder="Full Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
          <input type="email" placeholder="Email *" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
          <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
          <input type="text" placeholder="Country *" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
          <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl">
            <option value="staff">Staff</option><option value="manager">Manager</option><option value="admin">Admin</option>
          </select>
          <input type="password" placeholder="Password * (min 8 characters)" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
          <input type="password" placeholder="Confirm Password *" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
        </div>
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Add User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit User Modal
function EditUserModal({ user, onClose, onSuccess, currentUserRole }: { user: User; onClose: () => void; onSuccess: () => void; currentUserRole: string }) {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    country: user.country || '',
    role: user.role,
    isActive: user.isActive
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Manager can only edit staff users, cannot change role
  const isManager = currentUserRole === 'manager';
  const canChangeRole = currentUserRole === 'admin';
  const canChangeStatus = currentUserRole === 'admin';

  const handleSubmit = async () => {
    if (!formData.name) { setError('Name is required'); return; }
    if (!formData.country) { setError('Country is required'); return; }

    setSubmitting(true);
    const token = getToken();

    // Prepare data - Manager cannot change role or status
    const updateData = isManager ? {
      name: formData.name,
      phone: formData.phone,
      country: formData.country,
      role: user.role, // Keep original role
      isActive: user.isActive // Keep original status
    } : formData;

    try {
      const response = await fetch(`${API_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      
      if (data.success) { 
        onSuccess(); 
        onClose(); 
      } else {
        setError(data.message || 'Failed to update user');
      }
    } catch (err) { 
      console.error(err);
      setError('Network error'); 
    }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl"><Edit className="w-5 h-5 text-blue-600" /></div>
            <div><h3 className="text-xl font-bold text-gray-900">Edit User</h3><p className="text-sm text-gray-500">Update user information</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
          </div>
          
          {/* Role field - Only Admin can see and change */}
          {canChangeRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          
          {/* Status field - Only Admin can see and change */}
          {canChangeStatus && (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                className="w-4 h-4 rounded" />
              <label className="text-sm text-gray-600">Active Status</label>
            </div>
          )}
          
          {/* Manager restriction note */}
          {isManager && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Manager can only edit basic information (Name, Phone, Country)
              </p>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} 
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// User Card (Mobile)
function UserCard({ user, onEdit, onDelete, currentUserRole }: any) {
  const roleColor = getRoleColor(user.role);
  const isAdmin = currentUserRole === 'admin';
  const isManager = currentUserRole === 'manager';
  
  // Permissions based on role
  const canEdit = isAdmin || (isManager && user.role === 'staff');
  const canDelete = isAdmin && user.role !== 'admin';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${roleColor.bg}`}>
          <span className={`text-lg font-bold ${roleColor.text}`}>{user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2"><p className="font-semibold text-gray-900">{user.name}</p><span className={`text-xs px-2 py-0.5 rounded-full ${roleColor.bg} ${roleColor.text}`}>{user.role.toUpperCase()}</span></div>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          {user.phone && <p className="text-xs text-gray-400 mt-1">{user.phone}</p>}
          <div className="flex items-center gap-2 mt-2"><div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} /><span className="text-xs text-gray-500">{user.isActive ? 'Active' : 'Inactive'}</span></div>
        </div>
        {(canEdit || canDelete) && (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400"><MoreVertical className="w-4 h-4" /></button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-28 bg-white border rounded-xl shadow-lg z-10">
                {canEdit && (
                  <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-xl">
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl">
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

// Main Page
export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('staff');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Permission flags
  const isAdmin = currentUserRole === 'admin';
  const isManager = currentUserRole === 'manager';
  const isStaff = currentUserRole === 'staff';
  
  // Staff cannot see this page at all
  const canViewPage = isAdmin || isManager;
  
  // Add User - Only Admin can add
  const canAddUser = isAdmin;
  
  // Delete User - Only Admin can delete
  const canDeleteUser = isAdmin;

  // ✅ loadUsers function - Manager will only see staff users
  const loadUsers = async () => {
    setLoading(true);
    const token = getToken();
    
    if (!token) {
      console.error('No token found');
      setLoading(false);
      return;
    }

    // Get current role directly from storage to ensure correct filtering
    const currentRole = getUserRoleFromStorage();
    const isManagerUser = currentRole === 'manager';
    const isAdminUser = currentRole === 'admin';

    console.log('Current user role:', currentRole);
    console.log('Is Manager:', isManagerUser);

    try {
      const response = await fetch(`${API_URL}/users`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await response.json();
      
      if (data.success) {
        let userList = data.data || [];
        console.log('Total users from API:', userList.length);
        
        // Manager can only see staff users (cannot see admin and other managers)
        if (isManagerUser) {
          const beforeFilter = userList.length;
          userList = userList.filter((u: User) => u.role === 'staff');
          console.log(`Filtered users: ${beforeFilter} -> ${userList.length} (only staff)`);
        }
        
        setUsers(userList);
      }
    } catch (err) { 
      console.error('Fetch error:', err); 
    }
    finally { setLoading(false); }
  };

  // ✅ useEffect to load users
  useEffect(() => {
    const role = getUserRoleFromStorage();
    setCurrentUserRole(role);
    if (role !== 'staff') {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, []);

  const handleEditUser = (user: User) => {
    // Manager can only edit staff users
    if (isManager && user.role !== 'staff') {
      alert('You can only edit staff users');
      return;
    }
    setEditingUser(user);
  };

  const handleDeleteUser = (user: User) => {
    // Only admin can delete
    if (!isAdmin) {
      alert('Only admin can delete users');
      return;
    }
    setDeletingUser(user);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    const token = getToken();
    
    try {
      const response = await fetch(`${API_URL}/users/${deletingUser._id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await response.json();
      
      if (data.success) {
        await loadUsers();
        setDeletingUser(null);
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting user');
    }
    finally { setDeleting(false); }
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleFilters = [{ id: 'all', label: 'All' }, { id: 'admin', label: 'Admin' }, { id: 'manager', label: 'Manager' }, { id: 'staff', label: 'Staff' }];

  // Staff users ko redirect karo ya message dikhao
  if (isStaff) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 text-center max-w-md">
          You don't have permission to access the User Management page. 
          This page is only available for Admin and Manager roles.
        </p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900" />
        <p className="text-sm text-gray-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900">
          <Home className="w-3.5 h-3.5" /> Dashboard
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Users</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredUsers.length} users total</p>
        </div>
        
        {/* Add User Button - Only Admin */}
        {canAddUser && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800">
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
        
        {/* Manager info badge */}
        {isManager && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700">Manager View (Staff Only)</span>
          </div>
        )}
      </div>

      {/* Role Filters - For Admin only */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {roleFilters.map((filter) => (
            <button key={filter.id} onClick={() => setRoleFilter(filter.id)} 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${roleFilter === filter.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Search - Both Admin and Manager can search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} 
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    No users found
                    </td>
                 </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleColor = getRoleColor(user.role);
                  const canEdit = isAdmin || (isManager && user.role === 'staff');
                  const canDelete = isAdmin && user.role !== 'admin';
                  
                  return (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleColor.bg}`}>
                            <span className={`text-sm font-bold ${roleColor.text}`}>{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm text-gray-600">{user.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button onClick={() => handleEditUser(user)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDeleteUser(user)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {filteredUsers.map((user) => (
          <UserCard 
            key={user._id} 
            user={user} 
            onEdit={() => handleEditUser(user)} 
            onDelete={() => handleDeleteUser(user)} 
            currentUserRole={currentUserRole} 
          />
        ))}
      </div>

      {/* Add User Modal - Only Admin */}
      {showAddModal && canAddUser && (
        <AddUserModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { loadUsers(); setShowAddModal(false); }} 
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onSuccess={() => { loadUsers(); setEditingUser(null); }} 
          currentUserRole={currentUserRole}
        />
      )}

      {/* Delete Modal - Only Admin */}
      {deletingUser && canDeleteUser && (
        <DeleteUserModal 
          user={deletingUser} 
          onConfirm={confirmDelete} 
          onClose={() => setDeletingUser(null)} 
          loading={deleting} 
        />
      )}
    </div>
  );
}