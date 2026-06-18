import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Services() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Our Services</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-purple-600 text-5xl mb-4"><i className="fas fa-sign-language"></i></div>
            <h3 className="text-xl font-bold mb-3">Sign Language Training</h3>
            <p className="text-gray-600">Comprehensive sign language courses for all levels.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-purple-600 text-5xl mb-4"><i className="fas fa-braille"></i></div>
            <h3 className="text-xl font-bold mb-3">Braille Literacy</h3>
            <p className="text-gray-600">Learn to read and write Braille effectively.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-purple-600 text-5xl mb-4"><i className="fas fa-child"></i></div>
            <h3 className="text-xl font-bold mb-3">Autism Therapy</h3>
            <p className="text-gray-600">Specialized support for children with autism.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
