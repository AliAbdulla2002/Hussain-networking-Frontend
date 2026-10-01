import { useState } from 'react';
import { Link } from 'react-router';
import * as authService from '../services/auth';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await authService.forgotPassword(email);
            if (res.err || res.error) {
                setMessage({ type: 'error', text: res.err || res.error });
            } else {
                setMessage({ type: 'success', text: res.message || 'Check your email for the reset link!' });
                setEmail('');
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
                    <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-red-500/30">
                        🔑
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                    <p className="text-gray-400 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg text-sm font-bold text-center border ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full font-bold py-3 rounded-lg transition-all mt-2 text-white ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'}`}
                    >
                        {isLoading ? 'Sending... ⏳' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-700 pt-6">
                    <Link to="/sign-in" className="text-gray-400 hover:text-white transition-colors text-sm font-bold flex items-center justify-center gap-2">
                        <span>🔙</span> Back to Sign In
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default ForgotPassword;