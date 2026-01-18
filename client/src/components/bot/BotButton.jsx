import { useState, useEffect } from 'react';
import { Bot, X, MessageCircle } from 'lucide-react';
import { http } from '../../api/http';
import BotChat from './BotChat';

const BotButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasEmployee, setHasEmployee] = useState(true);

    useEffect(() => {
        checkEmployeeAndUnread();
        // Poll for unread messages every 30 seconds
        const interval = setInterval(checkUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkEmployeeAndUnread = async () => {
        try {
            const response = await http.get('/api/bot/context');
            setHasEmployee(true);
            setUnreadCount(response.data.unreadMessages || 0);
        } catch (err) {
            if (err.response?.status === 400) {
                setHasEmployee(false);
            }
        }
    };

    const checkUnread = async () => {
        if (!hasEmployee) return;
        try {
            const response = await http.get('/api/bot/context');
            setUnreadCount(response.data.unreadMessages || 0);
        } catch (err) {
            console.error('Failed to check unread:', err);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        setUnreadCount(0);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const buttonStyle = {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary)',
        border: 'none',
        boxShadow: '0 4px 12px rgba(123, 104, 238, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        transition: 'all 0.3s ease',
        zIndex: 1000
    };

    const badgeStyle = {
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        backgroundColor: 'var(--danger)',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white'
    };

    const panelStyle = {
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        width: '400px',
        maxWidth: 'calc(100vw - 48px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderRadius: '16px',
        overflow: 'hidden',
        zIndex: 1001,
        animation: 'slideUp 0.3s ease'
    };

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 999,
        animation: 'fadeIn 0.2s ease'
    };

    if (!hasEmployee) {
        return null; // Don't show bot button if user doesn't have employee profile
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={isOpen ? handleClose : handleOpen}
                style={{
                    ...buttonStyle,
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
                    backgroundColor: isOpen ? '#6a5acd' : 'var(--primary)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
                {!isOpen && unreadCount > 0 && (
                    <span style={badgeStyle}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <>
                    <div style={overlayStyle} onClick={handleClose} />
                    <div style={panelStyle}>
                        <BotChat />
                    </div>
                </>
            )}

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default BotButton;
