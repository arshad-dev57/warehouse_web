'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight,
  X, Layers, Tag, Package, AlertTriangle, Filter
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

interface Category {
  _id: string;
  name: string;
  description?: string;
  productCount?: number;
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
const canAddCategory = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canEditCategory = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canDeleteCategory = () => {
  const role = getUserRole();
  return role === 'admin';
};

// Add Category Modal
function AddCategoryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setSubmitting(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to create category');
      }
    } catch (err) {
      setError('Error creating category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Add Category</h3>
              <p className="text-sm text-gray-500">Create a new product category</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Enter category name"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Enter category description (optional)"
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
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Creating...</>
            ) : (
              'Create Category'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Category Modal
function EditCategoryModal({ category, onClose, onSuccess }: { category: Category; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setSubmitting(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/categories/${category._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to update category');
      }
    } catch (err) {
      setError('Error updating category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Edit Category</h3>
              <p className="text-sm text-gray-500">Update category information</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Enter category name"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Enter category description (optional)"
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
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Updating...</>
            ) : (
              'Update Category'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Category Modal
function DeleteCategoryModal({ category, onClose, onSuccess }: { category: Category; onClose: () => void; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/categories/${category._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Failed to delete category');
      }
    } catch (err) {
      alert('Error deleting category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Category</h3>
          <p className="text-gray-500 mb-6">
            Are you sure you want to delete <span className="font-medium text-gray-900">{category.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {submitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Deleting...</>
              ) : (
                'Delete Category'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Categories Content
export default function CategoriesContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hasProducts' | 'empty'>('all');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('staff');
  const PER_PAGE = 10;

  // Permission checks
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';
  const canAdd = isAdmin || isManager;
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;

  useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/categories?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setAllCategories(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search and filter type
  const filteredCategories = allCategories.filter(cat => {
    // Search filter
    const matchesSearch = search === '' || 
      cat.name.toLowerCase().includes(search.toLowerCase());
    
    // Type filter
    let matchesFilter = true;
    if (filterType === 'hasProducts') {
      matchesFilter = (cat.productCount || 0) > 0;
    } else if (filterType === 'empty') {
      matchesFilter = (cat.productCount || 0) === 0;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalCategories = filteredCategories.length;
  const totalPages = Math.ceil(totalCategories / PER_PAGE);
  const paginatedCategories = filteredCategories.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, filterType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition ${
              filterType !== 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
            {filterType !== 'all' && (
              <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
          
          {filterOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                    filterType === 'all' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                <button
                  onClick={() => {
                    setFilterType('hasProducts');
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                    filterType === 'hasProducts' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Has Products
                </button>
                <button
                  onClick={() => {
                    setFilterType('empty');
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                    filterType === 'empty' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Empty Categories
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Add Button - Only visible to Admin and Manager */}
        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition sm:ml-auto"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        {totalCategories} category{totalCategories !== 1 ? 's' : ''} found
        {search && ` matching "${search}"`}
        {filterType !== 'all' && ` • ${filterType === 'hasProducts' ? 'Has products' : 'Empty'}`}
      </p>

      {/* Categories Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">#</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Category Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Products</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No categories found
                    </td>
                 </tr>
              ) : (
                paginatedCategories.map((category, index) => (
                  <tr key={category._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Tag className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {category.description || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        <Package className="w-3 h-3" />
                        {category.productCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button - Only Admin and Manager */}
                        {canEdit && (
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {/* Delete Button - Only Admin */}
                        {canDelete && (
                          <button
                            onClick={() => setDeletingCategory(category)}
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

      {/* Categories Cards - Mobile/Tablet */}
      <div className="md:hidden space-y-3">
        {paginatedCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No categories found</p>
          </div>
        ) : (
          paginatedCategories.map((category) => (
            <div key={category._id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Tag className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">
                      Created: {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Edit Button - Only Admin and Manager */}
                  {canEdit && (
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-2 text-gray-500 hover:text-blue-600 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {/* Delete Button - Only Admin */}
                  {canDelete && (
                    <button
                      onClick={() => setDeletingCategory(category)}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{category.description}</p>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                  <Package className="w-3 h-3" />
                  {category.productCount || 0} Products
                </span>
              </div>
            </div>
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
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadCategories();
            setShowAddModal(false);
          }}
        />
      )}
      {editingCategory && canEdit && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            loadCategories();
            setEditingCategory(null);
          }}
        />
      )}
      {deletingCategory && canDelete && (
        <DeleteCategoryModal
          category={deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onSuccess={() => {
            loadCategories();
            setDeletingCategory(null);
          }}
        />
      )}
    </div>
  );
}