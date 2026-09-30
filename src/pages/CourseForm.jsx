import { useState, useEffect } from 'react'
import { useParams } from 'react-router'

const CourseForm = (props) => {
    const { courseId } = useParams()
    const isEditMode = !!courseId
    
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [coverImage, setCoverImage] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    useEffect(() => {
        if (isEditMode && props.courses.length > 0) {
            const courseToEdit = props.courses.find(c => c._id === courseId)
            if (courseToEdit) {
                setTitle(courseToEdit.title)
                setDescription(courseToEdit.description)
                if (courseToEdit.coverImage) {
                    setPreviewUrl(courseToEdit.coverImage)
                }
            }
        }
    }, [courseId, props.courses, isEditMode])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setCoverImage(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = (evt) => {
        evt.preventDefault()
        
        const formData = new FormData()
        formData.append('title', title)
        formData.append('description', description)
        if (coverImage) {
            formData.append('coverImage', coverImage)
        }

        if (isEditMode) {
            props.handleUpdateCourse(courseId, formData)
        } else {
            props.handleAddCourse(formData)
        }
    }

    return (
        <main className="min-h-[calc(100vh-85px)] bg-gray-900 flex justify-center py-12 px-4">
            <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
                
                <header className="mb-8 text-center border-b border-gray-700 pb-4">
                    <h2 className="text-3xl font-extrabold text-white">
                        {isEditMode ? '✏️ Edit Course' : '🚀 Create New Course'}
                    </h2>
                </header>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-6" encType="multipart/form-data">
                    <div>
                        <label htmlFor='title-input' className="block text-gray-300 text-sm font-bold mb-2">Course Title</label>
                        <input
                            required
                            type='text'
                            id='title-input'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                            placeholder="e.g. Advanced Routing & Switching"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor='description-input' className="block text-gray-300 text-sm font-bold mb-2">Description</label>
                        <textarea
                            required
                            id='description-input'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="5"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all resize-none"
                            placeholder="What will students learn in this course?"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-3">Cover Image</label>
                        
                        {previewUrl && (
                            <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-600 h-56 relative group">
                                <img src={previewUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold">Current Cover</span>
                                </div>
                            </div>
                        )}
                        
                        <input
                            type='file'
                            id='image-input'
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer transition-all"
                        />
                    </div>
                    
                    <button 
                        type='submit' 
                        className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-red-600/30 transition-all text-lg"
                    >
                        {isEditMode ? '💾 UPDATE COURSE' : '✨ CREATE COURSE'}
                    </button>
                </form>
            </div>
        </main>
    )
}

export default CourseForm