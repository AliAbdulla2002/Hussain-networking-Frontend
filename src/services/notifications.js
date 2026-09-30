const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/notifications`;

export const getNotifications = async () => {
    try {
        const res = await fetch(BASE_URL, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        return await res.json();
    } catch (error) { return []; }
};

export const markAsRead = async (id) => {
    try {
        await fetch(`${BASE_URL}/${id}/read`, {
            method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
    } catch (error) { console.error(error); }
};

export const markAllAsRead = async () => {
    try {
        await fetch(`${BASE_URL}/read-all`, {
            method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
    } catch (error) { console.error(error); }
};

export const clearAll = async () => {
    try {
        await fetch(BASE_URL, {
            method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
    } catch (error) { console.error(error); }
};