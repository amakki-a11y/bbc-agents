import { useState, useEffect } from 'react';
import { http } from '../api/http';
import {
    Inbox, Mail, MailOpen, Filter, Search, Plus, ChevronDown,
    User, Users, Building2, Bot, Clock, Check, Archive, Trash2
} from 'lucide-react';

const InboxPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [filter, setFilter] = useState('all'); // all, unread, hr, manager
    const [searchQuery, setSearchQuery] = useState('');
    const [showCompose, setShowCompose] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await http.get('/bot/history?limit=100');
            // Filter to show only bot messages (inbox items)
            const inboxMessages = (res.data || []).filter(m => m.sender === 'bot');
            setMessages(inboxMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            // Use mock data if API fails
            setMessages([
                {
                    id: 1,
                    content: '**Welcome to BBC Agents!**\n\nYour account has been set up. Please complete your profile.',
                    sender: 'bot',
                    message_type: 'announcement',
                    status: 'delivered',
                    created_at: new Date().toISOString(),
                    metadata: { from: 'HR' }
                },
                {
                    id: 2,
                    content: 'Reminder: Team meeting tomorrow at 10 AM.',
                    sender: 'bot',
                    message_type: 'request',
                    status: 'read',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    metadata: { from: 'Manager' }
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            await http.post('/bot/read', { messageIds: [messageId] });
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, status: 'read' } : m
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleSelectMessage = (message) => {
        setSelectedMessage(message);
        if (message.status !== 'read') {
            markAsRead(message.id);
        }
    };

    const filteredMessages = messages.filter(m => {
        if (filter === 'unread' && m.status === 'read') return false;
        if (filter === 'hr' && m.metadata?.from !== 'HR') return false;
        if (filter === 'manager' && m.metadata?.from !== 'Manager') return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return m.content.toLowerCase().includes(query);
        }
        return true;
    });

    const getMessageIcon = (message) => {
        const type = message.metadata?.from?.toLowerCase();
        switch (type) {
            case 'hr':
                return <Building2 size={16} style={{ color: '#8b5cf6' }} />;
            case 'manager':
                return <User size={16} style={{ color: '#3b82f6' }} />;
            case 'system':
                return <Bot size={16} style={{ color: '#6b7280' }} />;
            default:
                return <Mail size={16} style={{ color: '#6b7280' }} />;
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const parseMarkdown = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
    };

    if (loading) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9fafb'
            }}>
                Loading messages...
            </div>
        );
    }

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            background: '#f9fafb',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Messages List */}
            <div style={{
                width: '400px',
                borderRight: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                background: 'white'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                    }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Inbox size={24} />
                            Inbox
                        </h1>
                        <button
                            onClick={() => setShowCompose(true)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#6366f1';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#7b68ee';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '0.5rem 1rem',
                                background: '#7b68ee',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Plus size={16} />
                            Compose
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{
                        position: 'relative',
                        marginBottom: '0.75rem'
                    }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#7b68ee';
                                e.target.style.boxShadow = '0 0 0 3px rgba(123, 104, 238, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                            }}
                        />
                    </div>

                    {/* Filters */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem'
                    }}>
                        {[
                            { value: 'all', label: 'All' },
                            { value: 'unread', label: 'Unread' },
                            { value: 'hr', label: 'From HR' },
                            { value: 'manager', label: 'From Manager' }
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                style={{
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    background: filter === f.value ? '#f0edff' : '#f3f4f6',
                                    color: filter === f.value ? '#7b68ee' : '#6b7280',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredMessages.length > 0 ? filteredMessages.map(message => (
                        <div
                            key={message.id}
                            onClick={() => handleSelectMessage(message)}
                            style={{
                                padding: '1rem 1.25rem',
                                borderBottom: '1px solid #f3f4f6',
                                cursor: 'pointer',
                                background: selectedMessage?.id === message.id ? '#f9fafb' :
                                           message.status !== 'read' ? '#fefefe' : 'white',
                                borderLeft: message.status !== 'read' ? '3px solid #7b68ee' : '3px solid transparent',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedMessage?.id !== message.id) {
                                    e.currentTarget.style.background = '#f9fafb';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedMessage?.id !== message.id) {
                                    e.currentTarget.style.background = message.status !== 'read' ? '#fefefe' : 'white';
                                }
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem'
                            }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getMessageIcon(message)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{
                                            fontSize: '0.875rem',
                                            fontWeight: message.status !== 'read' ? 600 : 500,
                                            color: '#1f2937'
                                        }}>
                                            {message.metadata?.from || 'System'}
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: '#9ca3af'
                                        }}>
                                            {formatTime(message.created_at)}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: '#6b7280',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {message.content.replace(/\*\*/g, '').substring(0, 60)}...
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            color: '#9ca3af'
                        }}>
                            <Inbox size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ margin: 0, fontWeight: 500 }}>No messages</p>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                                Your inbox is empty
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Detail */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'white'
            }}>
                {selectedMessage ? (
                    <>
                        {/* Detail Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '10px',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {getMessageIcon(selectedMessage)}
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        color: '#1f2937'
                                    }}>
                                        {selectedMessage.metadata?.from || 'System'}
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Clock size={12} />
                                        {new Date(selectedMessage.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '36px',
                                        height: '36px',
                                        background: '#f3f4f6',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Archive size={18} />
                                </button>
                                <button
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '36px',
                                        height: '36px',
                                        background: '#f3f4f6',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Message Content */}
                        <div style={{
                            flex: 1,
                            padding: '1.5rem',
                            overflowY: 'auto'
                        }}>
                            <div
                                style={{
                                    fontSize: '0.95rem',
                                    lineHeight: 1.7,
                                    color: '#374151'
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(selectedMessage.content)
                                }}
                            />
                        </div>

                        {/* Reply Box */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid #e5e7eb',
                            background: '#f9fafb'
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: '0.75rem'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Type a reply..."
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem 1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        background: 'white'
                                    }}
                                />
                                <button
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#6366f1';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#7b68ee';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        background: '#7b68ee',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af'
                    }}>
                        <MailOpen size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>
                            Select a message
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                            Choose a message from the list to view its contents
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxPage;
