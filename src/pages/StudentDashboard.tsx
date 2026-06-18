import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCourses, getEnrollments, enrollCourse, logout } from '../services/api'

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('my-courses')
  const [myCourses, setMyCourses] = useState<any[]>([])
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [enrollmentsRes, coursesRes] = await Promise.all([
        getEnrollments(),
        getCourses()
      ])
      setMyCourses(enrollmentsRes.data.enrollments || [])
      setAllCourses(coursesRes.data.courses || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: number) => {
    try {
      await enrollCourse(courseId)
      loadData()
      alert('Enrolled successfully!')
    } catch (error) {
      alert('Failed to enroll')
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
              <span className="font-bold text-xl text-gray-800">Student Portal</span>
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Welcome to Your Learning Portal</h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-courses')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'my-courses'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Courses
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'browse'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Browse Courses
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* My Courses Tab */}
            {activeTab === 'my-courses' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">My Enrolled Courses</h2>
                {myCourses.length === 0 ? (
                  <p className="text-gray-600">You haven't enrolled in any courses yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myCourses.map((enrollment: any) => (
                      <div key={enrollment.id} className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-bold mb-2">{enrollment.course_title}</h3>
                        <p className="text-gray-600 mb-4">Progress: {enrollment.progress_percentage}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          ></div>
                        </div>
                        <button className="text-purple-600 hover:underline">
                          Continue Learning →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Browse Courses Tab */}
            {activeTab === 'browse' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Browse Available Courses</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCourses.map((course: any) => (
                    <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                      <p className="text-gray-600 mb-4">{course.description}</p>
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                      >
                        Enroll Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
