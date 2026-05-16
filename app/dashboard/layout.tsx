'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Bell, Menu, Search, Plus, Download } from 'lucide-react';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [alertsCount] = useState(3);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main area */}
      <div className="lg:ml-[220px] flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#e5e4df] px-5 lg:px-7 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#6b6b67] hover:text-[#0d0d0d] transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[15px] font-medium text-[#0d0d0d] leading-none">Overview</h1>
              <p className="text-[11px] text-[#9a9a97] mt-0.5 leading-none hidden sm:block">{today}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-[#f7f7f5] border border-[#e5e4df] rounded-lg px-3 py-1.5 w-52">
              <Search className="w-3.5 h-3.5 text-[#9a9a97] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-[12.5px] text-[#0d0d0d] placeholder:text-[#9a9a97] outline-none w-full"
              />
            </div>

            {/* Notifications */}
            {/* <button className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e4df] hover:bg-[#f7f7f5] transition-colors" aria-label="Notifications">
              <Bell className="w-4 h-4 text-[#6b6b67]" />
              {alertsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </button> */}

        

         
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-5 lg:px-7 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}