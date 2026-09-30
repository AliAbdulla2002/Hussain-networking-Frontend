import { useState } from "react"
import { signUp } from "../services/auth"
import { useNavigate } from "react-router"

const SignUpForm = (props) => {
    const navigate = useNavigate()

    const initialState = {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    }

    const [formData, setFormData] = useState(initialState)
    const [message, setMessage] = useState('')

    const handleChange = (event) => {
        setFormData({...formData, [event.target.name]: event.target.value})
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        try {
            const newUser = await signUp(formData)
            props.setUser(newUser)
            setFormData(initialState)
            navigate('/')
        } catch (err) {
            setMessage(err.message)
        }
    }

    const isFormValid = () => {
        return (formData.username && formData.email && formData.password && formData.password === formData.confirmPassword)
    }

    return (
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 flex items-center justify-center p-4">
            <section className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
                    <p className="text-gray-400 mt-2">Start your networking journey today</p>
                    
                    {message && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm font-bold">
                            {message}
                        </div>
                    )}
                </header>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Username</label>
                        <input 
                            type="text" 
                            name="username" 
                            onChange={handleChange} 
                            value={formData.username} 
                            required 
                            placeholder="NetworkNinja"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Email Address</label>
                        <input 
                            type="email" 
                            name="email" 
                            onChange={handleChange} 
                            value={formData.email} 
                            required 
                            placeholder="student@academy.com"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            onChange={handleChange} 
                            value={formData.password} 
                            required 
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Confirm Password</label>
                        <input 
                            type="password" 
                            name="confirmPassword" 
                            onChange={handleChange} 
                            value={formData.confirmPassword} 
                            required 
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        />
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                        <button 
                            type="submit" 
                            disabled={!isFormValid()}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-red-600/30 transition-all"
                        >
                            Sign Up
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

export default SignUpForm