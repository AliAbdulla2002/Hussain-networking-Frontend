const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/auth`

const signUp = async (formData) => {
    try {
        const res = await fetch(`${BASE_URL}/sign-up`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (data.token) {
            localStorage.setItem('token', data.token)
            return JSON.parse(atob(data.token.split('.')[1])).payload
        }
        return data
    } catch (error) {
        return { error: error.message }
    }
}

const signIn = async (formData) => {
    try {
        const res = await fetch(`${BASE_URL}/sign-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (data.token) {
            localStorage.setItem('token', data.token)
            return JSON.parse(atob(data.token.split('.')[1])).payload
        }
        return data
    } catch (error) {
        return { error: error.message }
    }
}

const forgotPassword = async (email) => {
    try {
        const res = await fetch(`${BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return await res.json();
    } catch (error) {
        return { err: error.message };
    }
};

const resetPassword = async (id, token, password) => {
    try {
        const res = await fetch(`${BASE_URL}/reset-password/${id}/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        return await res.json();
    } catch (error) {
        return { err: error.message };
    }
};

export { signUp, signIn, forgotPassword, resetPassword }