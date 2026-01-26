import { useState, useEffect, useMemo } from 'react';
import {
    X, Save, Plus, Loader2, ChevronDown, ChevronRight, Lock, Info,
    Shield, Users, User, UserCheck, Heart, Eye, Crown, Star, Building,
    CheckSquare, Clock, Target, MessageCircle, BarChart2, Bot, Settings
} from 'lucide-react';
import { http } from '../../api/http';
import {
    PERMISSION_CATEGORIES,
    ROLE_COLORS,
    ROLE_ICONS,
    getAllPermissionKeys,
    getPermissionName
} from '../../config/permissions';
import usePermissionDependencies from '../../hooks/usePermissionDependencies';

// Icon component mapper
const IconComponent = ({ name, size = 20, ...props }) => {
    const icons = {
        shield: Shield, users: Users, user: User, 'user-check': UserCheck,
        'heart-handshake': Heart, eye: Eye, crown: Crown, star: Star,
        building: Building, 'check-square': CheckSquare, clock: Clock,
        target: Target, 'message-circle': MessageCircle, 'bar-chart-2': BarChart2,
        bot: Bot, settings: Settings
    };
    const Icon = icons[name?.toLowerCase()] || Shield;
    return <Icon size={size} {...props} />;
};

const RoleFormModal = ({ role = null, onClose, onSave, templates: _templates = [] }) => {
    const isEditMode = !!role;

    const [formData, setFormData] = useState({
        name: role?.name || '',
        description: role?.description || '',
        color: role?.color || '#6366f1',
        icon: role?.icon || 'shield',
        isDefault: role?.isDefault || false,
        permissionKeys: role?.permissionKeys || []
    });

    const [expandedCategories, setExpandedCategories] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [_showPreview, _setShowPreview] = useState(false);

    const {
        togglePermission,
        canDeselect,
        isRequiredBy,
        getAutoSelectInfo,
        validateDependencies
    } = usePermissionDependencies(formData.permissionKeys);

    // Initialize expanded categories
    useEffect(() => {
        const initialExpanded = {};
        Object.keys(PERMISSION_CATEGORIES).forEach(cat => {
            initialExpanded[cat] = true; // Start expanded
        });
        setExpandedCategories(initialExpanded);
    }, []);

    // Count selected permissions per category
    const categorySelectionCounts = useMemo(() => {
        const counts = {};
        Object.entries(PERMISSION_CATEGORIES).forEach(([catKey, category]) => {
            const catPermKeys = Object.keys(category.permissions);
            const selectedInCat = formData.permissionKeys.filter(k => catPermKeys.includes(k));
            counts[catKey] = {
                selected: selectedInCat.length,
                total: catPermKeys.length
            };
        });
        return counts;
    }, [formData.permissionKeys]);

    // Filter permissions based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return PERMISSION_CATEGORIES;

        const filtered = {};
        const query = searchQuery.toLowerCase();

        Object.entries(PERMISSION_CATEGORIES).forEach(([catKey, category]) => {
            const matchingPerms = {};
            Object.entries(category.permissions).forEach(([permKey, perm]) => {
                if (
                    perm.name.toLowerCase().includes(query) ||
                    perm.description.toLowerCase().includes(query) ||
                    permKey.toLowerCase().includes(query)
                ) {
                    matchingPerms[permKey] = perm;
                }
            });

            if (Object.keys(matchingPerms).length > 0) {
                filtered[catKey] = { ...category, permissions: matchingPerms };
            }
        });

        return filtered;
    }, [searchQuery]);

    const handlePermissionToggle = (permKey) => {
        const result = togglePermission(permKey, formData.permissionKeys);

        if (!result.success) {
            // Show warning toast or message
            setError(result.message);
            setTimeout(() => setError(''), 3000);
            return;
        }

        setFormData(prev => ({
            ...prev,
            permissionKeys: result.permissions
        }));

        // Show info about auto-selected dependencies
        if (result.addedDependencies?.length > 0) {
            // Could show a toast here
        }
    };

    const handleSelectAllInCategory = (catKey) => {
        const catPermKeys = Object.keys(PERMISSION_CATEGORIES[catKey].permissions);
        const newKeys = new Set(formData.permissionKeys);
        catPermKeys.forEach(k => newKeys.add(k));
        setFormData(prev => ({ ...prev, permissionKeys: Array.from(newKeys) }));
    };

    const handleDeselectAllInCategory = (catKey) => {
        const catPermKeys = Object.keys(PERMISSION_CATEGORIES[catKey].permissions);
        // Check if any can't be deselected
        const canDeselectAll = catPermKeys.every(k => {
            const result = canDeselect(k, formData.permissionKeys);
            return result.canDeselect || !formData.permissionKeys.includes(k);
        });

        if (!canDeselectAll) {
            setError('Some permissions cannot be deselected because they are required by other selected permissions.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setFormData(prev => ({
            ...prev,
            permissionKeys: prev.permissionKeys.filter(k => !catPermKeys.includes(k))
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Role name is required');
            return;
        }

        // Validate dependencies
        const validation = validateDependencies(formData.permissionKeys);
        if (!validation.valid) {
            setError('Permission dependencies are not satisfied');
            return;
        }

        try {
            setSaving(true);

            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                color: formData.color,
                icon: formData.icon,
                isDefault: formData.isDefault,
                permissionKeys: formData.permissionKeys
            };

            if (isEditMode) {
                await http.put(`/roles/${role.id}`, payload);
            } else {
                await http.post('/roles', payload);
            }

            onSave();
        } catch (error) {
            console.error('Failed to save role:', error);
            setError(error.response?.data?.error || 'Failed to save role');
        } finally {
            setSaving(false);
        }
    };

    const _applyTemplate = (template) => {
        setFormData({
            name: template.name,
            description: template.description,
            color: template.color,
            icon: template.icon || 'shield',
            isDefault: template.isDefault || false,
            permissionKeys: template.permissions.includes('*')
                ? getAllPermissionKeys()
                : template.permissions
        });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px',
                width: '100%', maxWidth: '800px', maxHeight: '90vh',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '10px',
                            background: formData.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <IconComponent name={formData.icon} size={24} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                                {isEditMode ? 'Edit Role' : 'Create New Role'}
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                {isEditMode ? 'Modify role settings and permissions' : 'Define a new role with specific permissions'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    {error && (
                        <div style={{
                            padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', color: '#dc2626', marginBottom: '16px', fontSize: '14px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <Info size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Basic Info Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                                    Role Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%', padding: '10px 14px',
                                        border: '1px solid #d1d5db', borderRadius: '8px',
                                        fontSize: '14px', outline: 'none'
                                    }}
                                    placeholder="e.g., Department Manager"
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{
                                        width: '100%', padding: '10px 14px',
                                        border: '1px solid #d1d5db', borderRadius: '8px',
                                        fontSize: '14px', outline: 'none', resize: 'vertical',
                                        minHeight: '60px'
                                    }}
                                    placeholder="Brief description of this role's responsibilities"
                                />
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                                    Color
                                </label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {ROLE_COLORS.map(color => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: color.value, border: 'none', cursor: 'pointer',
                                                outline: formData.color === color.value ? '2px solid #1f2937' : 'none',
                                                outlineOffset: '2px',
                                                transition: 'transform 0.1s'
                                            }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                                    Icon
                                </label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {ROLE_ICONS.map(icon => (
                                        <button
                                            key={icon.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: icon.value })}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: formData.icon === icon.value ? '#f3f4f6' : 'white',
                                                border: formData.icon === icon.value ? '2px solid #6366f1' : '1px solid #d1d5db',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title={icon.name}
                                        >
                                            <IconComponent name={icon.value} size={18} color={formData.icon === icon.value ? '#6366f1' : '#6b7280'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Default Role Checkbox */}
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '12px', background: '#f9fafb', borderRadius: '8px',
                            cursor: 'pointer', marginBottom: '24px'
                        }}>
                            <input
                                type="checkbox"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>Set as default role</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                    Automatically assign this role to new employees
                                </div>
                            </div>
                        </label>

                        {/* Permissions Section */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                                    Permissions
                                    <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 400, color: '#6b7280' }}>
                                        ({formData.permissionKeys.length} selected)
                                    </span>
                                </h3>
                                <input
                                    type="text"
                                    placeholder="Search permissions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        padding: '6px 12px', border: '1px solid #d1d5db',
                                        borderRadius: '6px', fontSize: '13px', width: '200px'
                                    }}
                                />
                            </div>

                            {/* Permission Categories */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.entries(filteredCategories).map(([catKey, category]) => (
                                    <div key={catKey} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                        {/* Category Header */}
                                        <div
                                            onClick={() => setExpandedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px 16px', background: '#f9fafb',
                                                cursor: 'pointer', userSelect: 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {expandedCategories[catKey] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{category.name}</span>
                                                <span style={{ fontSize: '12px', color: '#6b7280', background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px' }}>
                                                    {categorySelectionCounts[catKey]?.selected || 0} / {categorySelectionCounts[catKey]?.total || 0}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectAllInCategory(catKey)}
                                                    style={{
                                                        padding: '4px 8px', fontSize: '11px', fontWeight: 500,
                                                        border: '1px solid #d1d5db', borderRadius: '4px',
                                                        background: 'white', cursor: 'pointer', color: '#374151'
                                                    }}
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeselectAllInCategory(catKey)}
                                                    style={{
                                                        padding: '4px 8px', fontSize: '11px', fontWeight: 500,
                                                        border: '1px solid #d1d5db', borderRadius: '4px',
                                                        background: 'white', cursor: 'pointer', color: '#374151'
                                                    }}
                                                >
                                                    Deselect All
                                                </button>
                                            </div>
                                        </div>

                                        {/* Permission Items */}
                                        {expandedCategories[catKey] && (
                                            <div style={{ padding: '8px' }}>
                                                {Object.entries(category.permissions).map(([permKey, perm]) => {
                                                    const isSelected = formData.permissionKeys.includes(permKey);
                                                    const requiredByList = isRequiredBy(permKey, formData.permissionKeys);
                                                    const isLocked = requiredByList.length > 0;
                                                    const autoSelectInfo = getAutoSelectInfo(permKey, formData.permissionKeys);

                                                    return (
                                                        <label
                                                            key={permKey}
                                                            style={{
                                                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                                padding: '10px 12px', borderRadius: '6px',
                                                                background: isSelected ? '#f0f9ff' : 'transparent',
                                                                cursor: isLocked && isSelected ? 'not-allowed' : 'pointer',
                                                                opacity: isLocked && isSelected ? 0.8 : 1,
                                                                marginBottom: '4px'
                                                            }}
                                                            title={isLocked ? `Required by: ${requiredByList.map(k => getPermissionName(k)).join(', ')}` : ''}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => !isLocked && handlePermissionToggle(permKey)}
                                                                disabled={isLocked && isSelected}
                                                                style={{ width: '16px', height: '16px', marginTop: '2px' }}
                                                            />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ fontWeight: 500, fontSize: '13px', color: '#1f2937' }}>
                                                                        {perm.name}
                                                                    </span>
                                                                    {isLocked && isSelected && (
                                                                        <Lock size={12} color="#6b7280" title="Required by other permissions" />
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                                    {perm.description}
                                                                </div>
                                                                {!isSelected && autoSelectInfo.hasAutoSelect && (
                                                                    <div style={{ fontSize: '11px', color: '#0891b2', marginTop: '4px' }}>
                                                                        Will also select: {autoSelectInfo.willAutoSelectNames.join(', ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f9fafb'
                }}>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {formData.permissionKeys.length} permissions selected
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px', border: '1px solid #d1d5db',
                                background: 'white', borderRadius: '8px',
                                cursor: 'pointer', fontWeight: 500, fontSize: '14px'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !formData.name.trim()}
                            style={{
                                padding: '10px 24px', border: 'none',
                                background: saving || !formData.name.trim() ? '#9ca3af' : '#6366f1',
                                color: 'white', borderRadius: '8px',
                                cursor: saving || !formData.name.trim() ? 'not-allowed' : 'pointer',
                                fontWeight: 600, fontSize: '14px',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : isEditMode ? <Save size={18} /> : <Plus size={18} />}
                            {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Role'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleFormModal;
