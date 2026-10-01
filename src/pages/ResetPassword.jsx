import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import * as authService from '../services/auth';

const ResetPassword = () => {
    const { id, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setMessage({ type: 'error', text: 'Passwords do not match.' });
        }
        if (password.length < 6) {
            return setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
        }

        setIsLoading(true);
        try {
            const res = await authService.resetPassword(id, token, password);
            if (res.err || res.error) {
                setMessage({ type: 'error', text: res.err || res.error });
            } else {
                setMessage({ type: 'success', text: res.message || 'Password reset successfully!' });
                setIsSuccess(true);
                setTimeout(() => navigate('/sign-in'), 3000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-fade-in-down">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-blue-500/30">
                        🛡️
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
                    <p className="text-gray-400 text-sm">Please enter your new password below.</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg text-sm font-bold text-center border ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                        {message.text}
                    </div>
                )}

                {!isSuccess ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2">New Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2">Confirm New Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                                className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className={`w-full font-bold py-3 rounded-lg transition-all mt-2 text-white ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
                        >
                            {isLoading ? 'Resetting... ⏳' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center mt-4">
                        <p className="text-gray-400 mb-6">Redirecting to Sign In page...</p>
                        <Link to="/sign-in" className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors border border-gray-600">
                            Go to Sign In Now
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
};

export default ResetPassword;