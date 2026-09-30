import { useParams, useNavigate } from "react-router"
import * as courseService from '../services/courses'
import * as userService from '../services/userService'
import { useState, useEffect } from "react"

const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const CourseDetails = (props) => {
    const { courseId } = useParams()
    const navigate = useNavigate()
    const [course, setCourse] = useState(null)
    const [studentEmail, setStudentEmail] = useState('')
    const [message, setMessage] = useState(null)
    const [adminMessage, setAdminMessage] = useState(null)
    const [usersList, setUsersList] = useState([])
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [lessonToDelete, setLessonToDelete] = useState(null)
    const [studentToRemove, setStudentToRemove] = useState(null)

    const [completedLessons, setCompletedLessons] = useState([])
    const [expandedLessonId, setExpandedLessonId] = useState(null)
    
    const initialLessonState = { title: '', videoUrl: '', content: '' }
    const [lessonForm, setLessonForm] = useState(initialLessonState)
    const [pdfFile, setPdfFile] = useState(null)

    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
    const [hoverRating, setHoverRating] = useState(0)
    const [isUploading, setIsUploading] = useState(false)

    const isStaff = ['Admin', 'Instructor'].includes(props.user?.role)

    const fetchCourseData = async () => {
        try {
            const courseData = await courseService.show(courseId)
            
            if (!courseData || courseData.err) {
                navigate('/courses');
                return;
            }

            setCourse(courseData)

            if (isStaff) {
                const allUsers = await userService.getAllUsers()
                if (allUsers && !allUsers.err) {
                    setUsersList(allUsers.filter(u => u.role === 'User'))
                }
            }
        } catch (error) {
            console.error("Fetch Error:", error)
            navigate('/courses'); 
        }
    }

    useEffect(() => {
        if (courseId) {
            fetchCourseData()
        }
    }, [courseId, props.user?.role])

    const safeErrorMessage = (err) => {
        if (!err) return 'An unknown error occurred.'
        if (typeof err === 'string') return err
        if (err.message) return err.message
        return 'Server error processing request.'
    }

    const toggleLesson = (id) => {
        if (expandedLessonId === id) setExpandedLessonId(null)
        else setExpandedLessonId(id)
    }

    const handleEnroll = async (e) => {
        e.preventDefault()
        if (!studentEmail) return setAdminMessage({ type: 'error', text: 'Please select a student.' })
        
        try {
            const res = await courseService.enroll(courseId, studentEmail)
            if (!res || res.err) {
                setAdminMessage({ type: 'error', text: safeErrorMessage(res?.err) })
            } else {
                setAdminMessage({ type: 'success', text: 'Student enrolled successfully!' })
                setStudentEmail('')
                fetchCourseData()
            }
        } catch (error) {
            setAdminMessage({ type: 'error', text: 'Failed to enroll student.' })
        }
        setTimeout(() => setAdminMessage(null), 3000)
    }

    const confirmRemoveStudent = async () => {
        if (!studentToRemove) return;
        try {
            const res = await courseService.unenroll(courseId, studentToRemove)
            if (!res || res.err) {
                setAdminMessage({ type: 'error', text: safeErrorMessage(res?.err) })
            } else {
                setAdminMessage({ type: 'success', text: 'Student removed successfully!' })
                fetchCourseData()
            }
        } catch (error) {
            setAdminMessage({ type: 'error', text: 'Failed to remove student.' })
        }
        setStudentToRemove(null)
        setTimeout(() => setAdminMessage(null), 3000)
    }

    const handleLessonChange = (e) => {
        setLessonForm({ ...lessonForm, [e.target.name]: e.target.value })
    }

    const handleAddLesson = async (e) => {
        e.preventDefault()
        setIsUploading(true)
        
        const formData = new FormData()
        formData.append('title', lessonForm.title)
        formData.append('content', lessonForm.content)
        if (lessonForm.videoUrl) formData.append('videoUrl', lessonForm.videoUrl)
        if (pdfFile) formData.append('pdfNotes', pdfFile)

        try {
            const res = await courseService.addLesson(courseId, formData)
            
            if (!res || res.err) {
                setAdminMessage({ type: 'error', text: safeErrorMessage(res?.err) })
            } else {
                setAdminMessage({ type: 'success', text: 'Lesson added successfully!' })
                fetchCourseData()
                setLessonForm(initialLessonState)
                setPdfFile(null)
                const fileInput = document.getElementById('pdf-upload')
                if (fileInput) fileInput.value = ''
            }
        } catch (error) {
            setAdminMessage({ type: 'error', text: 'Server error during upload.' })
        } finally {
            setIsUploading(false)
        }
        setTimeout(() => setAdminMessage(null), 4000)
    }

    const confirmDeleteLesson = async () => {
        if (!lessonToDelete) return;
        try {
            const res = await courseService.deleteLesson(courseId, lessonToDelete)
            if (!res || res.err) {
                setAdminMessage({ type: 'error', text: safeErrorMessage(res?.err) })
            } else {
                setAdminMessage({ type: 'success', text: 'Lesson deleted successfully!' })
                fetchCourseData()
            }
        } catch (error) {
            setAdminMessage({ type: 'error', text: 'Failed to delete lesson.' })
        }
        setLessonToDelete(null)
        setTimeout(() => setAdminMessage(null), 3000)
    }

    const handleToggleCourseTrial = async () => {
        try {
            const res = await courseService.toggleCourseTrial(courseId);
            if (!res.err) fetchCourseData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleCourseVisibility = async () => {
        try {
            const res = await courseService.toggleCourseVisibility(courseId);
            if (!res.err) fetchCourseData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleLessonVisibility = async (e, lessonId) => {
        e.stopPropagation();
        try {
            const res = await courseService.toggleLessonVisibility(courseId, lessonId);
            if (!res.err) fetchCourseData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleLessonTrial = async (e, lessonId) => {
        e.stopPropagation();
        try {
            const res = await courseService.toggleLessonTrial(courseId, lessonId);
            if (!res.err) fetchCourseData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleCompleteLesson = async (lessonId) => {
        try {
            const res = await courseService.completeLesson(courseId, lessonId)
            if (res && !res.err) setCompletedLessons(res.completedLessons)
        } catch (error) {
            console.error(error)
        }
    }

    const handleReviewChange = (e) => {
        setReviewForm({ ...reviewForm, [e.target.name]: e.target.value })
    }

    const handleAddReview = async (e) => {
        e.preventDefault()
        try {
            const res = await courseService.addReview(courseId, reviewForm)
            if (!res || res.err) setMessage({ type: 'error', text: safeErrorMessage(res?.err) })
            else {
                setMessage({ type: 'success', text: 'Review added successfully! Thank you ⭐' })
                fetchCourseData()
                setReviewForm({ rating: 5, comment: '' })
                setHoverRating(0)
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error.' })
        }
        setTimeout(() => setMessage(null), 4000)
    }

    if (!course) return (
        <div className="min-h-[calc(100vh-85px)] bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
    )

    const totalLessons = course.lessons?.length || 0
    const completedCount = completedLessons?.length || 0
    const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100)
    const instructorName = course.instructor?.username || (course.instructor?.email ? course.instructor.email.split('@')[0] : 'Unknown Instructor')

    const isSuperAdmin = props.user?.role === 'Admin';
    const isCourseOwner = course?.instructor?._id === props.user?._id;
    const canManageCourse = isSuperAdmin || (props.user?.role === 'Instructor' && isCourseOwner);
    const isEnrolled = course.students?.some(student => (student._id || student) === props.user?._id);

    return (
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 py-12 px-4 sm:px-8 relative">
            <article className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden relative">
                
                <header className={`bg-gray-900/50 p-6 md:p-8 border-b flex flex-col lg:flex-row lg:items-start justify-between gap-6 ${course.isHidden && canManageCourse ? 'border-orange-500/50 bg-orange-900/10' : 'border-gray-700'}`}>
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 flex items-center flex-wrap gap-3">
                            {course.title || 'Course'}
                            {course.isTrial && <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md uppercase tracking-wider font-bold shadow-md shadow-blue-600/20">Free Trial</span>}
                            {course.isHidden && canManageCourse && <span className="text-xs bg-orange-500 text-white px-3 py-1 rounded-md uppercase tracking-wider font-bold shadow-md shadow-orange-500/20">Hidden</span>}
                        </h1>
                        <p className="text-gray-400 font-medium flex items-center gap-2">
                            <span>👨‍🏫 Instructor:</span> 
                            <span className="text-gray-300">{instructorName}</span>
                        </p>
                    </div>

                    {canManageCourse && (
                        <div className="flex gap-3 flex-wrap justify-start lg:justify-end shrink-0">
                            <button 
                                onClick={handleToggleCourseTrial}
                                className={`font-bold py-2 px-4 rounded-lg transition-all shadow-sm flex items-center gap-2 border ${course.isTrial ? 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white'}`}
                                title={course.isTrial ? "Remove Free Trial status" : "Make entire course a Free Trial"}
                            >
                                {course.isTrial ? '🚫 Revoke Trial' : '🎁 Set Free Trial'}
                            </button>
                            <button 
                                onClick={handleToggleCourseVisibility}
                                className={`border font-bold py-2 px-4 rounded-lg transition-all shadow-sm flex items-center gap-2 ${course.isHidden ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white' : 'bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-600 hover:text-white'}`}
                            >
                                {course.isHidden ? '👁️‍🗨️ Show' : '👁 Hide'}
                            </button>
                            <button 
                                onClick={() => navigate(`/courses/${courseId}/edit`)} 
                                className="bg-gray-700/50 hover:bg-gray-600 border border-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-sm"
                            >
                                ✏ Edit
                            </button>
                            <button 
                                onClick={() => setIsDeleteModalOpen(true)} 
                                className="bg-red-500/10 hover:bg-red-600 border border-red-500/50 text-red-500 hover:text-white font-bold py-2 px-4 rounded-lg transition-all shadow-sm"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    )}
                </header>
                
                <div className="p-8">
                    <div className="mb-10">
                        <h3 className="text-xl font-bold text-white mb-3 border-l-4 border-red-600 pl-3">About This Course</h3>
                        <p className="text-gray-300 leading-relaxed bg-gray-700/30 p-5 rounded-xl border border-gray-700 whitespace-pre-wrap">
                            {course.description}
                        </p>
                    </div>
                    
                    {message && props.user.role === 'User' && (
                        <div className={`mb-8 px-4 py-3 rounded-lg font-bold text-center border ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/50' : 'bg-red-500/10 text-red-500 border-red-500/50'}`}>
                            {message.text}
                        </div>
                    )}

                    {!isEnrolled && props.user.role === 'User' && !course.isTrial && (
                         <div className="mb-8 p-6 bg-blue-900/20 border border-blue-500/50 rounded-xl text-center">
                             <h4 className="text-xl font-bold text-white mb-2">Want to learn more?</h4>
                             <p className="text-blue-200 mb-4">Enroll in this course to unlock all lessons and materials.</p>
                             <p className="text-sm text-gray-400">Please contact your administrator or instructor to get enrolled.</p>
                         </div>
                    )}

                    {props.user.role === 'User' && isEnrolled && totalLessons > 0 && (
                        <div className="mb-10 bg-gray-700/40 p-5 rounded-xl border border-gray-700">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-white">Your Progress</span>
                                <span className="text-green-400 font-bold">{progressPercentage}%</span>
                            </div>
                            <div className="bg-gray-800 rounded-full h-3 w-full overflow-hidden border border-gray-600">
                                <div className="bg-green-500 h-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>
                    )}
                    
                    <div className="mb-12">
                        <h3 className="text-xl font-bold text-white mb-5 border-l-4 border-red-600 pl-3">Course Lessons</h3>
                        {course.lessons && course.lessons.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {course.lessons.map((lesson, idx) => {
                                    const lessonId = lesson._id || idx
                                    const isExpanded = expandedLessonId === lessonId
                                    const isCompleted = completedLessons?.includes(lessonId)
                                    const youtubeId = getYouTubeId(lesson.videoUrl)
                                    const canViewContent = isStaff || isEnrolled || course.isTrial || lesson.isTrial;

                                    return (
                                        <div key={lessonId} className={`rounded-xl border shadow-md overflow-hidden transition-all duration-300 ${lesson.isHidden && canManageCourse ? 'bg-gray-800/50 border-orange-500/30' : 'bg-gray-800 border-gray-700'}`}>
                                            
                                            <div 
                                                onClick={() => toggleLesson(lessonId)}
                                                className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-700/60 transition-colors"
                                            >
                                                <h4 className={`text-xl font-bold flex items-center flex-wrap gap-3 ${canViewContent ? 'text-white' : 'text-gray-400'}`}>
                                                    {canViewContent ? <span className="text-red-500 w-6 text-center">{idx + 1}.</span> : <span className="text-gray-500 w-6 text-center">🔒</span>}
                                                    <span className={lesson.isHidden && canManageCourse ? 'line-through' : ''}>{lesson.title || 'Untitled Lesson'}</span>
                                                    {lesson.isTrial && !course.isTrial && <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs border border-blue-500/20 uppercase tracking-wide">Free Trial</span>}
                                                    {lesson.isHidden && canManageCourse && <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs border border-orange-500/20 uppercase tracking-wide">Hidden</span>}
                                                    {isCompleted && <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-sm ml-2 border border-green-500/20">Completed ✓</span>}
                                                </h4>
                                                
                                                <div className="flex items-center gap-3">
                                                    {canManageCourse && (
                                                        <div className="flex items-center gap-2 mr-2 flex-wrap justify-end">
                                                            <button 
                                                                onClick={(e) => handleToggleLessonTrial(e, lesson._id)} 
                                                                className={`font-bold py-1.5 px-3 rounded text-xs transition-all border ${lesson.isTrial ? 'bg-blue-500 border-blue-600 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                                                title="Toggle Free Trial"
                                                            >
                                                                🎁 Trial
                                                            </button>
                                                            <button 
                                                                onClick={(e) => handleToggleLessonVisibility(e, lesson._id)} 
                                                                className={`font-bold py-1.5 px-3 rounded text-xs transition-all border ${lesson.isHidden ? 'bg-orange-500 border-orange-600 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                                                title="Toggle Visibility"
                                                            >
                                                                {lesson.isHidden ? '👁️‍🗨️ Show' : '👁 Hide'}
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setLessonToDelete(lesson._id); }} 
                                                                className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white font-bold py-1.5 px-3 rounded text-xs transition-all border border-red-500/30"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                    <span className={`text-gray-400 text-2xl transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                                        ▾
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {isExpanded && (
                                                <div className="p-6 border-t border-gray-700 bg-gray-900/40">
                                                    {canViewContent ? (
                                                        <>
                                                            <p className="text-gray-300 mb-6 whitespace-pre-wrap leading-relaxed">{lesson.content}</p>
                                                            
                                                            {youtubeId && (
                                                                <div className="relative pt-[56.25%] w-full rounded-xl overflow-hidden bg-black mb-6 border border-gray-700 shadow-lg">
                                                                    <iframe className="absolute top-0 left-0 w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}?modestbranding=1&rel=0&controls=1`} title={lesson.title} frameBorder="0" allowFullScreen></iframe>
                                                                </div>
                                                            )}
                                                            
                                                            {lesson.pdfNotes && (
                                                                <div className="w-full mt-2 mb-6 flex flex-col gap-3">
                                                                    <h5 className="text-white font-bold flex items-center gap-2">
                                                                        📄 Lesson Notes (PDF)
                                                                    </h5>
                                                                    
                                                                    <div className="w-full h-[600px] bg-gray-800 border border-gray-600 rounded-xl overflow-hidden shadow-inner">
                                                                        <object 
                                                                            data={lesson.pdfNotes} 
                                                                            type="application/pdf" 
                                                                            className="w-full h-full"
                                                                        >
                                                                            <p className="text-gray-400 p-6 text-center">
                                                                                Your browser doesn't support direct PDF viewing. <br/><br/>
                                                                                <a href={lesson.pdfNotes} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg mt-2 inline-block">
                                                                                    Click here to view or download it
                                                                                </a>
                                                                            </p>
                                                                        </object>
                                                                    </div>
                                                                    
                                                                    <a href={lesson.pdfNotes} target="_blank" rel="noreferrer" className="bg-gray-700 hover:bg-gray-600 border border-gray-500 text-white font-bold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 transition-all w-fit mt-1 shadow-md">
                                                                        ↗️ Open PDF in New Tab
                                                                    </a>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="flex gap-4 items-center mt-6 border-t border-gray-700/50 pt-5 flex-wrap">
                                                                {props.user.role === 'User' && !isCompleted && isEnrolled && (
                                                                    <button onClick={() => handleCompleteLesson(lessonId)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg shadow-green-600/20 transition-all ml-auto w-full sm:w-auto">
                                                                        Mark as Complete ✓
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <span className="text-4xl block mb-4 opacity-50">🔒</span>
                                                            <p className="text-gray-400 text-lg">{lesson.content || 'This lesson is locked.'}</p>
                                                            <p className="text-gray-500 text-sm mt-2">Enroll in the course to unlock.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic bg-gray-700/30 p-5 rounded-xl text-center border border-gray-700">No lessons added to this course yet.</p>
                        )}
                    </div>

                    <div className="mb-10">
                        <h3 className="text-xl font-bold text-white mb-5 border-l-4 border-red-600 pl-3">Course Reviews ⭐</h3>
                        {course.reviews && course.reviews.length > 0 ? (
                            <div className="grid gap-4 mb-6">
                                {course.reviews.map((review, idx) => (
                                    <div key={review._id || idx} className="bg-gray-700/50 p-5 rounded-xl border border-gray-600">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                <strong className="text-white">{review.student?.username || 'Student'}</strong>
                                                {isStaff && review.student && (
                                                    <span className="text-xs bg-gray-800 border border-gray-600 text-gray-400 px-2 py-1 rounded">
                                                        {review.student?.email}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-yellow-400 tracking-widest text-lg font-bold">
                                                    {review.rating}/5
                                                </span>
                                                <span className="text-yellow-400 text-lg">
                                                    {'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 italic">"{review.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic mb-6">No reviews yet. Be the first to review!</p>
                        )}

                        {props.user.role === 'User' && (isEnrolled || course.isTrial) && (
                            <form onSubmit={handleAddReview} className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 flex flex-col gap-4 mt-6">
                                <h4 className="text-lg font-bold text-white mb-2">Leave a Review</h4>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Rating</label>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className={`text-3xl focus:outline-none transition-transform hover:scale-110 ${
                                                    (hoverRating || reviewForm.rating) >= star ? 'text-yellow-400' : 'text-gray-600'
                                                }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                        <span className="ml-3 text-white text-sm font-bold bg-gray-800 px-3 py-1 rounded-full border border-gray-600">
                                            {reviewForm.rating} / 5
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2 mt-2">Comment</label>
                                    <textarea name="comment" placeholder="How was your experience with this course?" value={reviewForm.comment} onChange={handleReviewChange} rows="3" required className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"></textarea>
                                </div>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all self-start mt-2">Submit Review</button>
                            </form>
                        )}
                    </div>

                    {canManageCourse && (
                        <div className="mt-12 bg-gray-900 p-8 rounded-2xl border border-dashed border-gray-500 relative">
                            <div className="absolute -top-4 left-6 bg-red-600 text-white font-bold px-4 py-1 rounded-full text-sm">🛠️ Admin Panel</div>
                            
                            {adminMessage && (
                                <div className={`mb-6 px-4 py-3 rounded-lg font-bold text-center border ${adminMessage.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/50' : 'bg-red-500/10 text-red-500 border-red-500/50'}`}>
                                    {adminMessage.text}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-10 mt-4">
                                <div>
                                    <h5 className="text-white font-bold mb-4 text-lg border-b border-gray-700 pb-2">Manage Students</h5>
                                    
                                    <form onSubmit={handleEnroll} className="flex flex-col gap-3 mb-6">
                                        <select value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600">
                                            <option value="" disabled>Select a student...</option>
                                            {usersList && usersList.length > 0 ? (
                                                usersList.map(u => {
                                                    const displayName = u.username || (u.email ? u.email.split('@')[0] : 'User')
                                                    return <option key={u._id} value={u.email}>{displayName} ({u.email})</option>
                                                })
                                            ) : <option disabled>No students found</option>}
                                        </select>
                                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all">Enroll Student</button>
                                    </form>

                                    {course.students && course.students.length > 0 && (
                                        <div className="bg-gray-800 rounded-lg border border-gray-600 p-3 max-h-48 overflow-y-auto">
                                            <h6 className="text-gray-400 text-sm font-bold mb-2">Enrolled Students:</h6>
                                            <ul className="flex flex-col gap-2">
                                                {course.students.map(student => (
                                                    <li key={student._id || student} className="flex justify-between items-center bg-gray-700/50 px-3 py-2 rounded border border-gray-600">
                                                        <span className="text-white text-sm">{student.email || 'Student ID'}</span>
                                                        <button 
                                                            onClick={() => setStudentToRemove(student._id || student)} 
                                                            className="text-red-500 hover:text-white font-bold text-xs bg-red-500/10 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h5 className="text-white font-bold mb-4 text-lg border-b border-gray-700 pb-2">Add New Lesson</h5>
                                    <form onSubmit={handleAddLesson} className="flex flex-col gap-3" encType="multipart/form-data">
                                        <input type="text" name="title" placeholder="Lesson Title" value={lessonForm.title} onChange={handleLessonChange} required className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
                                        <input type="url" name="videoUrl" placeholder="YouTube URL (optional)" value={lessonForm.videoUrl} onChange={handleLessonChange} className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
                                        <textarea name="content" placeholder="Lesson Content / Text" value={lessonForm.content} onChange={handleLessonChange} rows="3" required className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"></textarea>
                                        
                                        <div className="border border-gray-600 bg-gray-800 rounded-lg p-3 mt-1 flex justify-between items-center">
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-1">Attach PDF Notes (Optional)</label>
                                                <input type="file" id="pdf-upload" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} className="text-sm text-gray-400 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer" />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={isUploading}
                                            className={`font-bold py-3 rounded-lg transition-all mt-2 text-white ${isUploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                                        >
                                            {isUploading ? 'Uploading... ⏳' : 'Save Lesson'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </article>

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-gray-900 border border-red-900/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-down">
                        <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border border-red-500/50">⚠️</div>
                        <h3 className="text-2xl font-extrabold text-white mb-2">Delete Course?</h3>
                        <p className="text-gray-400 text-sm mb-8">This action cannot be undone. All course content and enrollments will be lost.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors border border-gray-700">Cancel</button>
                            <button onClick={() => { setIsDeleteModalOpen(false); props.handleDeleteCourse(courseId) }} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {lessonToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-gray-900 border border-red-900/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-down">
                        <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border border-red-500/50">⚠️</div>
                        <h3 className="text-2xl font-extrabold text-white mb-2">Delete Lesson?</h3>
                        <p className="text-gray-400 text-sm mb-8">Are you sure you want to delete this lesson? This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setLessonToDelete(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors border border-gray-700">Cancel</button>
                            <button onClick={confirmDeleteLesson} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {studentToRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-gray-900 border border-red-900/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-down">
                        <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border border-red-500/50">⚠️</div>
                        <h3 className="text-2xl font-extrabold text-white mb-2">Remove Student?</h3>
                        <p className="text-gray-400 text-sm mb-8">Are you sure you want to remove this student from the course?</p>
                        <div className="flex gap-4">
                            <button onClick={() => setStudentToRemove(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors border border-gray-700">Cancel</button>
                            <button onClick={confirmRemoveStudent} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20">Yes, Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

export default CourseDetails