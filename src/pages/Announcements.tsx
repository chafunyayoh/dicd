import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAnnouncements } from '../services/api'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const response = await getAnnouncements()
      setAnnouncements(response.data.announcements || [])
    } catch (error) {
      console.error('Failed to load announcements')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Announcements</h1>
        <div className="space-y-6">
          {announcements.map(announcement => (
            <div key={announcement.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold mb-2">{announcement.title}</h3>
              <p className="text-gray-600 mb-4">{announcement.content}</p>
              <span className="text-sm text-gray-500">{new Date(announcement.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
