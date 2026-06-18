import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section with Video Background */}
      <div className="relative h-[500px] sm:h-[600px] md:h-[700px] lg:h-screen min-h-[400px] overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/static/videos/bg1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <div className="max-w-7xl mx-auto text-center text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 drop-shadow-lg">
              Empowering Abilities. Transforming Lives.
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto drop-shadow-lg px-4">
              DICD Inclusive College provides inclusive education, vocational training, and psychosocial support
              for persons with disabilities and vulnerable groups across Malawi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/courses" className="bg-white text-purple-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block shadow-lg transform hover:scale-105 transition-transform w-full sm:w-auto text-center">
                Browse Courses
              </Link>
              <Link to="/register" className="bg-purple-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 inline-block shadow-lg transform hover:scale-105 transition-transform w-full sm:w-auto text-center">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <div className="text-purple-600 text-3xl sm:text-4xl mb-4">
              <i className="fas fa-eye"></i>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Our Vision</h2>
            <p className="text-gray-700 text-sm sm:text-base">
              To be a leading institution in the provision of inclusive education and empowerment services for
              persons with disabilities—enhancing self-reliance, business opportunity, employment access,
              and communication through inclusive education.
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <div className="text-purple-600 text-3xl sm:text-4xl mb-4">
              <i className="fas fa-bullseye"></i>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Our Mission</h2>
            <p className="text-gray-700 text-sm sm:text-base">
              To empower persons with disabilities and the vulnerable by creating job opportunities,
              promoting inclusive education, training in sign language and Braille, and enhancing
              self-reliance and entrepreneurship.
            </p>
          </div>
        </div>
      </div>

      {/* Programs Overview */}
      <div className="bg-gray-100 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Our Programs</h2>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-purple-600 text-5xl mb-4">
                <i className="fas fa-sign-language"></i>
              </div>
              <h3 className="text-xl font-bold mb-3">Sign Language Training</h3>
              <p className="text-gray-600">
                Learn expressive sign language, vocabulary, facial markers, and grammar structure.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-purple-600 text-5xl mb-4">
                <i className="fas fa-braille"></i>
              </div>
              <h3 className="text-xl font-bold mb-3">Braille Literacy</h3>
              <p className="text-gray-600">
                Master reading and writing by touch to support visually impaired individuals.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-purple-600 text-5xl mb-4">
                <i className="fas fa-hands-helping"></i>
              </div>
              <h3 className="text-xl font-bold mb-3">Inclusive Education</h3>
              <p className="text-gray-600">
                Training for mainstream teachers on supporting students with diverse learning needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-purple-600 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Join Us in Making a Difference</h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 px-2">
            Whether by sponsoring a child, enrolling in a training course, or funding our programs—you can
            be the reason someone is empowered today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/contact" className="bg-white text-purple-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block transform hover:scale-105 transition w-full sm:w-auto text-center">
              Get In Touch
            </Link>
            <Link to="/donate" className="bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-green-700 inline-block transform hover:scale-105 transition w-full sm:w-auto text-center">
              <i className="fas fa-heart mr-2"></i>Donate Now
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
