import { useState, useEffect, useRef } from 'react';
import { http } from '../../api/http';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';

const BotChat = ({ isFullPage = false }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Load conversation history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadHistory = async () => {
        try {
            const response = await http.get('/api/bot/history?limit=50');
            setMessages(response.data);
            // Mark messages as read
            await http.post('/api/bot/read');
        } catch (err) {
            console.error('Failed to load history:', err);
            // Show welcome message if no history
            if (err.response?.status === 400) {
                setMessages([{
                    id: 'welcome',
                    content: 'Welcome! I\'m your BBC Assistant. Type "help" to see what I can do.',
                    sender: 'bot',
                    created_at: new Date().toISOString()
                }]);
            }
        }
    };

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            id: `temp-${Date.now()}`,
            content: inputValue.trim(),
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
                content: userMessage.content
            });

            // Replace temp message with actual and add bot response
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
        } catch (err) {
            console.error('Failed to send message:', err);
            setError(err.response?.data?.message || 'Failed to send message. Please try again.');
            // Remove the temp message on error
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

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatContent = (content) => {
        // Convert markdown-like formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');
    };

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        height: isFullPage ? 'calc(100vh - 80px)' : '500px',
        maxHeight: isFullPage ? 'none' : '600px',
        backgroundColor: 'var(--bg-dark)',
        borderRadius: isFullPage ? '0' : '12px',
        overflow: 'hidden',
        border: isFullPage ? 'none' : '1px solid var(--border)'
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: 'var(--primary)',
        color: 'white'
    };

    const messagesContainerStyle = {
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#f8f9fc'
    };

    const messageStyle = (isBot) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: isBot ? 'flex-start' : 'flex-end',
        maxWidth: '80%',
        alignSelf: isBot ? 'flex-start' : 'flex-end'
    });

    const bubbleStyle = (isBot) => ({
        padding: '12px 16px',
        borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
        backgroundColor: isBot ? 'white' : 'var(--primary)',
        color: isBot ? 'var(--text-main)' : 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        lineHeight: '1.5',
        fontSize: '14px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    });

    const inputContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: 'white',
        borderTop: '1px solid var(--border)'
    };

    const inputStyle = {
        flex: 1,
        padding: '12px 16px',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-main)',
        resize: 'none'
    };

    const sendButtonStyle = {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: isLoading || !inputValue.trim() ? '#ccc' : 'var(--primary)',
        border: 'none',
        color: 'white',
        cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Bot size={24} />
                </div>
                <div>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>BBC Assistant</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {isTyping ? 'Typing...' : 'Online'}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={messagesContainerStyle}>
                {messages.length === 0 && !isLoading && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                        <Bot size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>Start a conversation with your BBC Assistant</p>
                        <p style={{ fontSize: '14px' }}>Type "help" to see what I can do</p>
                    </div>
                )}

                {messages.map((message) => (
                    <div key={message.id} style={messageStyle(message.sender === 'bot')}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            {message.sender === 'bot' && (
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    flexShrink: 0
                                }}>
                                    <Bot size={16} />
                                </div>
                            )}
                            <div
                                style={bubbleStyle(message.sender === 'bot')}
                                dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                            />
                            {message.sender === 'employee' && (
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--bg-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)',
                                    flexShrink: 0
                                }}>
                                    <User size={16} />
                                </div>
                            )}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            marginLeft: message.sender === 'bot' ? '36px' : '0',
                            marginRight: message.sender === 'employee' ? '36px' : '0'
                        }}>
                            {formatTime(message.created_at)}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div style={messageStyle(true)}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Bot size={16} />
                            </div>
                            <div style={{
                                ...bubbleStyle(true),
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                                <span>Bot is typing...</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: '#fff5f5',
                        borderRadius: '8px',
                        color: 'var(--danger)'
                    }}>
                        <AlertCircle size={16} />
                        <span style={{ fontSize: '14px' }}>{error}</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={inputContainerStyle}>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    style={inputStyle}
                    disabled={isLoading}
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    style={sendButtonStyle}
                >
                    {isLoading ? (
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default BotChat;
