import { useState } from 'react';
import { useClients } from '../../context/ClientsContext';
import { X, User, Building2, Phone, Mail, MapPin, Tag } from 'lucide-react';

const AddClientModal = ({ onClose, onSuccess }) => {
    const { createClient } = useClients();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        alternatePhone: '',
        companyName: '',
        jobTitle: '',
        website: '',
        source: 'OTHER',
        status: 'LEAD',
        stage: 'NEW',
        rating: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createClient(formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const sources = [
        { value: 'WEBSITE', label: 'Website' },
        { value: 'REFERRAL', label: 'Referral' },
        { value: 'SOCIAL_MEDIA', label: 'Social Media' },
        { value: 'COLD_CALL', label: 'Cold Call' },
        { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
        { value: 'ADVERTISEMENT', label: 'Advertisement' },
        { value: 'TRADE_SHOW', label: 'Trade Show' },
        { value: 'PARTNER', label: 'Partner' },
        { value: 'OTHER', label: 'Other' }
    ];

    const tabs = [
        { id: 'personal', label: 'Personal', icon: User },
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'address', label: 'Address', icon: MapPin }
    ];

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        marginBottom: '0.5rem',
        fontWeight: 500
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        Add New Contact
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '0.5rem'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-color)',
                    padding: '0 1.5rem'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem 1.25rem',
                                border: 'none',
                                background: 'transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                marginBottom: '-1px'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{
                        padding: '1.5rem',
                        maxHeight: 'calc(90vh - 200px)',
                        overflowY: 'auto'
                    }}>
                        {error && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px',
                                color: '#ef4444',
                                marginBottom: '1rem',
                                fontSize: '0.9rem'
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Personal Info Tab */}
                        {activeTab === 'personal' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>First Name *</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            placeholder="John"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Last Name *</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            placeholder="Doe"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@example.com"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+1 234 567 890"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Lead Source</label>
                                        <select
                                            name="source"
                                            value={formData.source}
                                            onChange={handleChange}
                                            style={inputStyle}
                                        >
                                            {sources.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Rating</label>
                                        <select
                                            name="rating"
                                            value={formData.rating}
                                            onChange={handleChange}
                                            style={inputStyle}
                                        >
                                            <option value="">Select rating</option>
                                            <option value="HOT">Hot - High priority</option>
                                            <option value="WARM">Warm - Interested</option>
                                            <option value="COLD">Cold - Low engagement</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            style={inputStyle}
                                        >
                                            <option value="LEAD">Lead</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Stage</label>
                                        <select
                                            name="stage"
                                            value={formData.stage}
                                            onChange={handleChange}
                                            style={inputStyle}
                                        >
                                            <option value="NEW">New</option>
                                            <option value="CONTACTED">Contacted</option>
                                            <option value="QUALIFIED">Qualified</option>
                                            <option value="PROPOSAL">Proposal</option>
                                            <option value="NEGOTIATION">Negotiation</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Company Info Tab */}
                        {activeTab === 'company' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Company Name</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Acme Corp"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Job Title</label>
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        value={formData.jobTitle}
                                        onChange={handleChange}
                                        placeholder="CEO"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Website</label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://example.com"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Alternate Phone</label>
                                    <input
                                        type="tel"
                                        name="alternatePhone"
                                        value={formData.alternatePhone}
                                        onChange={handleChange}
                                        placeholder="+1 234 567 891"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Address Tab */}
                        {activeTab === 'address' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Street Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="123 Main Street"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="New York"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>State/Province</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            placeholder="NY"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            placeholder="United States"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Postal Code</label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            placeholder="10001"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        padding: '1.25rem 1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.firstName || !formData.lastName}
                            className="btn-modern btn-modern-primary"
                            style={{ opacity: loading || !formData.firstName || !formData.lastName ? 0.5 : 1 }}
                        >
                            {loading ? 'Creating...' : 'Add Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
