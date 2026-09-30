import { useState, useEffect } from 'react'
import * as userService from '../services/userService'

const Profile = (props) => {
    const [profile, setProfile] = useState(null)
    const [bio, setBio] = useState('')
    const [avatar, setAvatar] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [message, setMessage] = useState('')

    useEffect(() => {
        const fetchProfile = async () => {
            const data = await userService.getProfile()
            setProfile(data)
            setBio(data.bio || '')
        }
        fetchProfile()
    }, [])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setAvatar(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage('Updating profile...')
        
        try {
            const formData = new FormData()
            formData.append('bio', bio)
            if (avatar) {
                formData.append('avatar', avatar)
            }

            const data = await userService.updateProfile(formData)
            
            if (data.token) {
                localStorage.setItem('token', data.token)
                const payload = JSON.parse(atob(data.token.split('.')[1])).payload
                props.setUser(payload)
            }

            setProfile(data.user || data)
            setMessage('Profile updated successfully!')
        } catch (error) {
            setMessage(error.message || 'Network error. Could not reach the server.')
        }
    }

    if (!profile) return (
        <div className="min-h-[calc(100vh-85px)] bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
    )

    return (
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 flex justify-center py-12 px-4">
            <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
                
                <header className="flex flex-col items-center mb-8">
                    <div className="relative inline-block group cursor-pointer mb-4">
                        <label htmlFor="avatar-upload" className="cursor-pointer block relative rounded-full overflow-hidden border-4 border-gray-700 group-hover:border-red-500 transition-colors duration-300">
                            {previewUrl || profile.avatar ? (
                                <img 
                                    src={previewUrl || profile.avatar} 
                                    alt="Profile Avatar" 
                                    className="w-36 h-36 object-cover" 
                                />
                            ) : (
                                <div className="w-36 h-36 bg-gray-700 flex items-center justify-center text-5xl">
                                    👤
                                </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-white text-sm font-bold tracking-wide">📷 Upload</span>
                            </div>
                        </label>
                        
                        <input 
                            id="avatar-upload" 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="hidden" 
                        />
                    </div>
                    
                    <h2 className="text-2xl font-extrabold text-white">{profile?.username || profile?.email?.split('@')[0]}</h2>
                    <p className="text-gray-400 mt-1">
                        Role: <strong className={profile?.role === 'Admin' ? 'text-red-500' : 'text-green-500'}>{profile?.role}</strong>
                    </p>
                </header>

                {message && (
                    <div className={`mb-6 px-4 py-3 rounded-lg text-center font-bold ${message.includes('successfully') ? 'bg-green-500/10 border border-green-500/50 text-green-500' : 'bg-red-500/10 border border-red-500/50 text-red-500'}`}>
                        {message}
                    </div>
                )}

                <section className="mb-10">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Bio (About Me):</label>
                            <textarea 
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)} 
                                rows="4" 
                                placeholder="I am a network engineering student interested in..."
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all resize-none"
                            ></textarea>
                        </div>
                        <button 
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-red-600/30 transition-all self-end"
                        >
                            Save Changes
                        </button>
                    </form>
                </section>

                {profile?.role === 'User' && (
                    <section className="border-t border-gray-700 pt-8">
                        <h3 className="text-xl font-bold text-white mb-6">My Certificates 🎓</h3>
                        {profile.certificates && profile.certificates.length > 0 ? (
                            <div className="grid gap-4">
                                {profile.certificates.map((cert) => (
                                    <div key={cert._id} className="bg-gray-700/50 border-l-4 border-red-600 p-5 rounded-r-lg">
                                        <h4 className="text-lg font-bold text-white mb-1">
                                            Course: {cert.course?.title || 'Unknown Course'}
                                        </h4>
                                        <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-400">
                                            <p>Issued: <span className="text-gray-300 font-semibold">{new Date(cert.issueDate).toLocaleDateString()}</span></p>
                                            <p>Ref ID: <strong className="text-red-400 tracking-wider">{cert.certificateId}</strong></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-gray-700/30 border border-gray-600 border-dashed rounded-lg">
                                <p className="text-gray-400">You haven't earned any certificates yet. Complete a course to get one!</p>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    )
}

export default Profile