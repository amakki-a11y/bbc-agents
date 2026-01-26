import { Filter, X } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' }
];

const PRIORITY_OPTIONS = [
    { value: 'all', label: 'All Priorities' },
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
];

function ProjectFilters({ filters, onChange }) {
    const hasActiveFilters = filters.status !== 'all' ||
        filters.priority !== 'all' ||
        !filters.showAIGenerated ||
        !filters.showPendingApproval;

    const resetFilters = () => {
        onChange({
            status: 'all',
            priority: 'all',
            showAIGenerated: true,
            showPendingApproval: true
        });
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
        }}>
            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#6b7280' }}>Status:</label>
                <select
                    value={filters.status}
                    onChange={(e) => onChange({ ...filters, status: e.target.value })}
                    style={{
                        padding: '6px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        color: filters.status !== 'all' ? '#6366f1' : '#374151'
                    }}
                >
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Priority Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#6b7280' }}>Priority:</label>
                <select
                    value={filters.priority}
                    onChange={(e) => onChange({ ...filters, priority: e.target.value })}
                    style={{
                        padding: '6px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        color: filters.priority !== 'all' ? '#6366f1' : '#374151'
                    }}
                >
                    {PRIORITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Toggle Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    cursor: 'pointer'
                }}>
                    <input
                        type="checkbox"
                        checked={filters.showAIGenerated}
                        onChange={(e) => onChange({ ...filters, showAIGenerated: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                    />
                    Show AI Projects
                </label>

                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    cursor: 'pointer'
                }}>
                    <input
                        type="checkbox"
                        checked={filters.showPendingApproval}
                        onChange={(e) => onChange({ ...filters, showPendingApproval: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                    />
                    Show Pending
                </label>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <button
                    onClick={resetFilters}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    <X size={14} />
                    Clear Filters
                </button>
            )}
        </div>
    );
}

export default ProjectFilters;
