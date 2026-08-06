import Nav from "./components/Nav"
import SignUpForm from "./pages/SignUpForm"
import './App.css'
import { Routes, Route, useNavigate } from "react-router"
import { useState, useEffect } from "react"
import SignInForm from "./pages/SignInForm"
import Landing from "./pages/Landing"
import Dashboard from "./pages/Dashboard"
import HootList from "./pages/HootList"
import * as hootService from './services/hoots'
import HootDetails from "./pages/HootDetails"
import HootForm from "./pages/HootForm"
import CommentForm from "./components/CommentForm"

const getUserFromToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  return JSON.parse(atob(token.split('.')[1])).payload
}

const App = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState(getUserFromToken())
  const [hoots, setHoots] = useState([])

  useEffect(() => {
    const fetchAllHoots = async () => {
      const hootsData = await hootService.index()
      setHoots(hootsData)
    }
    if (user) fetchAllHoots()
  }, [user])

  const handleAddHoot = async (formData) => {
    const newHoot = await hootService.create(formData)
    setHoots([newHoot, ...hoots])
    navigate('/hoots')
  }

  const handleDeleteHoot = async (hootId) => {
    const deletedHoot = await hootService.deleteHoot(hootId)
    setHoots(hoots.filter((hoot) => hoot._id !== hootId))
    navigate('/hoots')
  }

  const handleUpdateHoot = async (hootId, formData) => {
    const updatedHoot = await hootService.update(hootId, formData)
    const updatedHootsList = hoots.map((hoot) => {
      return hootId === hoot._id ? updatedHoot : hoot
    })
    setHoots(updatedHootsList)
    navigate(`/hoots/${hootId}`)
  }
  
  return (
    <div>
      <Nav user={user} setUser={setUser} />
      <main className="app-main">
      <Routes>
        <Route path='/' element={user ? <Dashboard user={user} /> : <Landing />} />
        {user ? (
          <>
            <Route path='/hoots' element={<HootList hoots={hoots} />} />
            <Route path='/hoots/:hootId' element={<HootDetails user={user} handleDeleteHoot={handleDeleteHoot} />} />
            <Route path='/hoots/new' element={<HootForm handleAddHoot={handleAddHoot} />} />
            <Route path='/hoots/:hootId/edit' element={<HootForm handleUpdateHoot={handleUpdateHoot} />} />
            <Route path='/hoots/:hootId/comments/:commentId/edit' element={<CommentForm />} />

          </>
        ) : (
          <>
            <Route path='/sign-up' element={<SignUpForm setUser={setUser} />} />
            <Route path='/sign-in' element={<SignInForm setUser={setUser} />} />
          </>
        )}
      </Routes>
      </main>
    </div>
  )
}

export default App