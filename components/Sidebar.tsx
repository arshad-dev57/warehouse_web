'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Package, ShoppingCart, Box, Users, Settings,
  Menu, X, Truck, FileText, BarChart3, LogOut, LayoutDashboard, Wallet,
  Layers, ClipboardList
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: any;
  onLogout: () => void;
}

// Menu items definition (static, not dependent on role for initial render)
const ALL_MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'manager', 'staff'] },
  { name: 'Products', icon: Package, path: '/products', roles: ['admin', 'manager', 'staff'] },
  { name: 'Categories', icon: Layers, path: '/categories', roles: ['admin', 'manager', 'staff'] },
  { name: 'Stock in', icon: Box, path: '/stock/in', roles: ['admin', 'manager', 'staff'] },
  { name: 'Stock out', icon: Box, path: '/stock/out', roles: ['admin', 'manager', 'staff'] },
  { name: 'Orders', icon: ShoppingCart, path: '/orders', roles: ['admin', 'manager', 'staff'] },
  { name: 'Suppliers', icon: Truck, path: '/suppliers', roles: ['admin', 'manager', 'staff'] },
  { name: 'Reports', icon: FileText, path: '/reports', roles: ['admin', 'manager', 'staff'] },
  { name: 'Invoices', icon: ClipboardList, path: '/invoices', roles: ['admin', 'manager', 'staff'] },
  { name: 'Inventory Valuation', icon: Wallet, path: '/inventory/valuation', roles: ['admin', 'manager'] },
  { name: 'Users', icon: Users, path: '/users', roles: ['admin', 'manager'] },
];

// Filter menu items based on role (client-side only)
const getMenuItemsForRole = (role: string) => {
  return ALL_MENU_ITEMS.filter(item => item.roles.includes(role));
};

export default function Sidebar({ sidebarOpen, setSidebarOpen, user, onLogout }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('staff');
  const [menuItems, setMenuItems] = useState(ALL_MENU_ITEMS);
  const [mounted, setMounted] = useState(false);

  // Get user role only on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const role = userData.role || 'staff';
        setUserRole(role);
        setMenuItems(getMenuItemsForRole(role));
      } catch {
        setUserRole('staff');
        setMenuItems(getMenuItemsForRole('staff'));
      }
    } else {
      setUserRole('staff');
      setMenuItems(getMenuItemsForRole('staff'));
    }
  }, []);

  // Handle nested routes - Fixed for Stock in/out
  const isActive = (path: string) => {
    // Exact match for dashboard
    if (path === '/dashboard') return pathname === '/dashboard';
    
    // Products and sub-pages (add, edit, details)
    if (path === '/products') return pathname.startsWith('/products');
    
    // Categories
    if (path === '/categories') return pathname.startsWith('/categories');
    
    // Stock in - exact match or starts with /stock/in
    if (path === '/stock/in') return pathname === '/stock/in' || pathname.startsWith('/stock/in');
    
    // Stock out - exact match or starts with /stock/out
    if (path === '/stock/out') return pathname === '/stock/out' || pathname.startsWith('/stock/out');
    
    // Inventory Valuation
    if (path === '/inventory/valuation') return pathname.startsWith('/inventory');
    
    // Orders
    if (path === '/orders') return pathname.startsWith('/orders');
    
    // Suppliers
    if (path === '/suppliers') return pathname.startsWith('/suppliers');
    
    // Reports
    if (path === '/reports') return pathname.startsWith('/reports');
    
    // Invoices
    if (path === '/invoices') return pathname.startsWith('/invoices');
    
    // Users
    if (path === '/users') return pathname.startsWith('/users');
    
    
    return pathname === path;
  };

  // Show placeholder while mounting to avoid hydration mismatch
  if (!mounted) {
    return (
      <aside className="fixed top-0 left-0 z-50 h-full w-52 bg-black transform transition-transform duration-300 ease-in-out lg:translate-x-0">
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-white" />
            <span className="text-sm font-semibold text-white">Warehouse MS</span>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {ALL_MENU_ITEMS.slice(0, 9).map((item) => (
            <div key={item.name} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg">
              <item.icon className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">{item.name}</span>
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Black Background */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-52 bg-black transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-white" />
            <span className="text-sm font-semibold text-white">Warehouse MS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.path);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                ${isActive(item.path) 
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-2 p-1">
            <div className="h-7 w-7 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email || 'admin@warehouse.com'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}