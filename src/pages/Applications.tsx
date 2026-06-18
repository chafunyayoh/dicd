import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getForms } from '../services/api'

export default function Applications() {
  const [forms, setForms] = useState<any[]>([])

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      const response = await getForms()
      setForms(response.data.forms || [])
    } catch (error) {
      console.error('Failed to load forms')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Application Forms</h1>
        <div className="grid md:grid-cols-2 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-2">{form.title}</h3>
              <p className="text-gray-600 mb-4">{form.description}</p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
