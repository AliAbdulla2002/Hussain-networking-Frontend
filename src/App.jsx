import Nav from "./components/Nav"
import SignUpForm from "./pages/SignUpForm"
import './App.css'
import { Routes, Route, useNavigate, Link } from "react-router"
import { useState, useEffect } from "react"
import SignInForm from "./pages/SignInForm"
import Landing from "./pages/Landing"
import Dashboard from "./pages/Dashboard"
import CourseList from "./pages/CourseList"
import * as courseService from './services/courses'
import CourseDetails from "./pages/CourseDetails"
import CourseForm from "./pages/CourseForm"
import Profile from "./pages/Profile"
import Chat from './pages/Chat'
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import { io } from 'socket.io-client'

const getUserFromToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  return JSON.parse(atob(token.split('.')[1])).payload
}

const socket = io(import.meta.env.VITE_BACK_END_SERVER_URL)

const App = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(getUserFromToken())
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const fetchAllCourses = async () => {
      const coursesData = await courseService.index()
      setCourses(coursesData || [])
    }
    if (user && !user.isBanned) fetchAllCourses()
  }, [user])

  useEffect(() => {
    if (user) {
        socket.emit('register', user._id)

        const handleBan = () => setUser(prev => ({ ...prev, isBanned: true }))
        const handleUnban = () => setUser(prev => ({ ...prev, isBanned: false }))
        
        const handleAccountDeleted = () => {
            localStorage.removeItem('token')
            setUser(null)
            navigate('/')
        }

        socket.on('account_banned', handleBan)
        socket.on('account_unbanned', handleUnban)
        socket.on('account_deleted', handleAccountDeleted)

        return () => {
            socket.off('account_banned', handleBan)
            socket.off('account_unbanned', handleUnban)
            socket.off('account_deleted', handleAccountDeleted)
        }
    }
  }, [user, navigate])

  const handleAddCourse = async (formData) => {
    const newCourse = await courseService.create(formData)
    if (newCourse && !newCourse.instructor?.username) {
        newCourse.instructor = { _id: user._id, username: user.username, email: user.email }
    }
    setCourses([newCourse, ...courses])
    navigate('/courses')
  }

  const handleDeleteCourse = async (courseId) => {
      await courseService.deleteCourse(courseId)
      setCourses(courses.filter(c => c._id !== courseId))
      navigate('/courses')
  }

  const handleUpdateCourse = async (courseId, formData) => {
      const updatedCourse = await courseService.updateCourse(courseId, formData)
      if (updatedCourse && !updatedCourse.instructor?.username) {
          updatedCourse.instructor = { _id: user._id, username: user.username, email: user.email }
      }
      setCourses(courses.map(c => c._id === courseId ? updatedCourse : c))
      navigate(`/courses/${courseId}`)
  }

  const handleSignOut = () => {
      localStorage.removeItem('token')
      setUser(null)
      navigate('/')
  }
  
  if (user?.isBanned) {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 font-sans relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="bg-gray-800 border border-red-900/50 p-10 md:p-16 rounded-3xl shadow-2xl text-center max-w-lg w-full relative z-10 animate-fade-in-down">
                  <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 border border-red-500/50">
                      🚫
                  </div>
                  <h1 className="text-3xl font-extrabold text-white mb-3 tracking-wide">Account Suspended</h1>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                      Your account has been restricted by the administration. You can no longer access the platform features.
                  </p>
                  <button 
                      onClick={handleSignOut}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-red-600/20"
                  >
                      Sign Out
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div>
      <Nav user={user} setUser={setUser} socket={socket} />
      <main className="app-main">
      <Routes>
        <Route path='/' element={user ? <Dashboard user={user} socket={socket} /> : <Landing />} />
        {user ? (
          <>
            <Route path='/courses' element={<CourseList courses={courses} />} />
            <Route path='/courses/:courseId' element={<CourseDetails user={user} handleDeleteCourse={handleDeleteCourse} />} />
            <Route path='/profile' element={<Profile user={user} setUser={setUser} />} />
            <Route path='/messages' element={<Chat user={user} socket={socket} />} />

            {['Admin', 'Instructor'].includes(user.role) && (
              <>
                <Route path='/courses/new' element={<CourseForm handleAddCourse={handleAddCourse} />} />
                <Route path='/courses/:courseId/edit' element={<CourseForm handleAddCourse={handleAddCourse} handleUpdateCourse={handleUpdateCourse} courses={courses} />} />
              </>
            )}

            <Route path='*' element={
                <div className="min-h-[calc(100vh-85px)] bg-gray-900 flex flex-col items-center justify-center px-4 font-sans">
                    <div className="text-8xl mb-6 opacity-80">🚧</div>
                    <h1 className="text-4xl font-extrabold text-white mb-4">Access Denied</h1>
                    <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
                        The page you are looking for does not exist, or you do not have permission to view it.
                    </p>
                    <Link to="/" className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white font-bold py-3 px-8 rounded-xl transition-all">
                        Go Back Home
                    </Link>
                </div>
            } />
          </>
        ) : (
          <>
            <Route path='/sign-up' element={<SignUpForm setUser={setUser} />} />
            <Route path='/sign-in' element={<SignInForm setUser={setUser} />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/reset-password/:id/:token' element={<ResetPassword />} />
            <Route path='*' element={
                <div className="min-h-[calc(100vh-85px)] bg-gray-900 flex flex-col items-center justify-center px-4 font-sans">
                    <div className="text-8xl mb-6 opacity-80">🔒</div>
                    <h1 className="text-4xl font-extrabold text-white mb-4">Sign In Required</h1>
                    <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
                        You must be signed in to access this area.
                    </p>
                    <Link to="/sign-in" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-red-600/20">
                        Sign In Now
                    </Link>
                </div>
            } />
          </>
        )}
      </Routes>
      </main>
    </div>
  )
}
export default App