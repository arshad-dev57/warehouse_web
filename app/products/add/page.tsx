'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package, Plus, X, Save, ArrowLeft, Scan, RefreshCw,
  Barcode, Image as ImageIcon, DollarSign, Box, Tag,
  AlertTriangle, CheckCircle, Calendar, MapPin, Upload,
  Camera, QrCode, Loader2, Search, Eye
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

// Types
interface Category {
  _id: string;
  name: string;
}

interface Supplier {
  _id: string;
  name: string;
}

// Barcode Scanner Modal
function BarcodeScannerModal({ onScan, onClose }: { onScan: (barcode: string) => void; onClose: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  const startScanner = async () => {
    setScanning(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Camera access denied. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  // Simulate barcode detection (in real app, use @zxing/library or similar)
  const handleDetectBarcode = () => {
    // For demo, prompt for barcode
    const barcode = prompt('Enter scanned barcode number:');
    if (barcode) {
      onScan(barcode);
      stopScanner();
      onClose();
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {!scanning ? (
            <div className="space-y-4">
              <button
                onClick={startScanner}
                className="w-full py-3 bg-black text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" /> Start Camera Scanner
              </button>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <QrCode className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Or enter barcode manually"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              
              <button
                onClick={() => {
                  if (manualBarcode) {
                    onScan(manualBarcode);
                    onClose();
                  }
                }}
                className="w-full py-2 border rounded-lg hover:bg-gray-50"
              >
                Submit Barcode
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-green-500 m-4 rounded-lg pointer-events-none"></div>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <div className="flex gap-3">
                <button onClick={handleDetectBarcode} className="flex-1 py-2 bg-green-600 text-white rounded-lg">
                  Detect Barcode
                </button>
                <button onClick={stopScanner} className="flex-1 py-2 border rounded-lg">
                  Stop
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Check Barcode Exists Modal
function BarcodeCheckModal({ barcode, onClose, onContinue }: { barcode: string; onClose: () => void; onContinue: () => void }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProduct();
  }, [barcode]);

  const checkProduct = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/products/barcode/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProduct(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p>Checking barcode...</p>
            </div>
          ) : product ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Product Already Exists!</h3>
              <p className="text-gray-600 mb-4">
                This barcode is already assigned to:<br />
                <strong>{product.name}</strong> (SKU: {product.sku})
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2 border rounded-lg">
                  Cancel
                </button>
                <button onClick={onContinue} className="flex-1 py-2 bg-red-600 text-white rounded-lg">
                  Use Anyway
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Barcode Available!</h3>
              <p className="text-gray-600 mb-4">
                Barcode <strong>{barcode}</strong> is not in use.
              </p>
              <button onClick={onContinue} className="w-full py-2 bg-green-600 text-white rounded-lg">
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AddEditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const isEditing = !!productId;

  // Form state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [maxStock, setMaxStock] = useState('100');
  const [location, setLocation] = useState('A-1-B1');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  
  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // UI state
  const [showScanner, setShowScanner] = useState(false);
  const [showBarcodeCheck, setShowBarcodeCheck] = useState(false);
  const [barcodeToCheck, setBarcodeToCheck] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'stock' | 'media'>('basic');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location options
  const aisles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const racks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const bins = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'];
  const [selectedAisle, setSelectedAisle] = useState('A');
  const [selectedRack, setSelectedRack] = useState('1');
  const [selectedBin, setSelectedBin] = useState('B1');

  useEffect(() => {
    loadCategories();
    loadSuppliers();
    if (!isEditing) {
      generateAutoSku();
    }
    if (isEditing && productId) {
      loadProduct(productId);
    }
  }, []);

  useEffect(() => {
    setLocation(`${selectedAisle}-${selectedRack}-${selectedBin}`);
  }, [selectedAisle, selectedRack, selectedBin]);

  const generateAutoSku = () => {
    const timestamp = Date.now().toString();
    const suffix = timestamp.slice(-6);
    setSku(`SKU-${suffix}`);
  };

  const generateBarcode = async () => {
    const timestamp = Date.now().toString();
    let part = timestamp.length > 9 ? timestamp.slice(-9) : timestamp.padStart(9, '0');
    let without = `890${part}`;
    let check = calculateEan13CheckDigit(without);
    let newBarcode = `${without}${check}`;
    
    // Check uniqueness
    const exists = await checkBarcodeExists(newBarcode);
    if (exists) {
      const random = Math.floor(Math.random() * 900000000 + 100000000).toString();
      without = `890${random}`;
      check = calculateEan13CheckDigit(without);
      newBarcode = `${without}${check}`;
    }
    
    setBarcode(newBarcode);
  };

  const calculateEan13CheckDigit = (digits: string): number => {
    if (digits.length !== 12) throw new Error('Need 12 digits');
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += (i % 2 === 0) ? parseInt(digits[i]) : parseInt(digits[i]) * 3;
    }
    return (10 - (sum % 10)) % 10;
  };

  const checkBarcodeExists = async (barcodeValue: string): Promise<boolean> => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/products/check-barcode/${barcodeValue}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data.exists || false;
    } catch {
      return false;
    }
  };

  const handleBarcodeScan = async (scannedBarcode: string) => {
    setBarcodeToCheck(scannedBarcode);
    setShowScanner(false);
    setShowBarcodeCheck(true);
  };

  const handleBarcodeContinue = () => {
    setBarcode(barcodeToCheck);
    setShowBarcodeCheck(false);
  };

  const loadCategories = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setCategories(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSuppliers = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setSuppliers(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProduct = async (id: string) => {
    setLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const p = data.data;
        setName(p.name || '');
        setSku(p.sku || '');
        setBarcode(p.barcode?.number || '');
        setCategoryId(p.categoryId || '');
        setSupplierId(p.supplierId || '');
        setCostPrice(p.costPrice?.toString() || '');
        setSellingPrice(p.sellingPrice?.toString() || '');
        setCurrentStock(p.currentStock?.toString() || '');
        setMinStock(p.minimumStock?.toString() || '5');
        setMaxStock(p.maximumStock?.toString() || '100');
        setDescription(p.description || '');
        setExpiryDate(p.expiryDate?.split('T')[0] || '');
        
        if (p.location) {
          const parts = p.location.split('-');
          if (parts.length === 3) {
            setSelectedAisle(parts[0]);
            setSelectedRack(parts[1]);
            setSelectedBin(parts[2]);
          }
        }
        
        if (p.imageUrls?.length) {
          setImagePreviews(p.imageUrls);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    const oldPreviewCount = imagePreviews.length - imageFiles.length;
    if (index >= oldPreviewCount) {
      const newIndex = index - oldPreviewCount;
      setImageFiles(prev => prev.filter((_, i) => i !== newIndex));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!sku.trim()) newErrors.sku = 'SKU is required';
    if (!categoryId) newErrors.category = 'Category is required';
    if (!costPrice || parseFloat(costPrice) <= 0) newErrors.costPrice = 'Valid cost price is required';
    if (!sellingPrice || parseFloat(sellingPrice) <= 0) newErrors.sellingPrice = 'Valid selling price is required';
    if (!currentStock || parseInt(currentStock) < 0) newErrors.currentStock = 'Valid stock quantity is required';
    
    const min = parseInt(minStock);
    const max = parseInt(maxStock);
    if (min >= max) newErrors.stockRange = 'Minimum stock must be less than maximum stock';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    const token = getToken();
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    if (barcode) formData.append('barcodeNumber', barcode);
    formData.append('categoryId', categoryId);
    if (supplierId) formData.append('supplierId', supplierId);
    formData.append('costPrice', costPrice);
    formData.append('sellingPrice', sellingPrice);
    formData.append('currentStock', currentStock);
    formData.append('minimumStock', minStock);
    formData.append('maximumStock', maxStock);
    formData.append('location', location);
    if (description) formData.append('description', description);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const url = isEditing ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push('/products');
      } else {
        if (data.message?.toLowerCase().includes('barcode')) {
          setErrors({ barcode: 'Barcode already exists' });
        } else if (data.message?.toLowerCase().includes('sku')) {
          setErrors({ sku: 'SKU already exists' });
        } else {
          alert(data.message || 'Failed to save product');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
                <p className="text-sm text-gray-500">{isEditing ? 'Update product information' : 'Create a new product in your warehouse'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEditing ? 'Update' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form - Full Width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-xl border">
            <div className="flex border-b overflow-x-auto">
              {[
                { id: 'basic', label: 'Basic Info', icon: Package },
                { id: 'pricing', label: 'Pricing', icon: DollarSign },
                { id: 'stock', label: 'Stock & Location', icon: Box },
                { id: 'media', label: 'Media', icon: ImageIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter product name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="SKU-XXXXXX"
                      />
                      <button type="button" onClick={generateAutoSku} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier (Optional)</label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(sup => (
                        <option key={sup._id} value={sup._id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-1">Barcode</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Enter or scan barcode"
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black ${errors.barcode ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <button type="button" onClick={() => setShowScanner(true)} className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Scan className="w-4 h-4" /> Scan
                      </button>
                      <button type="button" onClick={generateBarcode} className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Generate
                      </button>
                    </div>
                    {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>}
                    {barcode && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg inline-block">
                        <div className="flex flex-col items-center">
                          <svg width="180" height="50" viewBox="0 0 180 50">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <rect key={i} x={i * 6} y="8" width="2" height="34" fill="black" />
                            ))}
                          </svg>
                          <p className="text-xs font-mono mt-1">{barcode}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      placeholder="Product description..."
                    />
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cost Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black ${errors.costPrice ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Selling Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black ${errors.sellingPrice ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Profit Margin</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg font-semibold">
                        {costPrice && sellingPrice && parseFloat(sellingPrice) > parseFloat(costPrice)
                          ? `${(((parseFloat(sellingPrice) - parseFloat(costPrice)) / parseFloat(costPrice)) * 100).toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Tab */}
              {activeTab === 'stock' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Stock *</label>
                      <input
                        type="number"
                        value={currentStock}
                        onChange={(e) => setCurrentStock(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black ${errors.currentStock ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.currentStock && <p className="text-red-500 text-xs mt-1">{errors.currentStock}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Minimum Stock</label>
                      <input
                        type="number"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Maximum Stock</label>
                      <input
                        type="number"
                        value={maxStock}
                        onChange={(e) => setMaxStock(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                  {errors.stockRange && <p className="text-red-500 text-xs">{errors.stockRange}</p>}

                  <div className="border-t pt-6">
                    <h3 className="text-md font-medium mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Warehouse Location
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Aisle</label>
                        <select value={selectedAisle} onChange={(e) => setSelectedAisle(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                          {aisles.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Rack</label>
                        <select value={selectedRack} onChange={(e) => setSelectedRack(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                          {racks.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Bin</label>
                        <select value={selectedBin} onChange={(e) => setSelectedBin(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                          {bins.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <span className="font-mono font-medium">{location}</span>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div>
                  <label className="block text-sm font-medium mb-3">Product Images</label>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 hover:border-gray-400 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-xs text-gray-400">Upload</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Supported formats: JPG, PNG, GIF. Max 5MB each.</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Modals */}
      {showScanner && (
        <BarcodeScannerModal
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
      
      {showBarcodeCheck && (
        <BarcodeCheckModal
          barcode={barcodeToCheck}
          onClose={() => setShowBarcodeCheck(false)}
          onContinue={handleBarcodeContinue}
        />
      )}
    </div>
  );
}