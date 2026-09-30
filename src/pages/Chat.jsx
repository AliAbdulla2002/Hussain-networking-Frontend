import { useState, useEffect, useRef } from 'react';
import * as chatService from '../services/chat';
import * as adminService from '../services/admin';
import * as courseService from '../services/courses';

const Chat = ({ user, socket }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [allCourses, setAllCourses] = useState([]);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;
        const messageHandler = (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        };
        socket.on('receive_message', messageHandler);
        return () => socket.off('receive_message', messageHandler);
    }, [socket]);

    useEffect(() => {
        const fetchUsersAndCourses = async () => {
            const usersData = await chatService.getUsers();
            const coursesData = await courseService.index();

            if (!usersData.error) {
                let allowedUsers = [];

                if (user.role === 'Admin') {
                    allowedUsers = usersData;
                } else if (user.role === 'Instructor') {
                    const adminUsers = usersData.filter(u => u.role === 'Admin');
                    const myStudentIds = new Set();
                    if (coursesData && !coursesData.error) {
                        coursesData.forEach(c => {
                            if (c.students) {
                                c.students.forEach(s => myStudentIds.add(s._id || s));
                            }
                        });
                    }
                    const myStudents = usersData.filter(u => myStudentIds.has(u._id));
                    const combined = [...adminUsers, ...myStudents];
                    allowedUsers = Array.from(new Set(combined.map(a => a._id))).map(id => combined.find(a => a._id === id));
                } else if (user.role === 'User') {
                    const adminUsers = usersData.filter(u => u.role === 'Admin');
                    const myInstructorIds = new Set();
                    if (coursesData && !coursesData.error) {
                        coursesData.forEach(c => {
                            if (c.instructor) {
                                myInstructorIds.add(c.instructor._id || c.instructor);
                            }
                        });
                    }
                    const myInstructors = usersData.filter(u => myInstructorIds.has(u._id));
                    const combined = [...adminUsers, ...myInstructors];
                    allowedUsers = Array.from(new Set(combined.map(a => a._id))).map(id => combined.find(a => a._id === id));
                }

                setUsers(allowedUsers);

                if (allowedUsers.length > 0 && window.innerWidth >= 768) {
                    const defaultUser = allowedUsers.find(u => u.role === 'Admin') || allowedUsers[0];
                    setSelectedUser(defaultUser);
                }
            }

            if (coursesData && !coursesData.error) {
                setAllCourses(coursesData);
            }
        };
        fetchUsersAndCourses();
    }, [user]);

    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                const msgs = await chatService.getMessages(selectedUser._id);
                if (!msgs.error) setMessages(msgs);
            };
            fetchMessages();
        }
    }, [selectedUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachment(file);
            setAttachmentPreview(URL.createObjectURL(file));
        }
    };

    const clearAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !selectedUser || isUploading || !socket) return;

        setIsUploading(true);
        let attachmentUrl = null;

        if (attachment) {
            const uploadRes = await chatService.uploadAttachment(attachment);
            if (uploadRes.fileUrl) attachmentUrl = uploadRes.fileUrl;
        }

        const messageData = {
            senderId: user._id,
            receiverId: selectedUser._id,
            content: newMessage,
            attachment: attachmentUrl
        };

        socket.emit('send_message', messageData);
        setMessages((prev) => [...prev, { ...messageData, sender: user._id }]);
        
        setNewMessage('');
        clearAttachment();
        setIsUploading(false);
    };

    const handleBanToggle = async () => {
        if (!selectedUser) return;
        const updatedStatus = !selectedUser.isBanned;
        setSelectedUser({ ...selectedUser, isBanned: updatedStatus });
        setUsers(users.map(u => u._id === selectedUser._id ? { ...u, isBanned: updatedStatus } : u));
        try {
            await adminService.toggleBan(selectedUser._id);
        } catch (error) {
            console.error(error);
        }
    };

    const confirmDeleteStudent = async () => {
        if (!selectedUser) return;
        const idToDelete = selectedUser._id;
        try {
            await adminService.deleteStudent(idToDelete);
            setUsers(users.filter(u => u._id !== idToDelete));
            setSelectedUser(null);
            setShowDeleteConfirm(false);
            setShowProfileModal(false);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const userEnrolledCourses = allCourses.filter(c => 
        c.students && c.students.some(s => s === selectedUser?._id || s._id === selectedUser?._id)
    );

    return (
        <main className="h-[calc(100vh-85px)] bg-gray-900 flex border-t border-gray-700 font-sans relative overflow-hidden">
            <aside className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 lg:w-1/4 bg-gray-800 border-r border-gray-700 flex-col z-10 shadow-xl`}>
                <div className="p-5 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">💬 Messages</h2>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-600"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center p-6 text-gray-500 text-sm">No users found.</div>
                    ) : (
                        filteredUsers.map(u => (
                            <div 
                                key={u._id}
                                onClick={() => setSelectedUser(u)}
                                className={`p-4 border-b border-gray-700 cursor-pointer transition-all flex items-center gap-3 ${selectedUser?._id === u._id ? 'bg-gray-750 border-l-4 border-red-600' : 'hover:bg-gray-750/50'}`}
                            >
                                {u.avatar ? (
                                    <img src={u.avatar} alt="avatar" className={`w-12 h-12 rounded-full object-cover border-2 shadow-sm ${u.isBanned ? 'border-red-900 opacity-50' : 'border-gray-600'}`} />
                                ) : (
                                    <div className={`w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl border-2 shadow-sm ${u.isBanned ? 'border-red-900 opacity-50' : 'border-gray-600'}`}>👤</div>
                                )}
                                <div className="flex-1 overflow-hidden">
                                    <h3 className={`font-bold text-sm md:text-base truncate ${u.isBanned ? 'text-gray-500 line-through' : 'text-white'}`}>
                                        {u.username || u.email.split('@')[0]}
                                    </h3>
                                    <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            <section className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-900 relative`}>
                {selectedUser ? (
                    <>
                        <header className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between shadow-md z-10">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setSelectedUser(null)} 
                                    className="md:hidden text-white mr-2 bg-gray-700 p-2 rounded-full hover:bg-gray-600"
                                >
                                    🔙
                                </button>
                                {selectedUser.avatar ? (
                                    <img src={selectedUser.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-gray-600" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg border-2 border-gray-600">👤</div>
                                )}
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        {selectedUser.username || selectedUser.email.split('@')[0]}
                                    </h2>
                                    {user.role !== 'Admin' && selectedUser.role === 'Admin' && <p className="text-xs text-green-500 font-bold tracking-wider uppercase">Support Team</p>}
                                    {user.role === 'User' && selectedUser.role === 'Instructor' && <p className="text-xs text-blue-500 font-bold tracking-wider uppercase">Course Instructor</p>}
                                </div>
                            </div>
                            
                            {user.role === 'Admin' && (
                                <button 
                                    onClick={() => setShowProfileModal(true)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors border border-gray-600 flex items-center gap-2 text-sm font-bold shadow-sm"
                                >
                                    <span className="hidden sm:inline">ℹ️ Profile Info</span>
                                    <span className="sm:hidden">ℹ️</span>
                                </button>
                            )}
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 scroll-smooth">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender === user._id;
                                const msgAvatar = isMe ? user.avatar : selectedUser.avatar;

                                return (
                                    <div key={idx} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {msgAvatar ? (
                                            <img src={msgAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-600 flex-shrink-0 mb-1" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs border border-gray-600 flex-shrink-0 mb-1">👤</div>
                                        )}
                                        
                                        <div className={`max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl shadow-sm flex flex-col ${isMe ? 'bg-red-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'}`}>
                                            {msg.attachment && (
                                                <a href={msg.attachment} target="_blank" rel="noreferrer">
                                                    <img src={msg.attachment} alt="attachment" className="rounded-xl mb-2 max-w-full h-auto max-h-60 object-contain cursor-pointer hover:opacity-90 transition-opacity" />
                                                </a>
                                            )}
                                            {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="bg-gray-800 border-t border-gray-700 p-3 md:p-4">
                            {attachmentPreview && (
                                <div className="mb-3 relative inline-block">
                                    <img src={attachmentPreview} alt="Preview" className="h-20 w-auto rounded-lg border border-gray-600 shadow-md" />
                                    <button onClick={clearAttachment} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600">×</button>
                                </div>
                            )}
                            
                            <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 items-end">
                                <div className="relative flex-shrink-0 pb-1">
                                    <input type="file" id="chat-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    <label htmlFor="chat-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors shadow-sm text-lg md:text-xl">
                                        📸
                                    </label>
                                </div>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={selectedUser.isBanned ? "Suspended..." : "Type a message..."}
                                    disabled={selectedUser.isBanned && user.role !== 'Admin'}
                                    rows="1"
                                    className="flex-1 bg-gray-900 border border-gray-600 text-white px-4 py-2 md:px-5 md:py-3 rounded-2xl focus:outline-none focus:border-red-500 transition-colors resize-none overflow-hidden text-sm md:text-base"
                                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                                />
                                <button type="submit" disabled={isUploading || (!newMessage.trim() && !attachment)} className={`flex-shrink-0 pb-1 px-4 md:px-6 py-2 md:py-3 rounded-full font-bold transition-all shadow-md text-sm md:text-base ${isUploading || (!newMessage.trim() && !attachment) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                                    {isUploading ? '⏳' : <span className="hidden md:inline">Send 🚀</span>}
                                    <span className="md:hidden">🚀</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-gray-500 p-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-800 rounded-full flex items-center justify-center text-4xl md:text-5xl mb-6 shadow-inner border border-gray-700">💬</div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-400 mb-2 text-center">Your Conversations</h2>
                        <p className="text-xs md:text-sm text-center">Select a user from the sidebar to start chatting.</p>
                    </div>
                )}
            </section>

            {showProfileModal && selectedUser && user.role === 'Admin' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col animate-fade-in-down overflow-hidden">
                        
                        <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-gray-800/50">
                            <div className="flex items-center gap-3 sm:gap-5">
                                {selectedUser.avatar ? (
                                    <img src={selectedUser.avatar} alt="avatar" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-700 shadow-lg" />
                                ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl sm:text-3xl border-4 border-gray-600 shadow-lg">👤</div>
                                )}
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">{selectedUser.username}</h2>
                                    <p className="text-gray-400 text-xs sm:text-sm mb-1">📧 {selectedUser.email}</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${selectedUser.isBanned ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'}`}>
                                        {selectedUser.isBanned ? '🚫 Suspended' : '🟢 Active User'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
                        </div>

                        <div className="p-4 sm:p-6 max-h-[40vh] overflow-y-auto">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">📚 Enrolled Courses ({userEnrolledCourses.length})</h3>
                            {userEnrolledCourses.length > 0 ? (
                                <div className="space-y-3">
                                    {userEnrolledCourses.map(course => (
                                        <div key={course._id} className="bg-gray-800 border border-gray-700 p-3 rounded-xl flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                                                {course.coverImage ? (
                                                    <img src={course.coverImage} alt="cover" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">📘</div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm">{course.title}</h4>
                                                <p className="text-gray-400 text-xs mt-0.5">Teacher: {course.instructor?.username || 'Platform Instructor'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-4 text-center text-gray-500 text-sm">
                                    This user is not enrolled in any courses yet.
                                </div>
                            )}
                        </div>

                        <div className="p-4 sm:p-6 border-t border-gray-800 bg-gray-800/30 flex gap-2 sm:gap-4">
                            <button 
                                onClick={handleBanToggle}
                                className={`flex-1 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all border ${selectedUser.isBanned ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-white'}`}
                            >
                                {selectedUser.isBanned ? '🔓 Unban' : '🚫 Ban'}
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex-1 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white py-2 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && user.role === 'Admin' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-red-900/50 rounded-3xl w-full max-w-sm shadow-2xl p-6 sm:p-8 text-center animate-fade-in-down relative overflow-hidden">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-900/30 rounded-full flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-5 border border-red-500/50">⚠️</div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">Delete User?</h3>
                        <p className="text-gray-400 text-xs sm:text-sm mb-8">This action is permanent. All chat history and enrollments will be lost.</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)} 
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 sm:py-3 rounded-xl transition-colors border border-gray-700"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteStudent} 
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 sm:py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Chat;