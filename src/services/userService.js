const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/users`

const getProfile = async () => {
    try {
        const res = await fetch(`${BASE_URL}/profile`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await res.json()
        if (data.err) throw new Error(data.err)
        return data
    } catch (error) {
        throw error
    }
}

const updateProfile = async (formData) => {
    try {
        const res = await fetch(`${BASE_URL}/profile`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: formData 
        })
        const data = await res.json()
        if (data.err || data.error) throw new Error(data.err || data.error)
        return data
    } catch (error) {
        throw error
    }
}

const getAllUsers = async () => {
    try {
        const res = await fetch(BASE_URL, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await res.json()
        if (data.err) throw new Error(data.err)
        return data
    } catch (error) {
        throw error
    }
}

export { getProfile, updateProfile, getAllUsers }