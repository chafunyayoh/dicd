import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Courses from './pages/Courses'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import About from './pages/About'
import Contact from './pages/Contact'
import Services from './pages/Services'
import Donate from './pages/Donate'
import Announcements from './pages/Announcements'
import Applications from './pages/Applications'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/applications" element={<Applications />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
