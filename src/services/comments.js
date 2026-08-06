const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/hoots`

const create = async (hootId, commentFormData) => {
  try {
    const res = await fetch(`${BASE_URL}/${hootId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentFormData),
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

const deleteComment = async (hootId, commentId) => {
    try {
        const res = await fetch(`${BASE_URL}/${hootId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            }, 
        })
        return res.json()
    } catch (error) {
        console.log(error)
    }
}


const update = async (hootId, commentId, formData) => {
  try {
    const res = await fetch(`${BASE_URL}/${hootId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

export {
    create,
    deleteComment,
    update,
}