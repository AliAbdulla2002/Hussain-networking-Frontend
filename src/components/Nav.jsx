import { Link, useNavigate, useLocation } from "react-router";
import { useState, useEffect, useRef } from "react";
import * as notifService from "../services/notifications";

const Nav = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    const actualRole = props.user?.actualRole || props.user?.role;
    const canToggleView = ['Admin', 'Instructor'].includes(actualRole);
    const isStaff = ['Admin', 'Instructor'].includes(props.user?.role);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        props.setUser(null);
        navigate('/');
    };

    useEffect(() => {
        if (props.user) {
            const fetchNotifs = async () => {
                const data = await notifService.getNotifications();
                if (!data.error) setNotifications(data);
            };
            fetchNotifs();
            
            props.socket?.on('new_notification', (notif) => {
                setNotifications(prev => [notif, ...prev]);
            });

            props.socket?.on('role_updated', () => {
                localStorage.removeItem('token');
                window.location.href = '/sign-in';
            });
        }
        return () => {
            props.socket?.off('new_notification');
            props.socket?.off('role_updated');
        }
    }, [props.user, props.socket]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleViewMode = () => {
        props.setUser(prev => ({
            ...prev,
            actualRole: prev.actualRole || prev.role,
            role: ['Admin', 'Instructor'].includes(prev.role) ? 'User' : (prev.actualRole || 'Admin')
        }));
        navigate('/');
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const toggleNotifications = () => {
        const willShow = !showDropdown;
        setShowDropdown(willShow);
        
        if (willShow && unreadCount > 0) {
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            notifService.markAllAsRead();
        }
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        setNotifications([]);
        notifService.clearAll();
    };

    const handleNotificationClick = (notif) => {
        setShowDropdown(false);
        setIsMobileMenuOpen(false);
        navigate(notif.link);
    };

    const isHomeActive = location.pathname === '/';
    const isCoursesActive = location.pathname === '/courses' || (location.pathname.startsWith('/courses/') && location.pathname !== '/courses/new');
    const isMessagesActive = location.pathname.startsWith('/messages');
    const isNewCourseActive = location.pathname === '/courses/new';

    return (
        <nav className="bg-gray-900 px-4 md:px-8 py-2 flex justify-between items-center relative z-50 border-b border-gray-800 shadow-lg h-[85px]">
            <div className="flex items-center gap-10">
                <Link className="flex items-center" to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <img src="/Dark_logo.png" alt="Logo" className="h-[60px] md:h-[90px] object-contain mix-blend-lighten hover:opacity-90 transition-opacity" />
                </Link>

                {props.user && (
                    <ul className="hidden lg:flex items-center gap-8 m-0 p-0 list-none">
                        <li>
                            <Link to='/' className={`font-bold tracking-wide transition-all hover:text-red-400 ${isHomeActive ? 'text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]' : 'text-slate-200'}`}>
                                {isStaff ? 'DASHBOARD' : 'HOME'}
                            </Link>
                        </li>
                        <li>
                            <Link to='/courses' className={`font-bold tracking-wide transition-all hover:text-red-400 ${isCoursesActive ? 'text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]' : 'text-slate-200'}`}>
                                COURSES
                            </Link>
                        </li>
                        <li>
                            <Link to='/messages' className={`font-bold tracking-wide transition-all hover:text-red-400 ${isMessagesActive ? 'text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]' : 'text-slate-200'}`}>
                                MESSAGES
                            </Link>
                        </li>
                        {isStaff && (
                            <li>
                                <Link to='/courses/new' className={`font-bold tracking-wide transition-all hover:text-red-400 ${isNewCourseActive ? 'text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]' : 'text-slate-200'}`}>
                                    NEW COURSE
                                </Link>
                            </li>
                        )}
                    </ul>
                )}
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                {props.user ? (
                    <>
                        {canToggleView && (
                            <button 
                                onClick={toggleViewMode}
                                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-all shadow-md ${isStaff ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-600 hover:text-white'}`}
                            >
                                {isStaff ? '👀 Student View' : '⚙️ Admin View'}
                            </button>
                        )}

                        <div className="relative flex items-center" ref={dropdownRef}>
                            <button 
                                onClick={toggleNotifications} 
                                className={`relative text-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${showDropdown ? 'text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'text-gray-400 hover:text-red-400'}`}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md border-2 border-gray-900">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showDropdown && (
                                <div className="absolute right-[-60px] sm:right-0 top-12 mt-2 w-[300px] sm:w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-down">
                                    <div className="p-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                                        <h3 className="text-white font-bold text-sm">Notifications</h3>
                                        {notifications.length > 0 && (
                                            <button 
                                                onClick={handleClearAll} 
                                                className="text-xs bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 font-bold px-3 py-1 rounded transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif, idx) => (
                                                <div 
                                                    key={notif._id || idx} 
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`p-4 border-b border-gray-700 cursor-pointer transition-colors flex gap-3 items-start ${!notif.isRead ? 'bg-gray-750 hover:bg-gray-700' : 'opacity-70 hover:opacity-100 hover:bg-gray-700/50'}`}
                                                >
                                                    <span className="text-xl mt-1">{notif.type === 'message' ? '💬' : '📚'}</span>
                                                    <div className="flex flex-col gap-1">
                                                        <p className={`text-sm ${!notif.isRead ? 'text-white font-bold' : 'text-gray-300'}`}>{notif.content}</p>
                                                        <span className="text-xs text-red-500 font-semibold">{!notif.isRead ? 'New' : ''}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                                                <span className="text-4xl opacity-50">📭</span>
                                                <p className="text-sm italic">All caught up!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="hidden lg:block w-px h-8 bg-gray-700"></div>

                        <Link to="/profile" className="hidden lg:flex items-center gap-3 text-gray-400 hover:text-white transition-all cursor-pointer group">
                            {props.user.avatar ? (
                                <img src={props.user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-gray-600 group-hover:border-red-500 transition-colors" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg border border-gray-600 group-hover:border-red-500 transition-colors">👤</div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Welcome,</span>
                                <span className={`font-bold tracking-wide transition-colors ${location.pathname === '/profile' ? 'text-red-500' : 'text-white'}`}>
                                    {props.user.username || props.user.email?.split('@')[0]}
                                </span>
                            </div>
                        </Link>
                        
                        <button onClick={handleSignOut} className="hidden lg:block ml-2 text-sm text-gray-400 font-bold hover:text-red-500 transition-colors bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-700">
                            Sign Out
                        </button>

                        <button 
                            className="lg:hidden text-white text-2xl focus:outline-none"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? '✖' : '☰'}
                        </button>
                    </>
                ) : (
                    <ul className="flex items-center gap-4 md:gap-8 m-0 p-0 list-none">
                        <li className="hidden sm:block"><Link to='/' className="text-slate-200 font-bold text-base hover:text-red-400 transition-colors">Home</Link></li>
                        <li className="hidden sm:block"><Link to='/sign-up' className="text-slate-200 font-bold text-base hover:text-red-400 transition-colors">Sign Up</Link></li>
                        <li>
                            <Link to='/sign-in' className="bg-red-600 text-white px-4 md:px-6 py-2 rounded-md font-bold text-sm md:text-lg shadow-md shadow-red-600/30 hover:bg-red-700 transition-all transform hover:scale-105 inline-block">
                                Sign In
                            </Link>
                        </li>
                    </ul>
                )}
            </div>

            {props.user && isMobileMenuOpen && (
                <div className="absolute top-[85px] left-0 w-full bg-gray-900 border-b border-gray-800 shadow-2xl flex flex-col p-4 gap-4 z-40 lg:hidden animate-fade-in-down">
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-white bg-gray-800 p-4 rounded-xl border border-gray-700">
                        {props.user.avatar ? (
                            <img src={props.user.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-gray-600" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl border-2 border-gray-600">👤</div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400">Welcome,</span>
                            <span className="font-bold">{props.user.username || props.user.email?.split('@')[0]}</span>
                        </div>
                    </Link>

                    {canToggleView && (
                        <button 
                            onClick={() => { toggleViewMode(); setIsMobileMenuOpen(false); }}
                            className={`w-full py-3 rounded-xl border text-sm font-bold transition-all shadow-md ${isStaff ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-green-500/10 border-green-500/50 text-green-400'}`}
                        >
                            {isStaff ? '👀 Switch to Student View' : '⚙️ Switch to Admin View'}
                        </button>
                    )}

                    <div className="flex flex-col gap-2">
                        <Link to='/' onClick={() => setIsMobileMenuOpen(false)} className={`p-4 rounded-xl font-bold ${isHomeActive ? 'bg-red-600/10 text-red-500 border border-red-500/30' : 'bg-gray-800 text-white border border-gray-700'}`}>
                            {isStaff ? 'Dashboard' : 'Home'}
                        </Link>
                        <Link to='/courses' onClick={() => setIsMobileMenuOpen(false)} className={`p-4 rounded-xl font-bold ${isCoursesActive ? 'bg-red-600/10 text-red-500 border border-red-500/30' : 'bg-gray-800 text-white border border-gray-700'}`}>
                            Courses
                        </Link>
                        <Link to='/messages' onClick={() => setIsMobileMenuOpen(false)} className={`p-4 rounded-xl font-bold flex justify-between items-center ${isMessagesActive ? 'bg-red-600/10 text-red-500 border border-red-500/30' : 'bg-gray-800 text-white border border-gray-700'}`}>
                            Messages
                            {unreadCount > 0 && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">{unreadCount} New</span>}
                        </Link>
                        {isStaff && (
                            <Link to='/courses/new' onClick={() => setIsMobileMenuOpen(false)} className={`p-4 rounded-xl font-bold ${isNewCourseActive ? 'bg-red-600/10 text-red-500 border border-red-500/30' : 'bg-gray-800 text-white border border-gray-700'}`}>
                                New Course
                            </Link>
                        )}
                    </div>

                    <button onClick={handleSignOut} className="mt-2 p-4 w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold rounded-xl transition-colors border border-red-500/30">
                        Sign Out
                    </button>
                </div>
            )}
        </nav>
    );
}
export default Nav;