import { useState, useEffect, useCallback } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import {
    Calendar, CalendarOff, Plus, ChevronLeft, ChevronRight,
    Check, X, Clock, AlertCircle, Filter, Download,
    User, Users, Building2, Loader2, CalendarDays
} from 'lucide-react';

const LeavePage = () => {
    // View state
    const [activeTab, setActiveTab] = useState('my'); // 'my', 'team', 'calendar'
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Data state
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [myBalance, setMyBalance] = useState([]);
    const [calendarLeaves, setCalendarLeaves] = useState([]);

    // Loading states
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loadingLeaves, setLoadingLeaves] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(true);

    // Modal states
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    // Calendar state
    const [calendarDate, setCalendarDate] = useState(new Date());

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    // Fetch leave types
    const fetchLeaveTypes = async () => {
        try {
            setLoadingTypes(true);
            const res = await http.get('/leave/types');
            setLeaveTypes(res.data || []);
        } catch (error) {
            console.error('Failed to fetch leave types:', error);
        } finally {
            setLoadingTypes(false);
        }
    };

    // Fetch my leaves
    const fetchMyLeaves = useCallback(async () => {
        try {
            setLoadingLeaves(true);
            const res = await http.get(`/leave/my?year=${selectedYear}`);
            setMyLeaves(res.data || []);
        } catch (error) {
            console.error('Failed to fetch my leaves:', error);
        } finally {
            setLoadingLeaves(false);
        }
    }, [selectedYear]);

    // Fetch my balance
    const fetchMyBalance = async () => {
        try {
            setLoadingBalance(true);
            const res = await http.get(`/leave/balance?year=${selectedYear}`);
            setMyBalance(res.data || []);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        } finally {
            setLoadingBalance(false);
        }
    };

    // Fetch team leaves
    const fetchTeamLeaves = useCallback(async () => {
        try {
            setLoadingLeaves(true);
            const [teamRes, pendingRes] = await Promise.all([
                http.get(`/leave/team?year=${selectedYear}`),
                http.get('/leave/pending')
            ]);
            setTeamLeaves(teamRes.data || []);
            setPendingApprovals(pendingRes.data || []);
        } catch (error) {
            console.error('Failed to fetch team leaves:', error);
        } finally {
            setLoadingLeaves(false);
        }
    }, [selectedYear]);

    // Fetch calendar data
    const fetchCalendarLeaves = useCallback(async () => {
        try {
            const month = calendarDate.getMonth() + 1;
            const year = calendarDate.getFullYear();
            const res = await http.get(`/leave/calendar?month=${month}&year=${year}`);
            setCalendarLeaves(res.data || []);
        } catch (error) {
            console.error('Failed to fetch calendar:', error);
        }
    }, [calendarDate]);

    useEffect(() => {
        fetchLeaveTypes();
        fetchMyBalance();
    }, [selectedYear]);

    useEffect(() => {
        if (activeTab === 'my') {
            fetchMyLeaves();
        } else if (activeTab === 'team') {
            fetchTeamLeaves();
        } else if (activeTab === 'calendar') {
            fetchCalendarLeaves();
        }
    }, [activeTab, fetchMyLeaves, fetchTeamLeaves, fetchCalendarLeaves]);

    // Request leave handler
    const handleRequestLeave = async (data) => {
        try {
            await http.post('/leave', data);
            setShowRequestModal(false);
            fetchMyLeaves();
            fetchMyBalance();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to request leave');
        }
    };

    // Cancel leave handler
    const handleCancelLeave = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
        try {
            await http.post(`/leave/${id}/cancel`);
            fetchMyLeaves();
            fetchMyBalance();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to cancel leave');
        }
    };

    // Approve leave handler
    const handleApproveLeave = async (id) => {
        try {
            await http.post(`/leave/${id}/approve`);
            setShowApprovalModal(null);
            fetchTeamLeaves();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to approve leave');
        }
    };

    // Reject leave handler
    const handleRejectLeave = async (id, reason) => {
        try {
            await http.post(`/leave/${id}/reject`, { reason });
            setShowApprovalModal(null);
            fetchTeamLeaves();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to reject leave');
        }
    };

    // Get status badge style
    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved':
                return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' };
            case 'pending':
                return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
            case 'rejected':
                return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
            case 'cancelled':
                return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
            default:
                return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
        }
    };

    // Filter leaves
    const filteredMyLeaves = filterStatus === 'all'
        ? myLeaves
        : myLeaves.filter(l => l.status === filterStatus);

    const filteredTeamLeaves = filterStatus === 'all'
        ? teamLeaves
        : teamLeaves.filter(l => l.status === filterStatus);

    return (
        <Dashboard>
            <div style={{ padding: '24px', height: '100%', overflow: 'auto', background: '#f9fafb' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(123, 104, 238, 0.3)'
                            }}>
                                <CalendarOff size={24} color="white" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                    Leave Management
                                </h1>
                                <p style={{ color: '#6b7280', marginTop: '4px', margin: 0 }}>
                                    Request and manage your leaves
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {/* Year Selector */}
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                style={{
                                    padding: '10px 14px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    background: 'white'
                                }}
                            >
                                {[2023, 2024, 2025, 2026].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            {/* Request Leave Button */}
                            <button
                                onClick={() => setShowRequestModal(true)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#6366f1';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#7b68ee';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    background: '#7b68ee',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Plus size={18} />
                                Request Leave
                            </button>
                        </div>
                    </div>

                    {/* Tab Toggle */}
                    <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                        <button
                            onClick={() => setActiveTab('my')}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: activeTab === 'my' ? 'white' : 'transparent',
                                color: activeTab === 'my' ? '#1f2937' : '#6b7280',
                                boxShadow: activeTab === 'my' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <User size={16} /> My Leaves
                        </button>
                        <button
                            onClick={() => setActiveTab('team')}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: activeTab === 'team' ? 'white' : 'transparent',
                                color: activeTab === 'team' ? '#1f2937' : '#6b7280',
                                boxShadow: activeTab === 'team' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <Users size={16} /> Team Leaves
                            {pendingApprovals.length > 0 && (
                                <span style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    marginLeft: '4px'
                                }}>
                                    {pendingApprovals.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: activeTab === 'calendar' ? 'white' : 'transparent',
                                color: activeTab === 'calendar' ? '#1f2937' : '#6b7280',
                                boxShadow: activeTab === 'calendar' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <CalendarDays size={16} /> Calendar
                        </button>
                    </div>
                </div>

                {/* Leave Balance Cards */}
                {activeTab === 'my' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {loadingBalance ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                Loading balance...
                            </div>
                        ) : myBalance.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                No leave types configured
                            </div>
                        ) : (
                            myBalance.map((balance, index) => {
                                const available = balance.total_days - balance.used_days - balance.pending_days;
                                const usedPercent = balance.total_days > 0
                                    ? ((balance.used_days + balance.pending_days) / balance.total_days) * 100
                                    : 0;

                                return (
                                    <div
                                        key={balance.leave_type_id || index}
                                        style={{
                                            background: 'white',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: '1px solid #e5e7eb',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                                                    {balance.leave_type?.name || 'Leave'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                    {balance.total_days > 0 ? `${balance.total_days} days/year` : 'Unlimited'}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    background: balance.leave_type?.color || '#7b68ee'
                                                }}
                                            />
                                        </div>

                                        {balance.total_days > 0 ? (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>
                                                        {available}
                                                    </span>
                                                    <span style={{ fontSize: '14px', color: '#6b7280', alignSelf: 'flex-end' }}>
                                                        / {balance.total_days} days
                                                    </span>
                                                </div>
                                                <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                                    <div
                                                        style={{
                                                            width: `${Math.min(usedPercent, 100)}%`,
                                                            height: '100%',
                                                            background: balance.leave_type?.color || '#7b68ee',
                                                            transition: 'width 0.3s ease'
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                                                    <span>Used: {balance.used_days}</span>
                                                    <span>Pending: {balance.pending_days}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#7b68ee' }}>
                                                Unlimited
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Filter Bar */}
                {(activeTab === 'my' || activeTab === 'team') && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    background: filterStatus === status ? '#f0edff' : '#f3f4f6',
                                    color: filterStatus === status ? '#7b68ee' : '#6b7280',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                )}

                {/* My Leaves Tab */}
                {activeTab === 'my' && (
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        {loadingLeaves ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                Loading leaves...
                            </div>
                        ) : filteredMyLeaves.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                                <CalendarOff size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                <p style={{ margin: 0, fontWeight: 500 }}>No leave requests found</p>
                                <p style={{ margin: '8px 0 0', fontSize: '14px' }}>
                                    Click &quot;Request Leave&quot; to create a new request
                                </p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Type</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Dates</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Days</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Reason</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMyLeaves.map((leave) => {
                                        const statusStyle = getStatusStyle(leave.status);
                                        return (
                                            <tr key={leave.id} style={{ borderBottom: '1px solid #f3f4f6' }} className="task-row">
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div
                                                            style={{
                                                                width: '10px',
                                                                height: '10px',
                                                                borderRadius: '50%',
                                                                background: leave.leave_type?.color || '#7b68ee'
                                                            }}
                                                        />
                                                        <span style={{ fontWeight: 500 }}>{leave.leave_type?.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', color: '#374151' }}>
                                                    {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    {' - '}
                                                    {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#1f2937' }}>
                                                    {leave.days}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        textTransform: 'capitalize',
                                                        background: statusStyle.bg,
                                                        color: statusStyle.color
                                                    }}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px', maxWidth: '200px' }}>
                                                    {leave.reason || '-'}
                                                    {leave.rejection_reason && (
                                                        <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                                                            Rejected: {leave.rejection_reason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    {leave.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleCancelLeave(leave.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '6px',
                                                                background: 'white',
                                                                color: '#6b7280',
                                                                fontSize: '13px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Team Leaves Tab */}
                {activeTab === 'team' && (
                    <>
                        {/* Pending Approvals Section */}
                        {pendingApprovals.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '12px' }}>
                                    Pending Approvals ({pendingApprovals.length})
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {pendingApprovals.map((leave) => (
                                        <div
                                            key={leave.id}
                                            style={{
                                                background: 'white',
                                                borderRadius: '12px',
                                                padding: '16px 20px',
                                                border: '2px solid #fde68a',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '16px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '16px'
                                                }}>
                                                    {leave.employee?.name?.charAt(0).toUpperCase() || 'E'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{leave.employee?.name}</div>
                                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                        {leave.leave_type?.name} • {leave.days} days
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleApproveLeave(leave.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '8px 16px',
                                                        background: '#16a34a',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => setShowApprovalModal(leave)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '8px 16px',
                                                        background: '#dc2626',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Team Leaves Table */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                                    Team Leave History
                                </h3>
                            </div>
                            {loadingLeaves ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    Loading team leaves...
                                </div>
                            ) : filteredTeamLeaves.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    No team leave requests found
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Employee</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Type</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Dates</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Days</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTeamLeaves.map((leave) => {
                                            const statusStyle = getStatusStyle(leave.status);
                                            return (
                                                <tr key={leave.id} style={{ borderBottom: '1px solid #f3f4f6' }} className="task-row">
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                fontSize: '14px'
                                                            }}>
                                                                {leave.employee?.name?.charAt(0).toUpperCase() || 'E'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 500, color: '#1f2937' }}>{leave.employee?.name}</div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{leave.employee?.department?.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: leave.leave_type?.color || '#7b68ee' }} />
                                                            {leave.leave_type?.name}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', color: '#374151' }}>
                                                        {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        {' - '}
                                                        {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>
                                                        {leave.days}
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            textTransform: 'capitalize',
                                                            background: statusStyle.bg,
                                                            color: statusStyle.color
                                                        }}>
                                                            {leave.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* Calendar Tab */}
                {activeTab === 'calendar' && (
                    <LeaveCalendar
                        calendarDate={calendarDate}
                        setCalendarDate={setCalendarDate}
                        calendarLeaves={calendarLeaves}
                        monthNames={monthNames}
                    />
                )}
            </div>

            {/* Request Leave Modal */}
            {showRequestModal && (
                <RequestLeaveModal
                    leaveTypes={leaveTypes}
                    balance={myBalance}
                    onClose={() => setShowRequestModal(false)}
                    onSubmit={handleRequestLeave}
                />
            )}

            {/* Reject Modal */}
            {showApprovalModal && (
                <RejectModal
                    leave={showApprovalModal}
                    onClose={() => setShowApprovalModal(null)}
                    onReject={handleRejectLeave}
                />
            )}
        </Dashboard>
    );
};

// Request Leave Modal Component
const RequestLeaveModal = ({ leaveTypes, balance, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        exclude_weekends: true
    });
    const [loading, setLoading] = useState(false);
    const [calculatedDays, setCalculatedDays] = useState(0);

    // Calculate days when dates change
    useEffect(() => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            let days = 0;
            const current = new Date(start);

            while (current <= end) {
                const dayOfWeek = current.getDay();
                if (!formData.exclude_weekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
                    days++;
                }
                current.setDate(current.getDate() + 1);
            }
            setCalculatedDays(days);
        } else {
            setCalculatedDays(0);
        }
    }, [formData.start_date, formData.end_date, formData.exclude_weekends]);

    const selectedBalance = balance.find(b => b.leave_type_id === formData.leave_type_id);
    const available = selectedBalance
        ? selectedBalance.total_days - selectedBalance.used_days - selectedBalance.pending_days
        : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.leave_type_id || !formData.start_date || !formData.end_date) return;

        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Request Leave</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={20} color="#6b7280" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Leave Type */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                Leave Type *
                            </label>
                            <select
                                value={formData.leave_type_id}
                                onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            >
                                <option value="">Select leave type</option>
                                {leaveTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                            {selectedBalance && selectedBalance.total_days > 0 && (
                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                                    Available balance: <span style={{ fontWeight: 600, color: available > 0 ? '#16a34a' : '#dc2626' }}>{available} days</span>
                                </div>
                            )}
                        </div>

                        {/* Date Range */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                    End Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    required
                                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Exclude Weekends */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="exclude_weekends"
                                checked={formData.exclude_weekends}
                                onChange={(e) => setFormData({ ...formData, exclude_weekends: e.target.checked })}
                                style={{ width: '16px', height: '16px', accentColor: '#7b68ee' }}
                            />
                            <label htmlFor="exclude_weekends" style={{ fontSize: '14px', color: '#374151' }}>
                                Exclude weekends
                            </label>
                        </div>

                        {/* Calculated Days */}
                        {calculatedDays > 0 && (
                            <div style={{
                                padding: '12px 16px',
                                background: '#f0edff',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ fontSize: '14px', color: '#6b7280' }}>Total days:</span>
                                <span style={{ fontSize: '20px', fontWeight: 700, color: '#7b68ee' }}>{calculatedDays}</span>
                            </div>
                        )}

                        {/* Reason */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                Reason (Optional)
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Enter reason for leave..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: '#f3f4f6',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#4b5563',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.leave_type_id || !formData.start_date || !formData.end_date}
                            style={{
                                padding: '10px 20px',
                                background: loading ? '#d1d5db' : '#7b68ee',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Reject Modal Component
const RejectModal = ({ leave, onClose, onReject }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onReject(leave.id, reason);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#dc2626' }}>
                        Reject Leave Request
                    </h3>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <p style={{ margin: 0, color: '#374151' }}>
                            Rejecting leave request from <strong>{leave.employee?.name}</strong> for{' '}
                            <strong>{leave.days} days</strong> of {leave.leave_type?.name}.
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                            Reason for rejection (Optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                </div>

                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#4b5563',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            background: loading ? '#d1d5db' : '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Rejecting...' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Leave Calendar Component
const LeaveCalendar = ({ calendarDate, setCalendarDate, calendarLeaves, monthNames }) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const navigateMonth = (direction) => {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCalendarDate(newDate);
    };

    const getDaysInMonth = () => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const getLeavesForDay = (date) => {
        if (!date) return [];
        return calendarLeaves.filter(leave => {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return date >= start && date <= end;
        });
    };

    const isToday = (date) => date?.toDateString() === new Date().toDateString();
    const isWeekend = (date) => date && (date.getDay() === 0 || date.getDay() === 6);

    return (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {/* Calendar Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb'
            }}>
                <button
                    onClick={() => navigateMonth(-1)}
                    style={{
                        background: 'none',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </h3>
                <button
                    onClick={() => navigateMonth(1)}
                    style={{
                        background: 'none',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Calendar Grid */}
            <div style={{ padding: '16px 24px 24px' }}>
                {/* Day names */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                    {dayNames.map(day => (
                        <div key={day} style={{
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#6b7280'
                        }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {getDaysInMonth().map((date, index) => {
                        const dayLeaves = getLeavesForDay(date);
                        const weekend = isWeekend(date);
                        const today = isToday(date);

                        return (
                            <div
                                key={index}
                                style={{
                                    minHeight: '80px',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    background: !date ? 'transparent'
                                        : today ? '#f0edff'
                                        : weekend ? '#f9fafb'
                                        : '#ffffff',
                                    border: today ? '2px solid #7b68ee' : '1px solid #e5e7eb',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {date && (
                                    <>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: today ? 700 : 500,
                                            color: today ? '#7b68ee' : weekend ? '#9ca3af' : '#374151',
                                            marginBottom: '4px'
                                        }}>
                                            {date.getDate()}
                                        </span>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                            {dayLeaves.slice(0, 3).map((leave, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        fontSize: '10px',
                                                        padding: '2px 4px',
                                                        borderRadius: '4px',
                                                        background: leave.leave_type?.color || '#7b68ee',
                                                        color: 'white',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                    title={`${leave.employee?.name} - ${leave.leave_type?.name}`}
                                                >
                                                    {leave.employee?.name?.split(' ')[0]}
                                                </div>
                                            ))}
                                            {dayLeaves.length > 3 && (
                                                <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
                                                    +{dayLeaves.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                {calendarLeaves.length > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                        marginTop: '20px',
                        paddingTop: '16px',
                        borderTop: '1px solid #e5e7eb'
                    }}>
                        {Array.from(new Set(calendarLeaves.map(l => l.leave_type_id))).map(typeId => {
                            const type = calendarLeaves.find(l => l.leave_type_id === typeId)?.leave_type;
                            return type ? (
                                <div key={typeId} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                                    <span style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '3px',
                                        background: type.color || '#7b68ee'
                                    }} />
                                    {type.name}
                                </div>
                            ) : null;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeavePage;
