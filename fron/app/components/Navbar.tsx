'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Wallet } from 'lucide-react'
import { getWalletBalance } from '../services/hotelApi'
import { getToken } from '../utils/authUtils'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!localStorage.getItem('token'))
      // Try to get logo from localStorage (support both string and JSON format)
      const logoData = localStorage.getItem('companyLogo');
      if (logoData) {
        try {
          // Try JSON format
          const parsed = JSON.parse(logoData);
          if (parsed && parsed.url) {
            setLogoUrl(parsed.url);
          } else {
            setLogoUrl(logoData);
          }
        } catch {
          // Fallback: just a string URL
          setLogoUrl(logoData);
        }
      } else {
        setLogoUrl(null);
      }
      // Fetch wallet balance if logged in
      if (localStorage.getItem('token')) {
        fetchWallet();
      }
    }
  }, [])

  const fetchWallet = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await getWalletBalance(token);
      if (response && response.data && response.data.wallet) {
        setWalletBalance(
          new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(response.data.wallet.balance)
        );
      }
    } catch (error) {
      setWalletBalance(null);
    }
  }

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center min-h-[40px]">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="max-h-10 h-10 w-auto object-contain"
                  style={{ maxHeight: 40 }}
                />
              ) : (
                <span className="text-2xl font-bold text-blue-600">my.tripbazaar</span>
              )}
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          {isLoggedIn ? (
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/wallet" className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                <Wallet className="mr-1 h-5 w-5" /> Wallet
                {walletBalance && (
                  <span className="ml-2 text-base font-semibold text-black">{walletBalance}</span>
                )}
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Features
              </Link>
              <Link href="#about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                About
              </Link>
              <Link href="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Contact
              </Link>
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Login
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                  Dashboard
                </Link>
                <Link href="/wallet" className="flex items-center text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                  <Wallet className="mr-1 h-5 w-5" /> Wallet
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                  Home
                </Link>
                <Link href="#features" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                  Features
                </Link>
                <Link href="#about" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                  About
                </Link>
                <Link href="#contact" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                  Contact
                </Link>
                <Link href="/login" className="bg-blue-600 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 