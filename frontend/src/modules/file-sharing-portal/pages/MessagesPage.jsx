import { useEffect, useState } from 'react';
import conversationService from '../../../services/conversation.service';
import messageService from '../../../services/message.service';

const MessagesPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchConversations();
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages();
            markConversationAsRead();
        }
    }, [selectedConversation]);

    const fetchConversations = async () => {
        try {
            const response = await conversationService.getAll();
            setConversations(response.data.conversations || []);
            if (response.data.conversations?.length > 0 && !selectedConversation) {
                setSelectedConversation(response.data.conversations[0]._id);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await messageService.getConversationMessages(selectedConversation);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await messageService.getUnreadCount();
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markConversationAsRead = async () => {
        try {
            await messageService.markConversationAsRead(selectedConversation);
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedConversation) return;

        try {
            await messageService.send({
                conversationId: selectedConversation,
                content: messageText
            });
            setMessageText('');
            fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getConversationTitle = (conv) => {
        if (conv.title) return conv.title;
        if (conv.type === 'case' && conv.case) return conv.case.title;
        return 'Conversation';
    };

    const getCurrentUser = () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    };

    const currentUser = getCurrentUser();
    const currentUserId = currentUser?._id || currentUser?.id;

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Conversations List */}
            <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons text-[#0891b2]">chat</span>
                        Messages
                    </h2>
                    {unreadCount > 0 && (
                        <p className="text-sm text-slate-500 mt-1">{unreadCount} unread</p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <span className="material-icons text-4xl mb-2">chat_bubble_outline</span>
                            <p>No conversations yet</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv._id}
                                onClick={() => setSelectedConversation(conv._id)}
                                className={`p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedConversation === conv._id ? 'bg-slate-100 dark:bg-slate-800' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0891b2]/10 flex items-center justify-center text-[#0891b2] font-bold flex-shrink-0">
                                        {getConversationTitle(conv).charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                                {getConversationTitle(conv)}
                                            </h3>
                                            {conv.lastMessageAt && (
                                                <span className="text-xs text-slate-500">
                                                    {formatTime(conv.lastMessageAt)}
                                                </span>
                                            )}
                                        </div>
                                        {conv.case && (
                                            <p className="text-xs text-slate-500 mb-1">Case: {conv.case.caseNumber}</p>
                                        )}
                                        {conv.unreadCount > 0 && (
                                            <span className="inline-block px-2 py-0.5 bg-[#0891b2] text-white text-xs rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="font-bold text-slate-900 dark:text-white">
                                {getConversationTitle(conversations.find(c => c._id === selectedConversation) || {})}
                            </h2>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <span className="material-icons text-6xl mb-4">chat</span>
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isOwn = msg.sender?._id === currentUserId;
                                    return (
                                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-lg ${isOwn ? 'order-2' : 'order-1'}`}>
                                                {!isOwn && (
                                                    <p className="text-xs text-slate-500 mb-1 px-1">
                                                        {msg.sender?.fullName || msg.sender?.name || 'Unknown'}
                                                    </p>
                                                )}
                                                <div className={`rounded-lg p-3 ${isOwn
                                                    ? 'bg-[#0891b2] text-white'
                                                    : 'bg-[#e4dace] dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                    <p className="text-sm">{msg.content}</p>
                                                    {msg.attachments?.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {msg.attachments.map((att, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 text-xs">
                                                                    <span className="material-icons text-sm">attach_file</span>
                                                                    <span>{att.originalName}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 px-1">
                                                    {formatTime(msg.createdAt)}
                                                    {msg.isEdited && ' (edited)'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                                <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <span className="material-icons text-slate-400">attach_file</span>
                                </button>
                                <input
                                    type="text"
                                    className="flex-1 px-2 py-2 bg-transparent focus:outline-none text-slate-900 dark:text-white"
                                    placeholder="Type your secure message..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim()}
                                    className="bg-[#0891b2] hover:bg-teal-700 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-icons">send</span>
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="material-icons text-xs text-blue-500">shield</span>
                                <span className="text-xs text-slate-500">HIPAA COMPLIANT</span>
                                <span className="text-xs text-slate-400">All messages are end-to-end encrypted and HIPAA compliant</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <span className="material-icons text-6xl mb-4">chat_bubble_outline</span>
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
