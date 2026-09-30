const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/courses`

const index = async () => {
  try {
    const res = await fetch(BASE_URL, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

const getTrialLessons = async () => {
    try {
        const res = await fetch(`${BASE_URL}/trials`)
        return res.json()
    } catch (error) {
        console.log(error)
        return []
    }
}

const show = async (courseId) => {
    try {
        const res = await fetch(`${BASE_URL}/${courseId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        return res.json()
    } catch (error) {
        console.log(error)
    }
}

const create = async (courseFormData) => {
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: courseFormData,
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

const updateCourse = async (courseId, courseFormData) => {
    try {
        const res = await fetch(`${BASE_URL}/${courseId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: courseFormData
        })
        return res.json()
    } catch (error) {
        console.log(error)
    }
}

const toggleCourseVisibility = async (courseId) => {
    try {
        const res = await fetch(`${BASE_URL}/${courseId}/toggle-visibility`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        return res.json()
    } catch (error) {
        console.log(error)
    }
}

const toggleCourseTrial = async (courseId) => {
    try {
        const res = await fetch(`${BASE_URL}/${courseId}/toggle-trial`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        return res.json()
    } catch (error) {
        console.log(error)
    }
}

const toggleLessonVisibility = async (courseId, lessonId) => {
    try {
        const res = await fetch(`${BASE_URL}/${courseId}/lessons/${lessonId}/toggle-visibility`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        return res.json()
    } catch (error) {
        console.log(error)
    }
}

const toggleLessonTrial = async (courseId, lessonId) => {
    try {
        const res = await fetch(`${BASE_URL}/${courseId}/lessons/${lessonId}/toggle-trial`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        return res.json()
    } catch (error) {
        console.log(error)
    }
}

const deleteCourse = async (courseId) => {
    try {
        const res = await fetch(`${BASE_URL}/${courseId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
        return res.json()
    } catch (error) {
        console.log(error)
    }
}

const enroll = async (courseId, email) => {
  try {
    const res = await fetch(`${BASE_URL}/${courseId}/enroll`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

const addLesson = async (courseId, lessonData) => {
  try {
    const res = await fetch(`${BASE_URL}/${courseId}/lessons`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: lessonData,
    })
    return await res.json()
  } catch (error) {
    return { err: error.message || 'Network error occurred' }
  }
}

const completeLesson = async (courseId, lessonId) => {
  try {
    const res = await fetch(`${BASE_URL}/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

const addReview = async (courseId, reviewData) => {
  try {
    const res = await fetch(`${BASE_URL}/${courseId}/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

const deleteLesson = async (courseId, lessonId) => {
  try {
    const res = await fetch(`${BASE_URL}/${courseId}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

const unenroll = async (courseId, studentId) => {
  try {
    const res = await fetch(`${BASE_URL}/${courseId}/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

export { index, show, create, updateCourse, toggleCourseVisibility, toggleCourseTrial, toggleLessonVisibility, toggleLessonTrial, deleteCourse, enroll, unenroll, addLesson, completeLesson, addReview, deleteLesson, getTrialLessons }