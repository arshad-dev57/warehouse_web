'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Package, Plus, Search, Edit, Trash2, Filter,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  LayoutGrid, List, ArrowUpDown, AlertTriangle, X,
  Home, Eye
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

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
const canAddProduct = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canEditProduct = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'manager';
};

const canDeleteProduct = () => {
  const role = getUserRole();
  return role === 'admin';
};

const canViewProduct = () => {
  return true; // Everyone can view
};

function StockBadge({ current, minimum }: { current: number; minimum: number }) {
  if (current === 0)
    return (
      <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
        Out of stock
      </span>
    );
  if (current < minimum)
    return (
      <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
        <AlertTriangle className="w-2.5 h-2.5" /> Low
      </span>
    );
  return (
    <span className="inline-flex items-center text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
      In stock
    </span>
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

// Main Products Page
export default function ProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('staff');
  const PER_PAGE = 10;

  // Check permissions
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';
  const canAdd = isAdmin || isManager;
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;

  useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
    loadProducts();
  }, [page, sortField, sortDir, stockFilter]);

  const loadProducts = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', PER_PAGE.toString());
      params.append('sortBy', sortField);
      params.append('sortOrder', sortDir);
      if (stockFilter !== 'all') params.append('stockStatus', stockFilter);
      
      const response = await fetch(`${API_URL}/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalProducts(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      loadProducts();
      return;
    }
    setLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/products/search?q=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
        setTotalPages(1);
        setTotalProducts(data.count || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) handleSearch();
      else { setPage(1); loadProducts(); }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAddProduct = () => {
    if (canAdd) {
      router.push('/products/add');
    }
  };

  const handleEditProduct = (product: any) => {
    if (canEdit) {
      router.push(`/products/add?id=${product._id || product.id}`);
    }
  };

  const handleViewProduct = (product: any) => {
    router.push(`/products/${product._id || product.id}`);
  };

  const handleDeleteProduct = async () => {
    if (!canDelete) return;
    if (!deletingProduct) return;
    setModalLoading(true);
    const token = getToken();
    
    try {
      const response = await fetch(`${API_URL}/products/${deletingProduct._id || deletingProduct.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setDeletingProduct(null);
        loadProducts();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting product');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const ThBtn = ({ field, children, className = '' }: { field: string; children: React.ReactNode; className?: string }) => (
    <button onClick={() => handleSort(field)} className={`flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[#9a9a97] hover:text-[#0d0d0d] transition-colors ${className}`}>
      {children} <SortIcon field={field} />
    </button>
  );

  if (loading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-8 h-8 border-2 border-[#0d0d0d] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-[#9a9a97]">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Products</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-semibold text-[#0d0d0d] leading-none">Products</h2>
          <p className="text-[13px] text-[#9a9a97] mt-1">{totalProducts} product{totalProducts !== 1 ? 's' : ''} total</p>
        </div>
        
        {/* Add Product Button - Only visible to Admin and Manager */}
        {canAdd && (
          <button onClick={handleAddProduct} className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[#0d0d0d] text-white rounded-lg text-[13px] font-medium hover:bg-[#262624] transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a97]" />
          <input 
            type="text" 
            placeholder="Search by name or SKU…" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#e5e4df] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0d0d0d]/10" 
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a97] hover:text-[#0d0d0d]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setFilterOpen(o => !o)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[13px] ${stockFilter !== 'all' ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white' : 'border-[#e5e4df] bg-white text-[#6b6b67]'}`}>
              <Filter className="w-4 h-4" /> Filter
            </button>
            {filterOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-40 bg-white border rounded-xl shadow-sm z-10">
                {[
                  { value: 'all', label: 'All products' },
                  { value: 'low', label: 'Low stock' },
                  { value: 'out', label: 'Out of stock' }
                ].map(opt => (
                  <button 
                    key={opt.value} 
                    onClick={() => { setStockFilter(opt.value as any); setFilterOpen(false); setPage(1); }} 
                    className={`w-full text-left px-3.5 py-2.5 text-[12.5px] ${stockFilter === opt.value ? 'bg-[#f7f7f5] text-[#0d0d0d] font-medium' : 'text-[#6b6b67] hover:bg-[#f7f7f5]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setView('table')} className={`px-3 py-2.5 transition-colors ${view === 'table' ? 'bg-[#0d0d0d] text-white' : 'bg-white text-[#9a9a97]'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView('grid')} className={`px-3 py-2.5 transition-colors ${view === 'grid' ? 'bg-[#0d0d0d] text-white' : 'bg-white text-[#9a9a97]'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {!loading && view === 'table' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-[#f7f7f5]">
                  <th className="text-left px-5 py-3.5"><ThBtn field="name">Product</ThBtn></th>
                  <th className="text-left px-5 py-3.5"><ThBtn field="sku">SKU</ThBtn></th>
                  <th className="text-left px-5 py-3.5"><ThBtn field="categoryName">Category</ThBtn></th>
                  <th className="text-left px-5 py-3.5"><ThBtn field="currentStock">Stock</ThBtn></th>
                  <th className="text-left px-5 py-3.5">Status</th>
                  <th className="text-right px-5 py-3.5"><ThBtn field="sellingPrice">Price</ThBtn></th>
                  <th className="text-right px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <Package className="w-10 h-10 text-[#d1d1ce] mx-auto mb-2" />
                      <p className="text-[13px] text-[#9a9a97]">No products found</p>
                    </td>
                  </tr>
                ) : (
                  products.map((product: any) => (
                    <tr key={product._id || product.id} className="hover:bg-[#f7f7f5] group">
                      {/* Product Name - Clickable */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrls?.[0] ? (
                            <img 
                              src={product.imageUrls[0]} 
                              alt={product.name} 
                              className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition"
                              onClick={() => handleViewProduct(product)}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#f7f7f5] border rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-[#9a9a97]" />
                            </div>
                          )}
                          <p 
                            onClick={() => handleViewProduct(product)} 
                            className="text-[13.5px] font-medium max-w-[200px] truncate cursor-pointer hover:text-blue-600 transition"
                          >
                            {product.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] font-mono text-[#9a9a97] bg-[#f7f7f5] px-2 py-0.5 rounded">
                          {product.sku || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12.5px] text-[#6b6b67]">{product.categoryName || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[13px] font-mono font-medium ${(product.currentStock ?? 0) < (product.minimumStock ?? 0) ? 'text-red-600' : 'text-[#0d0d0d]'}`}>
                          {product.currentStock ?? 0}
                        </span>
                        <span className="text-[11px] text-[#b4b3ae] ml-1">/ {product.minimumStock ?? 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StockBadge current={product.currentStock ?? 0} minimum={product.minimumStock ?? 0} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[13.5px] font-mono font-medium">${(product.sellingPrice ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Button - Everyone can view */}
                          <button 
                            onClick={() => handleViewProduct(product)} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg border text-[#9a9a97] hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* Edit Button - Only Admin and Manager */}
                          {canEdit && (
                            <button 
                              onClick={() => handleEditProduct(product)} 
                              className="w-8 h-8 flex items-center justify-center rounded-lg border text-[#9a9a97] hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Delete Button - Only Admin */}
                          {canDelete && (
                            <button 
                              onClick={() => setDeletingProduct(product)} 
                              className="w-8 h-8 flex items-center justify-center rounded-lg border text-[#9a9a97] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                              title="Delete Product"
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
            <div className="flex items-center justify-between px-5 py-3.5 border-t bg-[#f7f7f5]">
              <p className="text-[11.5px] text-[#9a9a97]">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-[#9a9a97] hover:text-[#0d0d0d] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-[13px] font-medium">{page}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-[#9a9a97] hover:text-[#0d0d0d] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-14">
              <Package className="w-10 h-10 text-[#d1d1ce] mx-auto mb-2" />
              <p className="text-[13px] text-[#9a9a97]">No products found</p>
            </div>
          ) : (
            products.map((product: any) => (
              <div 
                key={product._id || product.id} 
                className="bg-white border rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => handleViewProduct(product)}
              >
                <div className="flex items-start justify-between mb-3">
                  {product.imageUrls?.[0] ? (
                    <img src={product.imageUrls[0]} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-[#f7f7f5] border rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-[#9a9a97]" />
                    </div>
                  )}
                  <div className="flex gap-1">
                    {/* Edit Button in Grid - Only Admin and Manager */}
                    {canEdit && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }} 
                        className="w-7 h-7 flex items-center justify-center rounded-lg border text-[#9a9a97] hover:text-blue-600"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Delete Button in Grid - Only Admin */}
                    {canDelete && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingProduct(product); }} 
                        className="w-7 h-7 flex items-center justify-center rounded-lg border text-[#9a9a97] hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1">SKU: {product.sku || '—'}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <StockBadge current={product.currentStock ?? 0} minimum={product.minimumStock ?? 0} />
                  <span className="text-sm font-semibold">${(product.sellingPrice ?? 0).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deletingProduct && canDelete && (
        <DeleteModal 
          product={deletingProduct} 
          onConfirm={handleDeleteProduct} 
          onClose={() => setDeletingProduct(null)} 
          loading={modalLoading} 
        />
      )}
    </div>
  );
}