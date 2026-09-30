import { Link } from "react-router"

const CourseList = (props) => {
    return (
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 py-12 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-white mb-4">Explore Courses 🚀</h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Enhance your networking skills with our expert-led modules and hands-on labs.
                    </p>
                </header>

                {props.courses && props.courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {props.courses.map(course => (
                            <article key={course._id} className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 hover:border-red-500 hover:shadow-red-900/20 transition-all duration-300 flex flex-col group">
                                
                                <div className="h-48 overflow-hidden relative bg-gray-700">
                                    {course.coverImage ? (
                                        <img 
                                            src={course.coverImage} 
                                            alt={course.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
                                            📚
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-6 flex-1 flex flex-col">
                                    <h2 className="text-2xl font-bold text-white mb-2 line-clamp-1">{course.title}</h2>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                                        {course.description}
                                    </p>
                                    
                                    <div className="mt-auto pt-5 border-t border-gray-700 flex justify-between items-center">
                                        <div className="text-sm text-gray-500 font-semibold flex items-center gap-2">
                                            <span>👥 {course.students?.length || 0} Enrolled</span>
                                        </div>
                                        <Link 
                                            to={`/courses/${course._id}`} 
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg shadow-md shadow-red-600/20 transition-all"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-800 rounded-2xl border border-gray-700 border-dashed">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Courses Available</h3>
                        <p className="text-gray-400">Check back later or contact the administrator.</p>
                    </div>
                )}
            </div>
        </main>
    )
}

export default CourseList