"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  UtensilsCrossed,
  Users,
  FileText,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('menu-button');
      
      if (isSidebarOpen && 
          sidebar && 
          !sidebar.contains(event.target as Node) &&
          menuButton &&
          !menuButton.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <button 
                id="menu-button"
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                onClick={toggleSidebar}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold">Admin</h1>
              <Link
                href="/dashboard"
                className="hidden sm:flex text-sm text-gray-600 hover:text-gray-900 items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
            {/* Mobile back button */}
            <Link
              href="/dashboard"
              className="sm:hidden text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>
      
      <div className="flex min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        
        {/* Desktop Sidebar */}
        <nav className="hidden lg:block w-64 bg-white shadow-sm">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/foods"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  Manage Foods
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  Manage Users
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/audit-logs"
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Audit Logs
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Mobile Sidebar */}
        <nav 
          id="mobile-sidebar"
          className={`lg:hidden fixed left-0 top-0 w-64 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Admin Menu</h2>
              <button 
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={closeSidebar}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={closeSidebar}
                >
                  <Home className="w-5 h-5" />
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/foods"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={closeSidebar}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  Manage Foods
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={closeSidebar}
                >
                  <Users className="w-5 h-5" />
                  Manage Users
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/audit-logs"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={closeSidebar}
                >
                  <FileText className="w-5 h-5" />
                  Audit Logs
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full lg:w-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}