import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Dashboard from './Dashboard';
import {
    Settings, Palette, Globe, Bell, Shield, Database,
    Monitor, Moon, Sun, Check, ChevronRight
} from 'lucide-react';

const SettingsPage = () => {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = useState('appearance');

    const sections = [
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'language', label: 'Language & Region', icon: Globe },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Shield },
    ];

    const themes = [
        { id: 'light', label: 'Light', icon: Sun, description: 'Clean and bright interface' },
        { id: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
        { id: 'system', label: 'System', icon: Monitor, description: 'Match system preferences' }
    ];

    const languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'es', label: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', label: 'French', flag: '🇫🇷' },
        { code: 'de', label: 'German', flag: '🇩🇪' },
        { code: 'ar', label: 'Arabic', flag: '🇸🇦' }
    ];

    const currentTheme = isDark ? 'dark' : 'light';

    return (
        <Dashboard>
            <div style={{
                height: '100%',
                overflow: 'auto',
                background: 'var(--bg-secondary)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '2rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-card)'
                }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <Settings size={28} />
                        Settings
                    </h1>
                    <p style={{
                        color: 'var(--text-muted)',
                        margin: '0.5rem 0 0 0',
                        fontSize: '0.95rem'
                    }}>
                        Manage your application preferences
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '2rem',
                    gap: '2rem'
                }}>
                    {/* Sidebar Navigation */}
                    <div style={{
                        width: '250px',
                        flexShrink: 0
                    }}>
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden'
                        }}>
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '1rem 1.25rem',
                                        border: 'none',
                                        background: activeSection === section.id ? 'var(--bg-hover)' : 'transparent',
                                        color: activeSection === section.id ? 'var(--primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textAlign: 'left',
                                        borderLeft: activeSection === section.id ? '3px solid var(--primary)' : '3px solid transparent',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <section.icon size={18} />
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1 }}>
                        {/* Appearance Section */}
                        {activeSection === 'appearance' && (
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                padding: '1.5rem'
                            }}>
                                <h2 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: '0 0 0.5rem 0'
                                }}>
                                    Appearance
                                </h2>
                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    margin: '0 0 1.5rem 0'
                                }}>
                                    Customize how the application looks
                                </p>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 1rem 0'
                                    }}>
                                        Theme
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '1rem'
                                    }}>
                                        {themes.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => {
                                                    if ((theme.id === 'dark' && !isDark) || (theme.id === 'light' && isDark)) {
                                                        toggleTheme();
                                                    }
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '1.5rem 1rem',
                                                    borderRadius: '12px',
                                                    border: currentTheme === theme.id ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                                                    background: currentTheme === theme.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    position: 'relative'
                                                }}
                                            >
                                                {currentTheme === theme.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        background: 'var(--primary)',
                                                        borderRadius: '50%',
                                                        padding: '2px'
                                                    }}>
                                                        <Check size={12} color="white" />
                                                    </div>
                                                )}
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: theme.id === 'dark' ? '#1e293b' : theme.id === 'light' ? '#f1f5f9' : 'linear-gradient(135deg, #f1f5f9 50%, #1e293b 50%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    <theme.icon size={24} color={theme.id === 'dark' ? '#94a3b8' : theme.id === 'light' ? '#475569' : '#6366f1'} />
                                                </div>
                                                <div>
                                                    <p style={{
                                                        color: 'var(--text-primary)',
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                        margin: 0
                                                    }}>
                                                        {theme.label}
                                                    </p>
                                                    <p style={{
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.75rem',
                                                        margin: '0.25rem 0 0 0'
                                                    }}>
                                                        {theme.description}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 1rem 0'
                                    }}>
                                        Accent Color
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'].map(color => (
                                            <button
                                                key={color}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: color,
                                                    border: color === '#6366f1' ? '3px solid var(--text-primary)' : '3px solid transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'transform 0.15s'
                                                }}
                                            >
                                                {color === '#6366f1' && <Check size={18} color="white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Language Section */}
                        {activeSection === 'language' && (
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                padding: '1.5rem'
                            }}>
                                <h2 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: '0 0 0.5rem 0'
                                }}>
                                    Language & Region
                                </h2>
                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    margin: '0 0 1.5rem 0'
                                }}>
                                    Set your preferred language and regional settings
                                </p>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 1rem 0'
                                    }}>
                                        Display Language
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {languages.map(lang => (
                                            <button
                                                key={lang.code}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '1rem',
                                                    borderRadius: '10px',
                                                    border: lang.code === 'en' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                    background: lang.code === 'en' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                                                    <span style={{
                                                        color: 'var(--text-primary)',
                                                        fontWeight: 500,
                                                        fontSize: '0.95rem'
                                                    }}>
                                                        {lang.label}
                                                    </span>
                                                </div>
                                                {lang.code === 'en' && (
                                                    <Check size={18} color="var(--primary)" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 1rem 0'
                                    }}>
                                        Date & Time Format
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            <label style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                                marginBottom: '0.5rem',
                                                display: 'block'
                                            }}>
                                                Date Format
                                            </label>
                                            <select style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer'
                                            }}>
                                                <option>MM/DD/YYYY</option>
                                                <option>DD/MM/YYYY</option>
                                                <option>YYYY-MM-DD</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                                marginBottom: '0.5rem',
                                                display: 'block'
                                            }}>
                                                Time Format
                                            </label>
                                            <select style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer'
                                            }}>
                                                <option>12-hour (AM/PM)</option>
                                                <option>24-hour</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Section */}
                        {activeSection === 'notifications' && (
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                padding: '1.5rem'
                            }}>
                                <h2 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: '0 0 0.5rem 0'
                                }}>
                                    Notifications
                                </h2>
                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    margin: '0 0 1.5rem 0'
                                }}>
                                    Control how you receive notifications
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[
                                        { label: 'Push Notifications', description: 'Receive browser push notifications', enabled: true },
                                        { label: 'Email Digest', description: 'Daily summary of activity', enabled: true },
                                        { label: 'Task Reminders', description: 'Get reminded before deadlines', enabled: true },
                                        { label: 'Mention Alerts', description: 'When someone mentions you', enabled: true },
                                        { label: 'Weekly Report', description: 'Weekly productivity summary', enabled: false }
                                    ].map((item, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            borderRadius: '10px',
                                            background: 'var(--bg-secondary)'
                                        }}>
                                            <div>
                                                <p style={{
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 500,
                                                    fontSize: '0.95rem',
                                                    margin: 0
                                                }}>
                                                    {item.label}
                                                </p>
                                                <p style={{
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                    margin: '0.25rem 0 0 0'
                                                }}>
                                                    {item.description}
                                                </p>
                                            </div>
                                            <div style={{
                                                width: '44px',
                                                height: '24px',
                                                borderRadius: '24px',
                                                background: item.enabled ? 'var(--primary)' : 'var(--bg-tertiary)',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}>
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    background: 'white',
                                                    position: 'absolute',
                                                    top: '3px',
                                                    left: item.enabled ? '23px' : '3px',
                                                    transition: 'left 0.2s',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Privacy Section */}
                        {activeSection === 'privacy' && (
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                padding: '1.5rem'
                            }}>
                                <h2 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: '0 0 0.5rem 0'
                                }}>
                                    Privacy
                                </h2>
                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    margin: '0 0 1.5rem 0'
                                }}>
                                    Manage your privacy settings
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[
                                        { label: 'Profile Visibility', description: 'Allow others to see your profile', enabled: true },
                                        { label: 'Activity Status', description: 'Show when you are online', enabled: true },
                                        { label: 'Read Receipts', description: 'Let others know when you read messages', enabled: false }
                                    ].map((item, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            borderRadius: '10px',
                                            background: 'var(--bg-secondary)'
                                        }}>
                                            <div>
                                                <p style={{
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 500,
                                                    fontSize: '0.95rem',
                                                    margin: 0
                                                }}>
                                                    {item.label}
                                                </p>
                                                <p style={{
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                    margin: '0.25rem 0 0 0'
                                                }}>
                                                    {item.description}
                                                </p>
                                            </div>
                                            <div style={{
                                                width: '44px',
                                                height: '24px',
                                                borderRadius: '24px',
                                                background: item.enabled ? 'var(--primary)' : 'var(--bg-tertiary)',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}>
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    background: 'white',
                                                    position: 'absolute',
                                                    top: '3px',
                                                    left: item.enabled ? '23px' : '3px',
                                                    transition: 'left 0.2s',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    marginTop: '2rem',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    <h3 style={{
                                        color: '#ef4444',
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        margin: '0 0 0.5rem 0'
                                    }}>
                                        Danger Zone
                                    </h3>
                                    <p style={{
                                        color: 'var(--text-muted)',
                                        fontSize: '0.85rem',
                                        margin: '0 0 1rem 0'
                                    }}>
                                        Permanently delete your account and all associated data
                                    </p>
                                    <button style={{
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default SettingsPage;
