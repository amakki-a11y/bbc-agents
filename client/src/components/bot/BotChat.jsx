import { useState, useEffect, useRef } from 'react';
import { http } from '../../api/http';
import {
    Send, Bot, User, AlertCircle, X, Maximize2, Minimize2,
    Paperclip, Smile, Clock, CheckCircle2, Calendar, ListTodo,
    RefreshCw, Copy, Check, Sparkles
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const QUICK_ACTIONS = [
    { label: 'Check In', command: 'check in', icon: Clock },
    { label: 'My Tasks', command: 'show my tasks', icon: ListTodo },
    { label: 'Request Leave', command: 'request leave', icon: Calendar },
    { label: 'Help', command: 'help', icon: Sparkles }
];

const TypingIndicator = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 16px'
    }}>
        <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#9ca3af',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0s'
        }} />
        <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#9ca3af',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0.16s'
        }} />
        <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#9ca3af',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0.32s'
        }} />
    </div>
);

const MessageBubble = ({ message, isBot, onCopy, onRetry }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onCopy) onCopy();
    };

    const formatContent = (content) => {
        if (!content) return '';
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>')
            .replace(/\n/g, '<br />');
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isBot ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                animation: 'messageSlideIn 0.3s ease'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                flexDirection: isBot ? 'row' : 'row-reverse'
            }}>
                {/* Avatar */}
                {isBot && (
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(123, 104, 238, 0.2)'
                    }}>
                        <Bot size={14} />
                    </div>
                )}

                {/* Bubble */}
                <div style={{
                    position: 'relative',
                    padding: '12px 16px',
                    borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    background: isBot
                        ? 'white'
                        : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                    color: isBot ? '#374151' : 'white',
                    boxShadow: isBot
                        ? '0 1px 3px rgba(0, 0, 0, 0.08)'
                        : '0 2px 8px rgba(123, 104, 238, 0.25)',
                    lineHeight: 1.5,
                    fontSize: '14px'
                }}>
                    <div dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} />

                    {/* Message Actions */}
                    {isHovered && (
                        <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: isBot ? 'auto' : '-8px',
                            left: isBot ? '-8px' : 'auto',
                            display: 'flex',
                            gap: '4px',
                            background: 'white',
                            borderRadius: '8px',
                            padding: '4px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                            <button
                                onClick={handleCopy}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: copied ? '#10b981' : '#6b7280',
                                    cursor: 'pointer'
                                }}
                                title="Copy"
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            {isBot && onRetry && (
                                <button
                                    onClick={onRetry}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                    title="Regenerate"
                                >
                                    <RefreshCw size={12} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* User Avatar */}
                {!isBot && (
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        flexShrink: 0
                    }}>
                        <User size={14} />
                    </div>
                )}
            </div>

            {/* Timestamp */}
            <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginTop: '4px',
                marginLeft: isBot ? '36px' : '0',
                marginRight: !isBot ? '36px' : '0'
            }}>
                {formatTime(message.created_at)}
            </div>
        </div>
    );
};

const EmptyState = ({ onQuickAction }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        height: '100%'
    }}>
        <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
        }}>
            <Bot size={40} style={{ color: '#7c3aed' }} />
        </div>
        <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '8px'
        }}>
            Hi! I'm BBC Assistant
        </h3>
        <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '24px',
            maxWidth: '280px'
        }}>
            I can help you with tasks, attendance, and more. Try one of these:
        </p>
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center'
        }}>
            {QUICK_ACTIONS.map((action) => (
                <button
                    key={action.command}
                    onClick={() => onQuickAction(action.command)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        fontSize: '13px',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#7c3aed';
                        e.currentTarget.style.color = '#7c3aed';
                        e.currentTarget.style.background = '#faf5ff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.background = 'white';
                    }}
                >
                    <action.icon size={14} />
                    {action.label}
                </button>
            ))}
        </div>
    </div>
);

const BotChat = ({ isFullPage = false, onClose, initialCommand = null }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [lastProcessedCommand, setLastProcessedCommand] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const textareaRef = useRef(null);
    const { fetchTasks } = useProject();

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        if (initialCommand && initialCommand !== lastProcessedCommand) {
            setLastProcessedCommand(initialCommand);
            sendMessage(initialCommand);
        }
    }, [initialCommand]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
        }
    }, [inputValue]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadHistory = async () => {
        try {
            const response = await http.get('/api/bot/history?limit=50');
            setMessages(response.data);
            await http.post('/api/bot/read');
        } catch (err) {
            console.error('Failed to load history:', err);
            if (err.response?.status === 400) {
                setMessages([]);
            }
        }
    };

    const sendMessage = async (content = inputValue) => {
        const trimmedContent = content.trim();
        if (!trimmedContent || isLoading) return;

        const userMessage = {
            id: `temp-${Date.now()}`,
            content: trimmedContent,
            sender: 'employee',
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setIsTyping(true);
        setError(null);

        try {
            const response = await http.post('/api/bot/message', {
                content: trimmedContent
            });

            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== userMessage.id);
                return [
                    ...filtered,
                    {
                        id: response.data.userMessage.id,
                        content: response.data.userMessage.content,
                        sender: 'employee',
                        created_at: response.data.userMessage.created_at
                    },
                    {
                        id: response.data.botMessage.id,
                        content: response.data.botMessage.content,
                        sender: 'bot',
                        message_type: response.data.botMessage.message_type,
                        metadata: response.data.botMessage.metadata,
                        created_at: response.data.botMessage.created_at
                    }
                ];
            });

            const metadata = response.data.botMessage.metadata;
            const botContent = response.data.botMessage.content?.toLowerCase() || '';
            if (
                (metadata && (metadata.action === 'task_created' || metadata.task)) ||
                botContent.includes('created a new task') ||
                botContent.includes('task has been added')
            ) {
                fetchTasks();
            }

        } catch (err) {
            console.error('Failed to send message:', err);
            setError({
                message: err.response?.data?.message || 'Failed to send message',
                originalContent: trimmedContent
            });
            setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleQuickAction = (command) => {
        sendMessage(command);
    };

    const handleRetry = () => {
        if (error?.originalContent) {
            sendMessage(error.originalContent);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: isFullPage ? 'calc(100vh - 80px)' : '100%',
            background: 'white',
            borderRadius: isFullPage ? '0' : '20px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: 'white',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Bot Avatar */}
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Bot size={22} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '16px' }}>BBC Assistant</div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            opacity: 0.9
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isTyping ? '#fbbf24' : '#10b981',
                                boxShadow: `0 0 6px ${isTyping ? '#fbbf24' : '#10b981'}`
                            }} />
                            {isTyping ? 'Typing...' : 'Online'}
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {!isFullPage && onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: '#f9fafb'
                }}
            >
                {messages.length === 0 && !isLoading ? (
                    <EmptyState onQuickAction={handleQuickAction} />
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isBot={message.sender === 'bot'}
                            />
                        ))}

                        {isTyping && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '8px',
                                maxWidth: '85%'
                            }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    flexShrink: 0
                                }}>
                                    <Bot size={14} />
                                </div>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '4px 16px 16px 16px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                                }}>
                                    <TypingIndicator />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 16px',
                                background: '#fef2f2',
                                borderRadius: '12px',
                                border: '1px solid #fecaca'
                            }}>
                                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                                <span style={{ fontSize: '14px', color: '#b91c1c', flex: 1 }}>
                                    {error.message}
                                </span>
                                <button
                                    onClick={handleRetry}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '6px 12px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <RefreshCw size={12} />
                                    Retry
                                </button>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    style={{
                        position: 'absolute',
                        bottom: '90px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        color: '#6b7280',
                        cursor: 'pointer'
                    }}
                >
                    New messages
                </button>
            )}

            {/* Quick Actions (shown when there are messages) */}
            {messages.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '12px 16px 0',
                    background: 'white',
                    borderTop: '1px solid #f3f4f6',
                    overflowX: 'auto'
                }}>
                    {QUICK_ACTIONS.slice(0, 3).map((action) => (
                        <button
                            key={action.command}
                            onClick={() => handleQuickAction(action.command)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: '16px',
                                fontSize: '12px',
                                color: '#6b7280',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#7c3aed';
                                e.currentTarget.style.color = '#7c3aed';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.color = '#6b7280';
                            }}
                        >
                            <action.icon size={12} />
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '10px',
                padding: '12px 16px 16px',
                background: 'white',
                borderTop: messages.length > 0 ? 'none' : '1px solid #f3f4f6'
            }}>
                {/* Input Container */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '24px',
                    background: '#f3f4f6',
                    border: '1px solid transparent',
                    transition: 'all 0.15s'
                }}>
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: '14px',
                            color: '#1f2937',
                            resize: 'none',
                            minHeight: '20px',
                            maxHeight: '100px',
                            lineHeight: '20px'
                        }}
                    />
                </div>

                {/* Send Button */}
                <button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !inputValue.trim()}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: inputValue.trim()
                            ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
                            : '#e5e7eb',
                        border: 'none',
                        color: 'white',
                        cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: inputValue.trim()
                            ? '0 4px 12px rgba(123, 104, 238, 0.3)'
                            : 'none',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                        if (inputValue.trim()) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {isLoading ? (
                        <div style={{
                            width: '18px',
                            height: '18px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    ) : (
                        <Send size={18} style={{
                            transform: 'translateX(1px)'
                        }} />
                    )}
                </button>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                    }
                    40% {
                        transform: scale(1);
                    }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes messageSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Custom Scrollbar */
                div::-webkit-scrollbar {
                    width: 6px;
                }

                div::-webkit-scrollbar-track {
                    background: transparent;
                }

                div::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                }

                div::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </div>
    );
};

export default BotChat;
