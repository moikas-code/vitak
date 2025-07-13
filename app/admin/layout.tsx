import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { supabaseServiceRole } from "@/lib/db/supabase-server";
import {
  Home,
  UtensilsCrossed,
  Users,
  FileText,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

async function checkAdminAccess(userId: string) {
  const { data } = await supabaseServiceRole
    .from("user_settings")
    .select("role")
    .eq("user_id", userId)
    .single();
  
  return data?.role === "admin";
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.userId) {
    redirect("/auth/sign-in");
  }
  
  const isAdmin = await checkAdminAccess(session.userId);
  
  if (!isAdmin) {
    redirect("/dashboard");
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <button 
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                onClick={() => {
                  const sidebar = document.getElementById('mobile-sidebar');
                  const overlay = document.getElementById('mobile-overlay');
                  if (sidebar && overlay) {
                    sidebar.classList.toggle('translate-x-0');
                    sidebar.classList.toggle('-translate-x-full');
                    overlay.classList.toggle('hidden');
                  }
                }}
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
        <div 
          id="mobile-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden hidden"
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar');
            const overlay = document.getElementById('mobile-overlay');
            if (sidebar && overlay) {
              sidebar.classList.add('-translate-x-full');
              sidebar.classList.remove('translate-x-0');
              overlay.classList.add('hidden');
            }
          }}
        />
        
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
          className="lg:hidden fixed left-0 top-0 w-64 h-full bg-white shadow-lg z-50 transform -translate-x-full transition-transform duration-300 ease-in-out"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Admin Menu</h2>
              <button 
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => {
                  const sidebar = document.getElementById('mobile-sidebar');
                  const overlay = document.getElementById('mobile-overlay');
                  if (sidebar && overlay) {
                    sidebar.classList.add('-translate-x-full');
                    sidebar.classList.remove('translate-x-0');
                    overlay.classList.add('hidden');
                  }
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const sidebar = document.getElementById('mobile-sidebar');
                    const overlay = document.getElementById('mobile-overlay');
                    if (sidebar && overlay) {
                      sidebar.classList.add('-translate-x-full');
                      sidebar.classList.remove('translate-x-0');
                      overlay.classList.add('hidden');
                    }
                  }}
                >
                  <Home className="w-5 h-5" />
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/foods"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const sidebar = document.getElementById('mobile-sidebar');
                    const overlay = document.getElementById('mobile-overlay');
                    if (sidebar && overlay) {
                      sidebar.classList.add('-translate-x-full');
                      sidebar.classList.remove('translate-x-0');
                      overlay.classList.add('hidden');
                    }
                  }}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  Manage Foods
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const sidebar = document.getElementById('mobile-sidebar');
                    const overlay = document.getElementById('mobile-overlay');
                    if (sidebar && overlay) {
                      sidebar.classList.add('-translate-x-full');
                      sidebar.classList.remove('translate-x-0');
                      overlay.classList.add('hidden');
                    }
                  }}
                >
                  <Users className="w-5 h-5" />
                  Manage Users
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/audit-logs"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const sidebar = document.getElementById('mobile-sidebar');
                    const overlay = document.getElementById('mobile-overlay');
                    if (sidebar && overlay) {
                      sidebar.classList.add('-translate-x-full');
                      sidebar.classList.remove('translate-x-0');
                      overlay.classList.add('hidden');
                    }
                  }}
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}