import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Contact Us</h3>
            <p className="text-sm sm:text-base mb-2"><i className="fas fa-user mr-2"></i>Moses L. Khembo</p>
            <p className="text-sm sm:text-base mb-2"><i className="fas fa-phone mr-2"></i>+265 991 507 626</p>
            <p className="text-sm sm:text-base mb-2"><i className="fas fa-phone mr-2"></i>+265 880 271 451</p>
            <p className="text-sm sm:text-base mb-2"><i className="fas fa-envelope mr-2"></i>moseskhembo27@gmail.com</p>
            <p className="text-sm sm:text-base"><i className="fas fa-map-marker-alt mr-2"></i>Private Bag 151, Rumphi, Mzuzu - Malawi</p>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm sm:text-base">
              <li><Link to="/" className="hover:text-purple-400">Home</Link></li>
              <li><Link to="/courses" className="hover:text-purple-400">Courses</Link></li>
              <li><Link to="/about" className="hover:text-purple-400">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-purple-400">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Programs</h3>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>Sign Language Training</li>
              <li>Braille Literacy</li>
              <li>Autism Therapy</li>
              <li>Inclusive Education</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm sm:text-base">
          <p>&copy; 2024 DICD Inclusive College. All rights reserved.</p>
          <p className="mt-2">Empowering Abilities. Transforming Lives.</p>
        </div>
      </div>
    </footer>
  )
}
