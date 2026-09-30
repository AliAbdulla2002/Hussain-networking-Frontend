import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import * as courseService from '../services/courses';
import * as adminService from '../services/admin';

const Dashboard = ({ user, socket }) => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [adminStats, setAdminStats] = useState({ totalStudents: 0, totalInstructors: 0, totalCourses: 0, totalEnrollments: 0 });
    const [onlineCount, setOnlineCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');

    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showAssignRolesModal, setShowAssignRolesModal] = useState(false);
    const [studentsList, setStudentsList] = useState([]);
    const [modalFilter, setModalFilter] = useState('all');
    const [studentToDelete, setStudentToDelete] = useState(null);

    const [showCoursesModal, setShowCoursesModal] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [courseToDelete, setCourseToDelete] = useState(null);

    const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
    const [enrollmentsList, setEnrollmentsList] = useState([]);

    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedRoleForPerms, setSelectedRoleForPerms] = useState('Instructor');
    
    const [rolePermissions, setRolePermissions] = useState({
        Instructor: { canCreateCourse: true, canBanStudents: false, canRemoveStudents: true }
    });

    const isStaff = ['Admin', 'Instructor'].includes(user.role);
    const isSuperAdmin = user.role === 'Admin';
    const isInstructor = user.role === 'Instructor';

    const instructorPerms = rolePermissions.Instructor || {};
    const canCreate = isSuperAdmin || (isInstructor && instructorPerms.canCreateCourse);
    const canBan = isSuperAdmin || (isInstructor && instructorPerms.canBanStudents);
    const canRemove = isSuperAdmin || (isInstructor && instructorPerms.canRemoveStudents);

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 4000);
    }

    const fetchAdminStats = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACK_END_SERVER_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAdminStats(data);
                setOnlineCount(data.onlineCount || 0);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                if (user.role === 'User') {
                    const courses = await courseService.index();
                    if (courses && !courses.error && Array.isArray(courses)) {
                        setAllCourses(courses);
                        const myCourses = courses.filter(c => 
                            c.students && c.students.some(s => s === user._id || s._id === user._id)
                        );
                        setEnrolledCourses(myCourses);
                    }
                } else if (isStaff) {
                    await fetchAdminStats();
                    const perms = await adminService.getPermissions();
                    if (perms && !perms.error) setRolePermissions(perms);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadDashboardData();
    }, [user]);

    useEffect(() => {
        if (isStaff && socket) {
            socket.on('online_users_update', (count) => {
                setOnlineCount(count);
            });
            socket.on('permissions_updated', (newPerms) => {
                setRolePermissions(newPerms);
            });
            return () => {
                socket.off('online_users_update');
                socket.off('permissions_updated');
            }
        }
    }, [socket, user]);

    const openUsersModal = async (filter) => {
        setModalFilter(filter);
        setShowUsersModal(true);
        const data = await adminService.getStudents();
        if (!data.error) {
            if (filter === 'online') setStudentsList(data.filter(s => s.isOnline && s.role === 'User'));
            else if (filter === 'instructors') setStudentsList(data.filter(s => s.role === 'Instructor'));
            else if (filter === 'students') setStudentsList(data.filter(s => s.role === 'User'));
            else setStudentsList(data);
        }
    };

    const openAssignRolesModal = async () => {
        setShowAssignRolesModal(true);
        const data = await adminService.getStudents();
        if (!data.error) setStudentsList(data);
    };

    const handleRoleChange = async (studentId, newRole) => {
        setStudentsList(prev => prev.map(s => s._id === studentId ? { ...s, role: newRole } : s));
        try {
            const res = await adminService.updateRole(studentId, newRole);
            if (!res.error) {
                showSuccess(`Role successfully updated to ${newRole}`);
                fetchAdminStats();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBanToggle = async (studentId) => {
        if (!canBan) return;
        setStudentsList(prev => prev.map(s => 
            s._id === studentId ? { ...s, isBanned: !s.isBanned } : s
        ));
        try {
            await adminService.toggleBan(studentId);
            showSuccess('User ban status updated.');
        } catch (error) {
            console.error(error);
        }
    };

    const confirmDeleteStudent = async () => {
        if (!studentToDelete || !isSuperAdmin) return;
        const idToDelete = studentToDelete;
        setStudentToDelete(null);
        setStudentsList(prev => prev.filter(s => s._id !== idToDelete));
        
        try {
            await adminService.deleteStudent(idToDelete);
            await fetchAdminStats();
            showSuccess('User deleted successfully.');
        } catch (error) {
            console.error(error);
        }
    };

    const openCoursesModal = async () => {
        setShowCoursesModal(true);
        const data = await courseService.index();
        if (!data.error) {
            setAllCourses(data);
        }
    };

    const confirmDeleteCourse = async () => {
        if (!courseToDelete) return;
        const idToDelete = courseToDelete;
        setCourseToDelete(null);
        setAllCourses(prev => prev.filter(c => c._id !== idToDelete));
        
        try {
            await courseService.deleteCourse(idToDelete);
            await fetchAdminStats();
            showSuccess('Course deleted successfully.');
        } catch (error) {
            console.error(error);
        }
    };

    const openEnrollmentsModal = async () => {
        setShowEnrollmentsModal(true);
        const data = await courseService.index();
        if (!data.error) {
            const extractedEnrollments = [];
            data.forEach(course => {
                if (course.students && course.students.length > 0) {
                    course.students.forEach(student => {
                        extractedEnrollments.push({
                            id: `${course._id}-${student._id || student}`,
                            courseId: course._id,
                            studentId: student._id || student,
                            studentName: student.username || student.email?.split('@')[0] || 'Unknown Student',
                            studentEmail: student.email || '',
                            courseTitle: course.title || 'Untitled Course',
                            instructorName: course.instructor?.username || course.instructor?.email?.split('@')[0] || 'Platform Instructor'
                        });
                    });
                }
            });
            setEnrollmentsList(extractedEnrollments);
        }
    };

    const handleRemoveEnrollment = async (courseId, studentId) => {
        if (!canRemove) return;
        
        setEnrollmentsList(prev => prev.filter(e => !(e.courseId === courseId && e.studentId === studentId)));
        
        try {
            const res = await courseService.unenroll(courseId, studentId);
            if (!res.error) {
                showSuccess('Student removed from the course successfully.');
                fetchAdminStats();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handlePermissionToggle = async (perm) => {
        const newPerms = { 
            ...rolePermissions, 
            [selectedRoleForPerms]: {
                ...rolePermissions[selectedRoleForPerms],
                [perm]: !rolePermissions[selectedRoleForPerms][perm]
            }
        };
        setRolePermissions(newPerms); 
        await adminService.updatePermissions(newPerms); 
        showSuccess('Permissions saved & synced globally.');
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-85px)] bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    const userName = user.username || user.email.split('@')[0];

    if (isStaff) {
        return (
            <main className="min-h-[calc(100vh-85px)] bg-gray-900 py-10 px-6 sm:px-12 font-sans relative">
                
                {successMessage && (
                    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-4 rounded-xl shadow-2xl font-bold animate-fade-in-down flex items-center gap-3 border-2 border-white/20">
                        <span className="text-xl">✅</span> {successMessage}
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
                            {isSuperAdmin ? 'Admin Dashboard ⚙️' : 'Instructor Dashboard 👨‍🏫'}
                        </h1>
                        <p className="text-gray-400">Welcome back, {userName}. Here is what's happening on your platform today.</p>
                    </header>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6 mb-12`}>
                        <div 
                            onClick={() => openUsersModal('online')}
                            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center gap-5 relative overflow-hidden cursor-pointer hover:bg-gray-750 hover:border-gray-500 transition-all group"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/20 transition-colors"></div>
                            <div className="relative">
                                <div className="w-14 h-14 bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center">
                                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors whitespace-nowrap">Online Now</p>
                                <h3 className="text-3xl font-extrabold text-white">{onlineCount}</h3>
                            </div>
                        </div>

                        <div 
                            onClick={() => openUsersModal('students')}
                            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center gap-5 cursor-pointer hover:bg-gray-750 hover:border-gray-500 transition-all group"
                        >
                            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">👥</div>
                            <div>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors whitespace-nowrap">{isSuperAdmin ? 'Total Students' : 'My Students'}</p>
                                <h3 className="text-3xl font-extrabold text-white">{adminStats.totalStudents || 0}</h3>
                            </div>
                        </div>

                        {isSuperAdmin && (
                            <div 
                                onClick={() => openUsersModal('instructors')}
                                className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center gap-5 cursor-pointer hover:bg-gray-750 hover:border-gray-500 transition-all group"
                            >
                                <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">👨‍🏫</div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors whitespace-nowrap">Instructors</p>
                                    <h3 className="text-3xl font-extrabold text-white">{adminStats.totalInstructors || 0}</h3>
                                </div>
                            </div>
                        )}
                        
                        <div 
                            onClick={openCoursesModal}
                            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center gap-5 cursor-pointer hover:bg-gray-750 hover:border-gray-500 transition-all group"
                        >
                            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📚</div>
                            <div>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors whitespace-nowrap">{isSuperAdmin ? 'Total Courses' : 'My Courses'}</p>
                                <h3 className="text-3xl font-extrabold text-white">{adminStats.totalCourses || 0}</h3>
                            </div>
                        </div>
                        
                        <div 
                            onClick={openEnrollmentsModal}
                            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center gap-5 cursor-pointer hover:bg-gray-750 hover:border-gray-500 transition-all group"
                        >
                            <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🎓</div>
                            <div>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors whitespace-nowrap">Enrollments</p>
                                <h3 className="text-3xl font-extrabold text-white">{adminStats.totalEnrollments || 0}</h3>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-red-600 pl-3">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            
                            {canCreate ? (
                                <Link to="/courses/new" className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform group relative overflow-hidden">
                                    <div className="relative z-10">
                                        <span className="text-4xl mb-4 block">➕</span>
                                        <h3 className="text-lg font-bold text-white mb-1">New Course</h3>
                                        <p className="text-red-200 text-xs">Add a new course</p>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 text-9xl opacity-10 group-hover:scale-110 transition-transform">📚</div>
                                </Link>
                            ) : (
                                <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl cursor-not-allowed opacity-60">
                                    <div className="relative z-10">
                                        <span className="text-4xl mb-4 block">🔒</span>
                                        <h3 className="text-lg font-bold text-white mb-1">New Course</h3>
                                        <p className="text-red-200 text-xs text-orange-400">Permission Denied</p>
                                    </div>
                                </div>
                            )}
                            
                            <div onClick={openCoursesModal} className="bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform group relative overflow-hidden cursor-pointer text-left w-full">
                                <div className="relative z-10">
                                    <span className="text-4xl mb-4 block">📂</span>
                                    <h3 className="text-lg font-bold text-white mb-1">Manage Courses</h3>
                                    <p className="text-gray-400 text-xs">{isSuperAdmin ? 'Edit or delete all' : 'Manage your courses'}</p>
                                </div>
                                <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 group-hover:scale-110 transition-transform">⚙</div>
                            </div>

                            <Link to="/messages" className="bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform group relative overflow-hidden">
                                <div className="relative z-10">
                                    <span className="text-4xl mb-4 block">💬</span>
                                    <h3 className="text-lg font-bold text-white mb-1">Messages</h3>
                                    <p className="text-gray-400 text-xs">Student inquiries</p>
                                </div>
                                <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 group-hover:scale-110 transition-transform">✉️</div>
                            </Link>

                            {isSuperAdmin && (
                                <>
                                    <div onClick={openAssignRolesModal} className="bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-500 p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform group relative overflow-hidden cursor-pointer text-left w-full">
                                        <div className="relative z-10">
                                            <span className="text-4xl mb-4 block">🪪</span>
                                            <h3 className="text-lg font-bold text-white mb-1">Assign Roles</h3>
                                            <p className="text-blue-200 text-xs">Promote users</p>
                                        </div>
                                        <div className="absolute -bottom-10 -right-10 text-9xl opacity-10 group-hover:scale-110 transition-transform">👨‍💼</div>
                                    </div>

                                    <div onClick={() => setShowPermissionsModal(true)} className="bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-500 p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform group relative overflow-hidden cursor-pointer text-left w-full">
                                        <div className="relative z-10">
                                            <span className="text-4xl mb-4 block">🛡️</span>
                                            <h3 className="text-lg font-bold text-white mb-1">Permissions</h3>
                                            <p className="text-indigo-200 text-xs">Control access</p>
                                        </div>
                                        <div className="absolute -bottom-10 -right-10 text-9xl opacity-10 group-hover:scale-110 transition-transform">🔑</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {showPermissionsModal && isSuperAdmin && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-down overflow-hidden">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">🛡️ Role Permissions</h2>
                                    <p className="text-gray-400 text-sm mt-1">Select a role below to configure its permissions.</p>
                                </div>
                                <button onClick={() => setShowPermissionsModal(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="flex justify-center mb-8">
                                    <div className="bg-gray-800 p-1.5 rounded-xl border border-gray-700 inline-flex shadow-inner">
                                        <button 
                                            onClick={() => setSelectedRoleForPerms('Instructor')}
                                            className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedRoleForPerms === 'Instructor' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                        >
                                            👨‍🏫 Instructor
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-5 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                                        <div>
                                            <h4 className="text-white font-bold mb-1">Create New Courses</h4>
                                            <p className="text-gray-400 text-sm">Allow this role to create and publish new courses.</p>
                                        </div>
                                        <button 
                                            onClick={() => handlePermissionToggle('canCreateCourse')} 
                                            className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 border ${rolePermissions[selectedRoleForPerms]?.canCreateCourse ? 'bg-green-500 border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-700 border-gray-600'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform ${rolePermissions[selectedRoleForPerms]?.canCreateCourse ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                                        <div>
                                            <h4 className="text-white font-bold mb-1">Ban Students</h4>
                                            <p className="text-gray-400 text-sm">Allow this role to suspend student accounts.</p>
                                        </div>
                                        <button 
                                            onClick={() => handlePermissionToggle('canBanStudents')} 
                                            className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 border ${rolePermissions[selectedRoleForPerms]?.canBanStudents ? 'bg-green-500 border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-700 border-gray-600'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform ${rolePermissions[selectedRoleForPerms]?.canBanStudents ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                                        <div>
                                            <h4 className="text-white font-bold mb-1">Remove Students</h4>
                                            <p className="text-gray-400 text-sm">Allow this role to remove students from courses.</p>
                                        </div>
                                        <button 
                                            onClick={() => handlePermissionToggle('canRemoveStudents')} 
                                            className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 border ${rolePermissions[selectedRoleForPerms]?.canRemoveStudents ? 'bg-green-500 border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-700 border-gray-600'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform ${rolePermissions[selectedRoleForPerms]?.canRemoveStudents ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showUsersModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-down">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        {modalFilter === 'online' ? '🟢 Online Students' : 
                                         modalFilter === 'instructors' ? '👨‍🏫 Platform Instructors' : 
                                         `👥 Manage ${isSuperAdmin ? 'Students' : 'My Students'}`}
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">View or manage platform users.</p>
                                </div>
                                <button onClick={() => setShowUsersModal(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {studentsList.filter(s => s._id !== user._id).length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <span className="text-5xl block mb-3">👻</span>
                                        <p>No other users found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {studentsList.filter(s => s._id !== user._id).map(student => (
                                            <div key={student._id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${student.isBanned ? 'bg-red-900/10 border-red-900/50' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        {student.avatar ? (
                                                            <img src={student.avatar} alt="avatar" className={`w-12 h-12 rounded-full object-cover border-2 ${student.isOnline ? 'border-green-500' : 'border-gray-600'}`} />
                                                        ) : (
                                                            <div className={`w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl border-2 ${student.isOnline ? 'border-green-500' : 'border-gray-600'}`}>👤</div>
                                                        )}
                                                        {student.isOnline && (
                                                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold ${student.isBanned ? 'text-gray-500 line-through' : 'text-white'} flex items-center gap-2`}>
                                                            {student.username || 'No Name'}
                                                            {student.role === 'Instructor' && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">Instructor</span>}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm">{student.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    
                                                    {canBan && (
                                                        <button 
                                                            onClick={() => handleBanToggle(student._id)}
                                                            className={`px-4 py-2 rounded-lg font-bold text-xs border transition-all ${student.isBanned ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-orange-500/10 border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white'}`}
                                                        >
                                                            {student.isBanned ? '🔓 Unban' : '🚫 Ban'}
                                                        </button>
                                                    )}
                                                    
                                                    {isSuperAdmin && (
                                                        <button 
                                                            onClick={() => setStudentToDelete(student._id)}
                                                            className="px-4 py-2 rounded-lg font-bold text-xs bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showAssignRolesModal && isSuperAdmin && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-blue-900/50 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-down">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        🪪 Assign Roles
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">Change user access levels safely.</p>
                                </div>
                                <button onClick={() => setShowAssignRolesModal(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {studentsList.filter(s => s._id !== user._id).length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <p>No other users found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {studentsList.filter(s => s._id !== user._id).map(student => (
                                            <div key={student._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-800 hover:border-gray-500 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        {student.avatar ? (
                                                            <img src={student.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-gray-600" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl border-2 border-gray-600">👤</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white">
                                                            {student.username || 'No Name'}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm">{student.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <select 
                                                        value={student.role || 'User'} 
                                                        onChange={(e) => handleRoleChange(student._id, e.target.value)}
                                                        className={`text-xs font-bold rounded-lg px-4 py-2 border focus:outline-none transition-colors cursor-pointer ${
                                                            student.role === 'Admin' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                                                            student.role === 'Instructor' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 
                                                            'bg-gray-900 text-gray-300 border-gray-600'
                                                        }`}
                                                    >
                                                        <option value="User">Student</option>
                                                        <option value="Instructor">Instructor</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {studentToDelete && isSuperAdmin && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-red-900/50 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-fade-in-down relative overflow-hidden">
                            <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border border-red-500/50">
                                ⚠️
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-2">Delete Student?</h3>
                            <p className="text-gray-400 text-sm mb-8">This action is permanent and cannot be undone. All data related to this student will be lost.</p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setStudentToDelete(null)} 
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors border border-gray-700"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDeleteStudent} 
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showCoursesModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-down">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        📚 Manage Courses
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">{isSuperAdmin ? 'Edit or remove courses directly.' : 'Manage your courses.'}</p>
                                </div>
                                <button onClick={() => setShowCoursesModal(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {allCourses.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <span className="text-5xl block mb-3">📭</span>
                                        <p>No courses found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {allCourses.map(course => (
                                            <div key={course._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-gray-800 border-gray-700 hover:border-gray-500 transition-colors gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-16 h-16 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                                                        {course.coverImage ? (
                                                            <img src={course.coverImage} alt="cover" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white line-clamp-1">{course.title}</h3>
                                                        <p className="text-gray-400 text-sm line-clamp-1">{course.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <Link 
                                                        to={`/courses/${course._id}`}
                                                        className="px-4 py-2 rounded-lg font-bold text-sm bg-green-500/10 border border-green-500/50 text-green-500 hover:bg-green-600 hover:text-white transition-all whitespace-nowrap flex-1 text-center"
                                                    >
                                                        📖 Details
                                                    </Link>
                                                    <Link 
                                                        to={`/courses/${course._id}/edit`}
                                                        className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-500/10 border border-blue-500/50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap flex-1 text-center"
                                                    >
                                                        ✏️ Edit
                                                    </Link>
                                                    <button 
                                                        onClick={() => setCourseToDelete(course._id)}
                                                        className="px-4 py-2 rounded-lg font-bold text-sm bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white transition-all whitespace-nowrap flex-1 text-center"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {courseToDelete && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-red-900/50 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-fade-in-down relative overflow-hidden">
                            <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border border-red-500/50">
                                ⚠️
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-2">Delete Course?</h3>
                            <p className="text-gray-400 text-sm mb-8">This action is permanent and cannot be undone. All course content will be lost.</p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setCourseToDelete(null)} 
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors border border-gray-700"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDeleteCourse} 
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showEnrollmentsModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-down">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        🎓 Course Enrollments
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">View which students are enrolled in which courses.</p>
                                </div>
                                <button onClick={() => setShowEnrollmentsModal(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {enrollmentsList.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <span className="text-5xl block mb-3">📭</span>
                                        <p>No enrollments found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {enrollmentsList.map(enrollment => (
                                            <div key={enrollment.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border bg-gray-800 border-gray-700 hover:border-gray-500 transition-colors gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl border-2 border-gray-600 flex-shrink-0">
                                                        👤
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white line-clamp-1">{enrollment.studentName}</h3>
                                                        <p className="text-gray-400 text-sm line-clamp-1">{enrollment.studentEmail}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:items-end flex-1 gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                                        <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                                                            📘 {enrollment.courseTitle}
                                                        </span>
                                                        {canRemove && (
                                                            <button 
                                                                onClick={() => handleRemoveEnrollment(enrollment.courseId, enrollment.studentId)}
                                                                className="text-xs bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 font-bold px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                                                                title="Remove student from this course"
                                                            >
                                                                🚫 Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 text-xs">Instructor: <span className="text-gray-300 font-bold">{enrollment.instructorName}</span></p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    const unenrolledCourses = allCourses.filter(course => !enrolledCourses.some(c => c._id === course._id));

    return (
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 py-10 px-6 sm:px-12 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="bg-gray-800 rounded-3xl p-8 md:p-12 border border-gray-700 shadow-2xl mb-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10 flex-1 text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                            Ready to learn today, <span className="text-red-500 capitalize">{userName}</span>?
                        </h1>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl">
                            Pick up right where you left off. Dive back into your courses and achieve your goals.
                        </p>
                        <Link to="/courses" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-red-600/30 transition-all inline-block">
                            Explore Catalog 🔍
                        </Link>
                    </div>
                    <div className="relative z-10 hidden md:block">
                        <div className="text-[120px] leading-none drop-shadow-2xl animate-bounce-slow">🚀</div>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-red-600 pl-3">My Enrolled Courses</h2>
                    {enrolledCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {enrolledCourses.map(course => (
                                <div key={course._id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-lg hover:border-gray-500 transition-colors flex flex-col h-full group">
                                    <div className="h-48 bg-gray-700 relative overflow-hidden">
                                        {course.coverImage ? (
                                            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80"></div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{course.title}</h3>
                                        <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">{course.description}</p>
                                        <Link 
                                            to={`/courses/${course._id}`} 
                                            className="block w-full text-center bg-gray-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors border border-gray-600 hover:border-red-500"
                                        >
                                            Continue Learning 📖
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 rounded-2xl p-12 border border-dashed border-gray-600 text-center flex flex-col items-center">
                            <span className="text-6xl mb-4 opacity-50">🧭</span>
                            <h3 className="text-xl font-bold text-white mb-2">Your learning journey hasn't started yet</h3>
                            <p className="text-gray-400 mb-6 max-w-md">Browse the catalog below and enroll in your first course.</p>
                            <Link to="/courses" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors border border-gray-500">
                                Browse Courses
                            </Link>
                        </div>
                    )}
                </div>

                <div className="mt-16 border-t border-gray-800 pt-12">
                    <div className="flex justify-between items-end mb-6 border-l-4 border-gray-500 pl-3">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Discover New Courses</h2>
                            <p className="text-gray-400 text-sm mt-1">Explore other available courses on the platform.</p>
                        </div>
                        <Link to="/courses" className="text-red-500 hover:text-red-400 font-bold text-sm hidden sm:block">View All →</Link>
                    </div>
                    
                    {unenrolledCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {unenrolledCourses.map(course => (
                                <div key={course._id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-lg hover:border-gray-500 transition-colors flex flex-col h-full group relative">
                                    {course.isTrial && (
                                        <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20">
                                            🎁 Free Trial
                                        </div>
                                    )}
                                    <div className="h-48 bg-gray-700 relative overflow-hidden">
                                        {course.coverImage ? (
                                            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80"></div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{course.title}</h3>
                                        <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">{course.description}</p>
                                        <Link 
                                            to={`/courses/${course._id}`} 
                                            className="block w-full text-center font-bold py-3 rounded-xl transition-colors border bg-red-600/10 text-red-500 border-red-500/50 hover:bg-red-600 hover:text-white"
                                        >
                                            View Details ℹ️
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 rounded-2xl p-8 border border-dashed border-gray-600 text-center">
                            <p className="text-gray-400">You have enrolled in all available courses! 🎉</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default Dashboard;