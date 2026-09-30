const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/chat`;

export const getUsers = async () => {
    try {
        const res = await fetch(`${BASE_URL}/users`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return await res.json();
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

export const getMessages = async (userId) => {
    try {
        const res = await fetch(`${BASE_URL}/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return await res.json();
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
};

export const uploadAttachment = async (file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    
    try {
        const res = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        return await res.json();
    } catch (error) {
        console.error("Error uploading attachment:", error);
        return { error: 'Failed to upload' };
    }
};