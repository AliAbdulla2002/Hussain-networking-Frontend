import { useNavigate, Link } from "react-router"
import { useState } from "react"
import { signIn } from "../services/auth"

const SignInForm = (props) => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [message, setMessage] = useState('')

    const handleChange = (event) => {
        setMessage('')
        setFormData({...formData, [event.target.name]: event.target.value})
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        try {
            const response = await signIn(formData)
            
            if (!response || response.error || response.message) {
                setMessage(response?.error || response?.message || 'Invalid credentials.')
                return 
            }
            
            props.setUser(response)
            navigate('/')
        } catch(err) {
            setMessage(err.message || 'Invalid credentials.')
        }
    }

    return(
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 flex items-center justify-center p-4">
            
            <section className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
                
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-white">Welcome Back</h1>
                    <p className="text-gray-400 mt-2">Sign in to access your networking labs</p>
                    
                    {message && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm font-bold">
                            {message}
                        </div>
                    )}
                </header>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Email or Username</label>
                        <input 
                            type="text" 
                            name="email" 
                            value={formData.email} 
                            required 
                            onChange={handleChange} 
                            placeholder="student@academy.com"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            required 
                            onChange={handleChange} 
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        />
                        <Link to="/forgot-password" className="text-xs text-red-500 hover:text-white transition-colors float-right mt-2 font-bold">
                            Forgot Password?
                        </Link>
                    </div>
                    
                    <div className="flex gap-4 mt-6">
                        <button 
                            type="submit"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-red-600/30 transition-all"
                        >
                            Sign In
                        </button>
                        <button 
                            type="button" 
                            onClick={() => navigate('/')}
                            className="flex-1 bg-transparent border-2 border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300 hover:text-white font-bold py-3 px-4 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </section>
        </main>
    )
}
export default SignInForm