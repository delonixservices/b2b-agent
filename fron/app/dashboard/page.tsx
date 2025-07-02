'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Building, Users, Hotel } from 'lucide-react'

interface UserData {
  id: string
  phone: string
  name: string
  agencyName: string
  numPeople: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/login')
    }
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Book Hotel Call to Action */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-xl rounded-lg overflow-hidden shadow-lg">
          <img src="https://www.dusit.com/wp-content/uploads/cache/2025/04/DPHV/2119220256.jpg" alt="Book Hotel" className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="relative z-10 flex flex-col items-center justify-center py-12 px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-lg">Ready to Book Your Next Hotel?</h2>
            <button onClick={() => router.push('/hotels')} className="flex items-center gap-2 bg-blue-600 text-white font-semibold text-lg px-8 py-4 rounded-lg shadow hover:bg-blue-700 transition drop-shadow-lg">
              <Hotel className="w-6 h-6" /> Book Hotel
            </button>
          </div>
        </div>
      </div>
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            Manage your travel agency operations from your dashboard.
          </p>
        </div>
      </div>
      {/* Graph Metric */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Monthly Bookings Overview</h2>
          <p className="text-gray-600 mb-4">Static graph for demo purposes</p>
          <div className="w-64 h-32 bg-blue-100 rounded flex items-end">
            <div className="w-8 h-16 bg-blue-400 mx-1 rounded-t"></div>
            <div className="w-8 h-24 bg-blue-500 mx-1 rounded-t"></div>
            <div className="w-8 h-20 bg-blue-400 mx-1 rounded-t"></div>
            <div className="w-8 h-28 bg-blue-600 mx-1 rounded-t"></div>
            <div className="w-8 h-12 bg-blue-300 mx-1 rounded-t"></div>
          </div>
        </div>
        <div className="mt-8 md:mt-0 md:ml-12">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">120</div>
              <div className="text-gray-600">No. of Packs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">85</div>
              <div className="text-gray-600">Bookings</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-700">₹2.5L</div>
              <div className="text-gray-600">Revenue</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-700">7</div>
              <div className="text-gray-600">Reports</div>
            </div>
          </div>
        </div>
      </div>
      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Name</h3>
              <p className="text-gray-600">{user.name}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Agency</h3>
              <p className="text-gray-600">{user.agencyName}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Team Size</h3>
              <p className="text-gray-600">{user.numPeople} people</p>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
            <div className="text-center">
              <h3 className="font-semibold">Manage Bookings</h3>
              <p className="text-sm opacity-90">View and manage your bookings</p>
            </div>
          </button>
          <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
            <div className="text-center">
              <h3 className="font-semibold">Add Hotels</h3>
              <p className="text-sm opacity-90">Add new hotels to your inventory</p>
            </div>
          </button>
          <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
            <div className="text-center">
              <h3 className="font-semibold">Reports</h3>
              <p className="text-sm opacity-90">View analytics and reports</p>
            </div>
          </button>
          <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors">
            <div className="text-center">
              <h3 className="font-semibold">Settings</h3>
              <p className="text-sm opacity-90">Manage your account settings</p>
            </div>
          </button>
        </div>
      </div>
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full mr-4">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Account created successfully</p>
              <p className="text-sm text-gray-600">Welcome to B2B Agent platform</p>
            </div>
            <span className="ml-auto text-sm text-gray-500">Just now</span>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="bg-green-100 p-2 rounded-full mr-4">
              <Building className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Agency profile completed</p>
              <p className="text-sm text-gray-600">Your agency details have been saved</p>
            </div>
            <span className="ml-auto text-sm text-gray-500">Just now</span>
          </div>
        </div>
      </div>
    </div>
  )
} 