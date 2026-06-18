import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Auth
export const login = (email: string, password: string) => 
  api.post('/auth/login', { email, password })

export const register = (data: any) => 
  api.post('/auth/register', data)

export const logout = () => 
  api.post('/auth/logout')

// Courses
export const getCourses = () => 
  api.get('/courses')

export const getCourse = (id: number) => 
  api.get(`/courses/${id}`)

export const enrollCourse = (courseId: number) => 
  api.post('/enrollments', { course_id: courseId })

export const getEnrollments = () => 
  api.get('/enrollments/my-courses')

// Admin
export const getAdminStats = () => 
  api.get('/admin/stats')

export const getUsers = () => 
  api.get('/admin/users')

export const createCourse = (data: any) => 
  api.post('/admin/courses', data)

export const updateCourse = (id: number, data: any) => 
  api.put(`/admin/courses/${id}`, data)

export const deleteCourse = (id: number) => 
  api.delete(`/admin/courses/${id}`)

// Announcements
export const getAnnouncements = () => 
  api.get('/announcements')

export const createAnnouncement = (data: any) => 
  api.post('/announcements', data)

// Donations
export const createDonation = (data: any) => 
  api.post('/donations/create', data)

// Contact
export const submitContact = (data: any) => 
  api.post('/contact', data)

// Applications
export const getForms = () => 
  api.get('/forms')

export const submitApplication = (data: any) => 
  api.post('/applications', data)

export default api
