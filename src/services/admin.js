const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/admin`;

export const getStudents = async () => {
    try {
        const res = await fetch(`${BASE_URL}/students`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        return await res.json();
    } catch (error) { return []; }
};

export const toggleBan = async (id) => {
    try {
        const res = await fetch(`${BASE_URL}/students/${id}/ban`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        return await res.json();
    } catch (error) { console.error(error); }
};

export const deleteStudent = async (id) => {
    try {
        await fetch(`${BASE_URL}/students/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    } catch (error) { console.error(error); }
};

export const updateRole = async (userId, role) => {
    try {
        const res = await fetch(`${BASE_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ role })
        });
        return await res.json();
    } catch (error) { console.error(error); }
};

export const getPermissions = async () => {
    try {
        const res = await fetch(`${BASE_URL}/permissions`);
        return await res.json();
    } catch (error) { return null; }
};

export const updatePermissions = async (perms) => {
    try {
        const res = await fetch(`${BASE_URL}/permissions`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(perms)
        });
        return await res.json();
    } catch (error) { console.error(error); }
};