import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">About DICD Inclusive College</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
            The Disability Initiative for Counselling and Development (DICD) was founded to provide inclusive education, 
            vocational training, and psychosocial support for persons with disabilities and vulnerable groups across Malawi.
          </p>
          <p className="text-gray-700">
            We believe in empowering abilities and transforming lives through education, skills training, and community support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold mb-4 text-purple-600">Our Vision</h3>
            <p className="text-gray-700">
              To be a leading institution in the provision of inclusive education and empowerment services for persons 
              with disabilities—enhancing self-reliance, business opportunity, employment access, and communication.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold mb-4 text-purple-600">Our Mission</h3>
            <p className="text-gray-700">
              To empower persons with disabilities and the vulnerable by creating job opportunities, promoting inclusive 
              education, training in sign language and Braille, and enhancing self-reliance and entrepreneurship.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
