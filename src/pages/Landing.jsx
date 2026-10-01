import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import * as courseService from '../services/courses';

const Landing = () => {
    const [trialLessons, setTrialLessons] = useState([]);
    const navigate = useNavigate();
    const carouselRef = useRef(null);

    useEffect(() => {
        const fetchTrials = async () => {
            try {
                const data = await courseService.getTrialLessons();
                if (!data.error) setTrialLessons(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTrials();
    }, []);

    const scroll = (direction) => {
        if (carouselRef.current) {
            const { current } = carouselRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth + 60 : current.offsetWidth - 60;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 text-white font-sans flex flex-col relative overflow-hidden">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

            <div className={`flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 relative z-10 py-12 md:py-16 ${trialLessons.length === 0 ? 'my-auto' : ''}`}>
                <img 
                    src="/Landing.png" 
                    alt="Hussain Ali Networking" 
                    className="w-full max-w-[85%] md:max-w-3xl lg:max-w-4xl object-contain mb-8 md:mb-12 drop-shadow-[0_20px_50px_rgba(220,38,38,0.15)] mx-auto block hover:scale-105 transition-transform duration-700"
                />
                
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-center">
                    <span className="text-white">Master The Art Of </span>
                    <span className="text-red-600">Networking</span>
                </h1>
                
                <p className="text-gray-400 text-sm md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed text-center px-2">
                    Unlock your networking potential with hands-on labs, routing, switching, firewalls, and VPNs through real-world scenarios. Create your IT career today.
                </p>
                
                <div className="flex gap-4 justify-center flex-wrap">
                    <Link to="/sign-up" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-red-600/30 transition-all transform hover:-translate-y-1">
                        Get Started Now
                    </Link>
                    <Link to="/sign-in" className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 font-bold py-3.5 px-8 rounded-full transition-all transform hover:-translate-y-1 shadow-md">
                        Sign In
                    </Link>
                </div>
            </div>

            {trialLessons.length > 0 && (
                <div className="w-full max-w-6xl mx-auto flex flex-col items-center relative z-10 pb-20">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-orange-500 text-3xl">🎁</span>
                        <h2 className="text-3xl font-extrabold text-white">Try for Free</h2>
                    </div>
                    <p className="text-gray-400 text-sm mb-10 text-center max-w-lg px-4">
                        Preview our premium content. Create a free account to watch these lessons and decide if this learning path is right for you.
                    </p>
                    
                    <div className="relative w-full">
                        <button 
                            onClick={() => scroll('left')} 
                            className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-900/90 text-red-500 w-10 h-14 flex items-center justify-center rounded-r-xl shadow-[4px_0_15px_rgba(0,0,0,0.6)] border border-l-0 border-gray-600 focus:outline-none"
                        >
                            ❮
                        </button>
                        
                        <button 
                            onClick={() => scroll('right')} 
                            className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gray-900/90 text-red-500 w-10 h-14 flex items-center justify-center rounded-l-xl shadow-[-4px_0_15px_rgba(0,0,0,0.6)] border border-r-0 border-gray-600 focus:outline-none"
                        >
                            ❯
                        </button>

                        <div 
                            ref={carouselRef} 
                            className="flex overflow-x-auto py-4 gap-6 px-12 md:px-6 md:grid md:grid-cols-2 lg:grid-cols-3 snap-x snap-mandatory hide-scrollbar w-full scroll-smooth"
                        >
                            {trialLessons.map((lesson, idx) => (
                                <div key={idx} className="min-w-[80vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl hover:border-red-500 transition-all duration-300 flex flex-col group hover:-translate-y-1">
                                    <div className="h-48 bg-gray-900 relative overflow-hidden flex items-center justify-center">
                                        {lesson.coverImage ? (
                                            <img src={lesson.coverImage} alt={lesson.courseTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" />
                                        ) : (
                                            <div className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-500">📘</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
                                        
                                        <div className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                                            <span>▶</span> Free Trial
                                        </div>
                                        
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button 
                                                onClick={() => navigate('/sign-in')}
                                                className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] transform scale-90 group-hover:scale-100 transition-all"
                                            >
                                                <span className="ml-1 text-xl">▶</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-white line-clamp-1 mb-1 group-hover:text-red-400 transition-colors">
                                                {lesson.lessonTitle}
                                            </h3>
                                            <p className="text-gray-400 text-xs truncate">
                                                Course: <span className="text-gray-300 font-semibold">{lesson.courseTitle}</span>
                                            </p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => navigate('/sign-in')}
                                            className="mt-auto w-full bg-gray-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-600 hover:border-red-500 shadow-sm"
                                        >
                                            🔒 Sign In to Watch
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Landing;