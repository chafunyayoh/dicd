import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/static/images/dicd-logo.png" alt="DICD Logo" className="h-10 sm:h-12 mr-2 sm:mr-3" />
            <span className="font-bold text-base sm:text-lg md:text-xl text-gray-800 whitespace-nowrap">
              DICD Inclusive College
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-purple-600 transition-colors">Home</Link>
            <Link to="/courses" className="text-gray-700 hover:text-purple-600 transition-colors">Courses</Link>
            <Link to="/services" className="text-gray-700 hover:text-purple-600 transition-colors">Services</Link>
            <Link to="/announcements" className="text-gray-700 hover:text-purple-600 transition-colors">Announcements</Link>
            <Link to="/about" className="text-gray-700 hover:text-purple-600 transition-colors">About</Link>
            <Link to="/contact" className="text-gray-700 hover:text-purple-600 transition-colors">Contact</Link>
            <Link to="/donate" className="text-gray-700 hover:text-purple-600 transition-colors">Donate</Link>
            <Link to="/login" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Login
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-700 hover:text-purple-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link to="/" className="text-gray-700 hover:text-purple-600 py-2 transition-colors">Home</Link>
              <Link to="/courses" className="text-gray-700 hover:text-purple-600 py-2 transition-colors">Courses</Link>
              <Link to="/services" className="text-gray-700 hover:text-purple-600 py-2 transition-colors">Services</Link>
              <Link to="/announcements" className="text-gray-700 hover:text-purple-600 py-2 transition-colors">Announcements</Link>
              <Link to="/about" className="text-gray-700 hover:text-purple-600 py-2 transition-colors">About</Link>
              <Link to="/contact" className="text-gray-700 hover:text-purple-600 py-2 transition-colors">Contact</Link>
              <Link to="/donate" className="text-gray-700 hover:text-purple-600 py-2 transition-colors">Donate</Link>
              <Link to="/login" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-center transition-colors">
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
