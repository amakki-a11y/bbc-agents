import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import Dashboard from './Dashboard';

const AccessDeniedPage = () => {
    const navigate = useNavigate();

    return (
        <Dashboard>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '400px',
                padding: '40px 20px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px'
                }}>
                    <ShieldX size={40} color="#ef4444" />
                </div>

                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0 0 12px 0'
                }}>
                    Access Denied
                </h1>

                <p style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    margin: '0 0 8px 0',
                    maxWidth: '400px'
                }}>
                    You don't have permission to view this page.
                </p>

                <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    margin: '0 0 32px 0',
                    opacity: 0.8
                }}>
                    Contact your administrator if you need access.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '12px'
                }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-primary)';
                        }}
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                    >
                        <Home size={18} />
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </Dashboard>
    );
};

export default AccessDeniedPage;
