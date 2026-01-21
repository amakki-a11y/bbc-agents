import { useState, useEffect } from 'react';
import { Bot, X, MessageCircle, Sparkles } from 'lucide-react';
import { http } from '../../api/http';
import BotChat from './BotChat';

const BotButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasEmployee, setHasEmployee] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        checkEmployeeAndUnread();
        const interval = setInterval(checkUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    // Show tooltip after hover delay
    useEffect(() => {
        let timer;
        if (isHovered && !isOpen) {
            timer = setTimeout(() => setShowTooltip(true), 500);
        } else {
            setShowTooltip(false);
        }
        return () => clearTimeout(timer);
    }, [isHovered, isOpen]);

    const checkEmployeeAndUnread = async () => {
        try {
            const response = await http.get('/bot/context');
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
            const response = await http.get('/bot/context');
            setUnreadCount(response.data.unreadMessages || 0);
        } catch (err) {
            console.error('Failed to check unread:', err);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        setUnreadCount(0);
        setShowTooltip(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!hasEmployee) {
        return null;
    }

    return (
        <>
            {/* Tooltip */}
            {showTooltip && !isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '92px',
                    right: '24px',
                    background: '#1f2937',
                    color: 'white',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    whiteSpace: 'nowrap',
                    animation: 'tooltipFadeIn 0.2s ease'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Sparkles size={14} style={{ color: '#a78bfa' }} />
                        Chat with BBC Assistant
                    </div>
                    {/* Tooltip Arrow */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '28px',
                        width: '12px',
                        height: '12px',
                        background: '#1f2937',
                        transform: 'rotate(45deg)'
                    }} />
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={isOpen ? handleClose : handleOpen}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isOpen
                        ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                        : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                    border: 'none',
                    boxShadow: isHovered
                        ? '0 8px 25px rgba(123, 104, 238, 0.5)'
                        : '0 4px 14px rgba(123, 104, 238, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered && !isOpen ? 'scale(1.1)' : 'scale(1)',
                    zIndex: 1001
                }}
            >
                {/* Icon with rotation animation */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                    {isOpen ? <X size={24} strokeWidth={2.5} /> : <MessageCircle size={24} strokeWidth={2} />}
                </div>

                {/* Unread Badge with Pulse Animation */}
                {!isOpen && unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                        animation: 'badgePulse 2s infinite'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}

                {/* Ripple effect ring */}
                {!isOpen && unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        inset: '-4px',
                        borderRadius: '50%',
                        border: '2px solid rgba(123, 104, 238, 0.4)',
                        animation: 'ripple 2s infinite'
                    }} />
                )}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={handleClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 999,
                        animation: 'fadeIn 0.2s ease'
                    }}
                />
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '96px',
                    right: '24px',
                    width: '380px',
                    maxWidth: 'calc(100vw - 48px)',
                    height: '540px',
                    maxHeight: 'calc(100vh - 140px)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    zIndex: 1000,
                    animation: 'panelSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <BotChat onClose={handleClose} />
                </div>
            )}

            <style>{`
                @keyframes panelSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes badgePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                @keyframes ripple {
                    0% {
                        transform: scale(1);
                        opacity: 0.4;
                    }
                    100% {
                        transform: scale(1.4);
                        opacity: 0;
                    }
                }

                @keyframes tooltipFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};

export default BotButton;
