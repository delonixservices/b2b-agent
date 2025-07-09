'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  List, 
  Building, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  User,
  Shield,
  BarChart3,
  FileText,
  Percent,
  Wallet
} from 'lucide-react';

interface AdminData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminSidebarProps {
  children: React.ReactNode;
}

export default function AdminSidebar({ children }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      try {
        setAdmin(JSON.parse(adminData));
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Companies', href: '/admin/details', icon: Building },
    { name: 'Wallets', href: '/admin/wallets', icon: Wallet },
    { name: 'Markups', href: '/admin/markups', icon: Percent },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Settings', href: '/admin/setup', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:static
          inset-y-0 left-0 z-40
          flex flex-col w-64 bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          md:transition-none
        `}>
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-blue-600">Admin Panel</span>
            </div>
          </div>

          {/* Admin Info */}
          {admin && (
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
                  <p className="text-xs text-gray-500 truncate">{admin.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 md:ml-0">
          <div className="pt-16 md:pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 