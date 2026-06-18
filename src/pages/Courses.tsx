import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCourses } from '../services/api'

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const response = await getCourses()
      setCourses(response.data.courses)
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = filter === 'all' 
    ? courses 
    : courses.filter(c => c.category === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Available Courses</h1>

        {/* Filter */}
        <div className="mb-6">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="sign_language">Sign Language</option>
            <option value="braille">Braille</option>
            <option value="autism_therapy">Autism Therapy</option>
            <option value="ecd">Early Childhood Development</option>
            <option value="inclusive_education">Inclusive Education</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading courses...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-purple-100 flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-6xl text-purple-600"></i>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      <i className="fas fa-clock mr-1"></i>
                      {course.duration_weeks} weeks
                    </span>
                    <Link 
                      to="/login"
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                      Enroll
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
