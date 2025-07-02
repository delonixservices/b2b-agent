'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  List, 
  Percent, 
  UserPlus, 
  Repeat, 
  CreditCard, 
  Hotel, 
  LogOut, 
  Menu,
  X,
  User,
  Building,
  Image
} from 'lucide-react';

interface UserData {
  id: string;
  phone: string;
  name: string;
  agencyName: string;
  numPeople: number;
}

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    // Load logo from localStorage (support both string and JSON format)
    const logoData = localStorage.getItem('companyLogo');
    if (logoData) {
      try {
        const parsed = JSON.parse(logoData);
        if (parsed && parsed.url) {
          setLogoUrl(parsed.url);
        } else {
          setLogoUrl(logoData);
        }
      } catch {
        setLogoUrl(logoData);
      }
    } else {
      setLogoUrl(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: List },
    { name: 'Markup', href: '/dashboard/Markup', icon: Percent },
    { name: 'New Users', href: '/dashboard/NewUsers', icon: UserPlus },
    { name: 'Transactions', href: '/dashboard/transactions', icon: Repeat },
    { name: 'Wallet', href: '/dashboard/wallet', icon: CreditCard },
    { name: 'Business Details', href: '/dashboard/details', icon: Building },
    { name: 'Logo Management', href: '/dashboard/logo', icon: Image },
    { name: 'Book Hotel', href: '/hotels', icon: Hotel },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
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
          <div className="flex items-center justify-center h-16 px-4 border-b min-h-[40px]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company Logo"
                className="max-h-10 h-10 w-auto object-contain"
                style={{ maxHeight: 40 }}
              />
            ) : (
              <span className="text-xl font-bold text-blue-600">my.tripbazaar</span>
            )}
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.agencyName}</p>
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