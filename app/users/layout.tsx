'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Bell, Menu, Search, Plus, Download } from 'lucide-react';

export default function UsersLayout({
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

      <div className="lg:ml-[220px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-[#e5e4df] px-5 lg:px-7 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#6b6b67] hover:text-[#0d0d0d]">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[15px] font-medium text-[#0d0d0d] leading-none">User Management</h1>
              <p className="text-[11px] text-[#9a9a97] mt-0.5 leading-none hidden sm:block">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-[#f7f7f5] border border-[#e5e4df] rounded-lg px-3 py-1.5 w-52">
              <Search className="w-3.5 h-3.5 text-[#9a9a97]" />
              <input type="text" placeholder="Search users..." className="bg-transparent text-[12.5px] outline-none w-full" />
            </div>
          
        
          </div>
        </header>
        <main className="flex-1 px-5 lg:px-7 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}