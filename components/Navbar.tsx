'use client';

import { Menu, Bell } from 'lucide-react';

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
  alertsCount: number;
}

export default function Navbar({ setSidebarOpen, alertsCount }: NavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900">
              <Bell className="w-5 h-5" />
              {alertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center lg:hidden">
              <span className="text-sm font-medium text-gray-600">A</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}