import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminStats, logout } from '../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0, enrollments: 0, instructors: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await getAdminStats()
      setStats(response.data)
    } catch (error) {
      navigate('/login')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/static/images/dicd-logo.png" alt="DICD Logo" className="h-12 mr-3" />
              <span className="font-bold text-xl text-gray-800">Admin Dashboard</span>
            </Link>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Total Students</p>
            <p className="text-3xl font-bold text-purple-600">{stats.students}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Total Courses</p>
            <p className="text-3xl font-bold text-blue-600">{stats.courses}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Enrollments</p>
            <p className="text-3xl font-bold text-green-600">{stats.enrollments}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Instructors</p>
            <p className="text-3xl font-bold text-orange-600">{stats.instructors}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700">
              Manage Users
            </button>
            <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700">
              Manage Courses
            </button>
            <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700">
              View Announcements
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
