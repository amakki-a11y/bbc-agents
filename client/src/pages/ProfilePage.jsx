import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import {
    User, Mail, Phone, Building2, Shield, Calendar, Clock,
    Edit2, Save, X, Camera, Key, Bell, Globe
} from 'lucide-react';
import http from '../api/http';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await http.get('/auth/me');
            setProfile(response.data);
            setFormData({
                username: response.data.username || '',
                email: response.data.email || '',
                phone: response.data.employee?.phone || '',
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await http.put('/auth/profile', formData);
            await fetchProfile();
            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Key },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    if (loading) {
        return (
            <Dashboard>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: 'var(--text-muted)'
                }}>
                    Loading profile...
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div style={{
                height: '100%',
                overflow: 'auto',
                background: 'var(--bg-secondary)'
            }}>
                {/* Header Banner */}
                <div style={{
                    background: 'var(--primary-gradient)',
                    height: '200px',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        bottom: '-50px',
                        left: '2rem',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '1.5rem'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '24px',
                            background: 'var(--bg-card)',
                            border: '4px solid var(--bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            boxShadow: 'var(--shadow-lg)'
                        }}>
                            {profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ paddingBottom: '0.5rem' }}>
                            <h1 style={{
                                color: 'white',
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                margin: 0,
                                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {profile?.username || 'User'}
                            </h1>
                            <p style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '0.95rem',
                                margin: 0
                            }}>
                                {profile?.employee?.role?.name || 'Team Member'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '4rem 2rem 2rem' }}>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '2rem',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '1rem'
                    }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {/* Personal Information */}
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                padding: '1.5rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h2 style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: 0
                                    }}>
                                        Personal Information
                                    </h2>
                                    {!editing ? (
                                        <button
                                            onClick={() => setEditing(true)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <Edit2 size={16} />
                                            Edit
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setEditing(false)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'transparent',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="btn-modern btn-modern-primary"
                                                style={{ padding: '0.5rem 1rem' }}
                                            >
                                                <Save size={16} />
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <User size={14} />
                                            Username
                                        </label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                        ) : (
                                            <p style={{
                                                color: 'var(--text-primary)',
                                                fontSize: '0.95rem',
                                                margin: 0
                                            }}>
                                                {profile?.username || '-'}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <Mail size={14} />
                                            Email
                                        </label>
                                        {editing ? (
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                        ) : (
                                            <p style={{
                                                color: 'var(--text-primary)',
                                                fontSize: '0.95rem',
                                                margin: 0
                                            }}>
                                                {profile?.email || '-'}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <Phone size={14} />
                                            Phone
                                        </label>
                                        <p style={{
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem',
                                            margin: 0
                                        }}>
                                            {profile?.employee?.phone || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Work Information */}
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                padding: '1.5rem'
                            }}>
                                <h2 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: '0 0 1.5rem 0'
                                }}>
                                    Work Information
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <Building2 size={14} />
                                            Department
                                        </label>
                                        <p style={{
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem',
                                            margin: 0
                                        }}>
                                            {profile?.employee?.department?.name || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <Shield size={14} />
                                            Role
                                        </label>
                                        <p style={{
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem',
                                            margin: 0
                                        }}>
                                            {profile?.employee?.role?.name || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <Calendar size={14} />
                                            Joined
                                        </label>
                                        <p style={{
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem',
                                            margin: 0
                                        }}>
                                            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            padding: '1.5rem',
                            maxWidth: '600px'
                        }}>
                            <h2 style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: '0 0 1.5rem 0'
                            }}>
                                Change Password
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        display: 'block'
                                    }}>
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter current password"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        display: 'block'
                                    }}>
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        display: 'block'
                                    }}>
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <button
                                    className="btn-modern btn-modern-primary"
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    Update Password
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            padding: '1.5rem',
                            maxWidth: '600px'
                        }}>
                            <h2 style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: '0 0 1.5rem 0'
                            }}>
                                Notification Preferences
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'Email notifications', description: 'Receive email updates about your tasks' },
                                    { label: 'Task assignments', description: 'Get notified when assigned to a task' },
                                    { label: 'Task comments', description: 'Get notified when someone comments on your tasks' },
                                    { label: 'Due date reminders', description: 'Receive reminders before task deadlines' }
                                ].map((item, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: 'var(--bg-secondary)'
                                    }}>
                                        <div>
                                            <p style={{
                                                color: 'var(--text-primary)',
                                                fontSize: '0.95rem',
                                                fontWeight: 500,
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
                                        <label style={{
                                            position: 'relative',
                                            display: 'inline-block',
                                            width: '44px',
                                            height: '24px'
                                        }}>
                                            <input
                                                type="checkbox"
                                                defaultChecked
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={{
                                                position: 'absolute',
                                                cursor: 'pointer',
                                                inset: 0,
                                                backgroundColor: 'var(--primary)',
                                                borderRadius: '24px',
                                                transition: '0.2s'
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    content: '""',
                                                    height: '18px',
                                                    width: '18px',
                                                    left: '3px',
                                                    bottom: '3px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '50%',
                                                    transition: '0.2s',
                                                    transform: 'translateX(20px)'
                                                }} />
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default ProfilePage;
