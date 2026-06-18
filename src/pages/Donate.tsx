import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Donate() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Support Our Mission</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4">Make a Donation</h2>
          <p className="text-gray-700 mb-6">
            Your generous donation helps us provide inclusive education and support to persons with disabilities.
          </p>
          <div className="bg-purple-100 p-6 rounded-lg mb-6">
            <p className="font-bold mb-2">Bank Account Details:</p>
            <p>Account Number: <span className="font-bold">5084706655028</span></p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700">$25</button>
            <button className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700">$50</button>
            <button className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700">$100</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
