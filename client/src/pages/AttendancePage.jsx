import { useState, useEffect, useCallback } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import {
    Clock, LogIn, LogOut, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, CheckCircle, XCircle,
    AlertCircle, Coffee, Palmtree, Users, User, Download,
    X, Edit2, Save, Loader2
} from 'lucide-react';

const AttendancePage = () => {
    // View state
    const [activeTab, setActiveTab] = useState('my'); // 'my' or 'team'
    const [selectedDate, setSelectedDate] = useState(new Date());

    // My attendance data
    const [myAttendance, setMyAttendance] = useState({ records: [], summary: {} });
    const [todayStatus, setTodayStatus] = useState(null);
    const [loadingMy, setLoadingMy] = useState(true);

    // Team attendance data
    const [teamAttendance, setTeamAttendance] = useState({ team: [], todaySummary: {} });
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [filterDepartment, setFilterDepartment] = useState('');

    // Actions state
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);

    // Modal state
    const [selectedDay, setSelectedDay] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

    // Helpers
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Fetch my attendance for selected month
    const fetchMyAttendance = useCallback(async () => {
        try {
            setLoadingMy(true);
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;

            const [attendanceRes, todayRes] = await Promise.all([
                http.get(`/attendance/me?year=${year}&month=${month}`),
                http.get('/attendance/me/today')
            ]);

            setMyAttendance(attendanceRes.data || { records: [], summary: {} });
            setTodayStatus(todayRes.data);
        } catch (error) {
            console.error('Failed to fetch my attendance:', error);
        } finally {
            setLoadingMy(false);
        }
    }, [selectedDate]);

    // Fetch team attendance
    const fetchTeamAttendance = useCallback(async () => {
        try {
            setLoadingTeam(true);
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;

            const params = new URLSearchParams({ year, month });
            if (filterDepartment) params.append('department_id', filterDepartment);

            const [teamRes, deptRes] = await Promise.all([
                http.get(`/attendance/team?${params.toString()}`),
                http.get('/departments')
            ]);

            setTeamAttendance(teamRes.data || { team: [], todaySummary: {} });
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Failed to fetch team attendance:', error);
        } finally {
            setLoadingTeam(false);
        }
    }, [selectedDate, filterDepartment]);

    useEffect(() => {
        fetchMyAttendance();
    }, [fetchMyAttendance]);

    useEffect(() => {
        if (activeTab === 'team') {
            fetchTeamAttendance();
        }
    }, [activeTab, fetchTeamAttendance]);

    // Check in/out handlers
    const handleCheckIn = async () => {
        try {
            setCheckingIn(true);
            await http.post('/attendance/check-in');
            await fetchMyAttendance();
        } catch (error) {
            console.error('Check-in failed:', error);
            alert(error.response?.data?.error || 'Check-in failed');
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setCheckingOut(true);
            await http.post('/attendance/check-out');
            await fetchMyAttendance();
        } catch (error) {
            console.error('Check-out failed:', error);
            alert(error.response?.data?.error || 'Check-out failed');
        } finally {
            setCheckingOut(false);
        }
    };

    // Calendar navigation
    const navigateMonth = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedDate(newDate);
    };

    // Get days in month for calendar grid
    const getDaysInMonth = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
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

    // Get attendance for a specific day
    const getAttendanceForDay = (date) => {
        if (!date) return null;
        return myAttendance.records.find(r => {
            const recordDate = new Date(r.date);
            return recordDate.toDateString() === date.toDateString();
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return { bg: '#dcfce7', border: '#16a34a', text: '#166534' };
            case 'late': return { bg: '#fef3c7', border: '#d97706', text: '#92400e' };
            case 'absent': return { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' };
            case 'on_leave': return { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' };
            case 'half_day': return { bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6' };
            default: return { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280' };
        }
    };

    // Get status icon
    const getStatusIcon = (status, size = 16) => {
        switch (status) {
            case 'present': return <CheckCircle size={size} color="#16a34a" />;
            case 'late': return <AlertCircle size={size} color="#d97706" />;
            case 'absent': return <XCircle size={size} color="#dc2626" />;
            case 'on_leave': return <Palmtree size={size} color="#3b82f6" />;
            case 'half_day': return <Coffee size={size} color="#7c3aed" />;
            default: return <Clock size={size} color="#6b7280" />;
        }
    };

    // Check if date is today
    const isToday = (date) => date?.toDateString() === new Date().toDateString();

    // Check if date is weekend
    const isWeekend = (date) => date && (date.getDay() === 0 || date.getDay() === 6);

    // Check if date is in the future
    const isFuture = (date) => date && date > new Date();

    // Export to CSV
    const exportToCSV = () => {
        const rows = myAttendance.records.map(r => ({
            Date: new Date(r.date).toLocaleDateString(),
            'Check In': r.check_in ? new Date(r.check_in).toLocaleTimeString() : '-',
            'Check Out': r.check_out ? new Date(r.check_out).toLocaleTimeString() : '-',
            Status: r.status,
            Notes: r.notes || ''
        }));

        const headers = Object.keys(rows[0] || {});
        const csv = [
            headers.join(','),
            ...rows.map(r => headers.map(h => `"${r[h] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}.csv`;
        a.click();
    };

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
                                <Clock size={24} color="white" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                    Attendance
                                </h1>
                                <p style={{ color: '#6b7280', marginTop: '4px', margin: 0 }}>
                                    Track your attendance and work hours
                                </p>
                            </div>
                        </div>

                        {/* Tab Toggle */}
                        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
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
                                <User size={16} /> My Attendance
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
                                <Users size={16} /> Team Attendance
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'my' ? (
                    <>
                        {/* Check In/Out Card */}
                        <div style={{
                            background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '24px',
                            color: 'white'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </h2>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '14px' }}>
                                        <div>
                                            <span style={{ opacity: 0.8 }}>Check In:</span>{' '}
                                            <span style={{ fontWeight: 600 }}>
                                                {todayStatus?.checkInTime
                                                    ? new Date(todayStatus.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Not yet'}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ opacity: 0.8 }}>Check Out:</span>{' '}
                                            <span style={{ fontWeight: 600 }}>
                                                {todayStatus?.checkOutTime
                                                    ? new Date(todayStatus.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Not yet'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={handleCheckIn}
                                        disabled={checkingIn || todayStatus?.hasCheckedIn}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 24px',
                                            background: todayStatus?.hasCheckedIn ? 'rgba(255,255,255,0.3)' : 'white',
                                            color: todayStatus?.hasCheckedIn ? 'white' : '#16a34a',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: 600,
                                            cursor: todayStatus?.hasCheckedIn ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            opacity: checkingIn ? 0.7 : 1
                                        }}
                                    >
                                        <LogIn size={18} />
                                        {todayStatus?.hasCheckedIn ? 'Checked In' : checkingIn ? 'Checking...' : 'Check In'}
                                    </button>
                                    <button
                                        onClick={handleCheckOut}
                                        disabled={checkingOut || !todayStatus?.hasCheckedIn || todayStatus?.hasCheckedOut}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 24px',
                                            background: todayStatus?.hasCheckedOut ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            border: '2px solid white',
                                            borderRadius: '10px',
                                            fontWeight: 600,
                                            cursor: (!todayStatus?.hasCheckedIn || todayStatus?.hasCheckedOut) ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            opacity: checkingOut || !todayStatus?.hasCheckedIn ? 0.7 : 1
                                        }}
                                    >
                                        <LogOut size={18} />
                                        {todayStatus?.hasCheckedOut ? 'Checked Out' : checkingOut ? 'Checking...' : 'Check Out'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Days Present</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#14532d' }}>
                                    {myAttendance.summary?.present || 0}
                                </div>
                            </div>
                            <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                <div style={{ color: '#b45309', fontSize: '14px', fontWeight: 500 }}>Days Late</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#78350f' }}>
                                    {myAttendance.summary?.late || 0}
                                </div>
                            </div>
                            <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                <div style={{ color: '#b91c1c', fontSize: '14px', fontWeight: 500 }}>Days Absent</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#7f1d1d' }}>
                                    {myAttendance.summary?.absent || 0}
                                </div>
                            </div>
                            <div style={{ background: '#dbeafe', padding: '20px', borderRadius: '12px', border: '1px solid #93c5fd' }}>
                                <div style={{ color: '#1d4ed8', fontSize: '14px', fontWeight: 500 }}>Days On Leave</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e40af' }}>
                                    {myAttendance.summary?.onLeave || 0}
                                </div>
                            </div>
                            <div style={{ background: '#f5f3ff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                                <div style={{ color: '#6d28d9', fontSize: '14px', fontWeight: 500 }}>Attendance Rate</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#4c1d95' }}>
                                    {myAttendance.summary?.attendanceRate || 100}%
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '24px' }}>
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
                                    <CalendarIcon size={20} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
                                    {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
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
                                {loadingMy ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        Loading calendar...
                                    </div>
                                ) : (
                                    <>
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
                                                const attendance = getAttendanceForDay(date);
                                                const statusColor = attendance ? getStatusColor(attendance.status) : null;
                                                const weekend = isWeekend(date);
                                                const future = isFuture(date);
                                                const today = isToday(date);

                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={() => date && !future && setSelectedDay({ date, attendance })}
                                                        style={{
                                                            minHeight: '70px',
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            background: !date ? 'transparent'
                                                                : today ? '#ede9fe'
                                                                : statusColor ? statusColor.bg
                                                                : weekend ? '#f9fafb'
                                                                : future ? '#fafafa'
                                                                : '#ffffff',
                                                            border: today ? '2px solid #7b68ee'
                                                                : statusColor ? `2px solid ${statusColor.border}`
                                                                : '1px solid #e5e7eb',
                                                            cursor: date && !future ? 'pointer' : 'default',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            opacity: future ? 0.5 : 1
                                                        }}
                                                    >
                                                        {date && (
                                                            <>
                                                                <span style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: today ? 700 : 500,
                                                                    color: today ? '#7b68ee'
                                                                        : statusColor ? statusColor.text
                                                                        : weekend ? '#9ca3af'
                                                                        : '#374151'
                                                                }}>
                                                                    {date.getDate()}
                                                                </span>
                                                                {attendance && (
                                                                    <>
                                                                        {getStatusIcon(attendance.status, 18)}
                                                                        <span style={{
                                                                            fontSize: '10px',
                                                                            color: statusColor?.text,
                                                                            textTransform: 'capitalize'
                                                                        }}>
                                                                            {attendance.status?.replace('_', ' ')}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {weekend && !attendance && (
                                                                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                                                        Weekend
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Legend */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            flexWrap: 'wrap',
                                            gap: '20px',
                                            marginTop: '20px',
                                            paddingTop: '16px',
                                            borderTop: '1px solid #e5e7eb'
                                        }}>
                                            {[
                                                { status: 'present', label: 'Present' },
                                                { status: 'late', label: 'Late' },
                                                { status: 'absent', label: 'Absent' },
                                                { status: 'on_leave', label: 'On Leave' },
                                                { status: 'half_day', label: 'Half Day' }
                                            ].map(item => {
                                                const color = getStatusColor(item.status);
                                                return (
                                                    <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                                                        <span style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '3px',
                                                            background: color.bg,
                                                            border: `2px solid ${color.border}`
                                                        }} />
                                                        {item.label}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Attendance History */}
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '16px 24px',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                                    Attendance History
                                </h3>
                                <button
                                    onClick={exportToCSV}
                                    disabled={!myAttendance.records?.length}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        background: 'white',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: '#374151'
                                    }}
                                >
                                    <Download size={16} /> Export CSV
                                </button>
                            </div>

                            {myAttendance.records?.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    No attendance records for this month
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Check In</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Check Out</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Hours</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myAttendance.records?.slice(0, 10).map((record, index) => {
                                            const hoursWorked = record.check_in && record.check_out
                                                ? ((new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)).toFixed(1)
                                                : '-';
                                            const statusColor = getStatusColor(record.status);
                                            return (
                                                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }} className="task-row">
                                                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                                                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', textAlign: 'center', color: record.check_in ? '#16a34a' : '#9ca3af' }}>
                                                        {record.check_in
                                                            ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : '-'}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', textAlign: 'center', color: record.check_out ? '#dc2626' : '#9ca3af' }}>
                                                        {record.check_out
                                                            ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : '-'}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#6b7280' }}>
                                                        {hoursWorked !== '-' ? `${hoursWorked}h` : '-'}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            background: statusColor.bg,
                                                            color: statusColor.text,
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {getStatusIcon(record.status, 14)}
                                                            {record.status?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '14px' }}>
                                                        {record.notes || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    /* Team Attendance Tab */
                    <>
                        {/* Team Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Present Today</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#14532d' }}>
                                    {teamAttendance.todaySummary?.present || 0}
                                </div>
                            </div>
                            <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                <div style={{ color: '#b45309', fontSize: '14px', fontWeight: 500 }}>Late Today</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#78350f' }}>
                                    {teamAttendance.todaySummary?.late || 0}
                                </div>
                            </div>
                            <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                <div style={{ color: '#b91c1c', fontSize: '14px', fontWeight: 500 }}>Absent Today</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#7f1d1d' }}>
                                    {teamAttendance.todaySummary?.absent || 0}
                                </div>
                            </div>
                            <div style={{ background: '#dbeafe', padding: '20px', borderRadius: '12px', border: '1px solid #93c5fd' }}>
                                <div style={{ color: '#1d4ed8', fontSize: '14px', fontWeight: 500 }}>On Leave</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e40af' }}>
                                    {teamAttendance.todaySummary?.onLeave || 0}
                                </div>
                            </div>
                            <div style={{ background: '#f5f3ff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                                <div style={{ color: '#6d28d9', fontSize: '14px', fontWeight: 500 }}>Total Employees</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#4c1d95' }}>
                                    {teamAttendance.todaySummary?.totalEmployees || 0}
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                style={{
                                    padding: '10px 14px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    minWidth: '180px'
                                }}
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
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
                                    <ChevronLeft size={18} />
                                </button>
                                <span style={{ fontWeight: 600, minWidth: '140px', textAlign: 'center' }}>
                                    {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                                </span>
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
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Team Attendance Table */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            {loadingTeam ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    Loading team attendance...
                                </div>
                            ) : teamAttendance.team?.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    No team data available
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Employee</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Present</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Late</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Absent</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>On Leave</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Rate</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamAttendance.team?.map((item, index) => {
                                            const total = item.summary.present + item.summary.late + item.summary.absent;
                                            const rate = total > 0 ? Math.round(((item.summary.present + item.summary.late) / total) * 100) : 100;
                                            return (
                                                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }} className="task-row">
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                fontSize: '14px'
                                                            }}>
                                                                {item.employee.name?.charAt(0).toUpperCase() || 'E'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: '#1f2937' }}>{item.employee.name}</div>
                                                                <div style={{ fontSize: '13px', color: '#6b7280' }}>{item.employee.department}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '8px',
                                                            background: '#dcfce7',
                                                            color: '#166534',
                                                            fontWeight: 600,
                                                            fontSize: '14px'
                                                        }}>
                                                            {item.summary.present}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '8px',
                                                            background: '#fef3c7',
                                                            color: '#92400e',
                                                            fontWeight: 600,
                                                            fontSize: '14px'
                                                        }}>
                                                            {item.summary.late}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '8px',
                                                            background: '#fee2e2',
                                                            color: '#991b1b',
                                                            fontWeight: 600,
                                                            fontSize: '14px'
                                                        }}>
                                                            {item.summary.absent}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '8px',
                                                            background: '#dbeafe',
                                                            color: '#1d4ed8',
                                                            fontWeight: 600,
                                                            fontSize: '14px'
                                                        }}>
                                                            {item.summary.onLeave}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            fontWeight: 700,
                                                            color: rate >= 90 ? '#16a34a' : rate >= 70 ? '#d97706' : '#dc2626'
                                                        }}>
                                                            {rate}%
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => setEditingRecord(item)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '6px',
                                                                background: 'white',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                color: '#6b7280'
                                                            }}
                                                        >
                                                            View Details
                                                        </button>
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
            </div>

            {/* Day Details Modal */}
            {selectedDay && (
                <DayDetailsModal
                    day={selectedDay}
                    onClose={() => setSelectedDay(null)}
                />
            )}

            {/* Employee Attendance Modal */}
            {editingRecord && (
                <EmployeeAttendanceModal
                    data={editingRecord}
                    onClose={() => setEditingRecord(null)}
                    onUpdate={fetchTeamAttendance}
                />
            )}
        </Dashboard>
    );
};

// Day Details Modal
const DayDetailsModal = ({ day, onClose }) => {
    const { date, attendance } = day;

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
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                        {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={20} color="#6b7280" />
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {attendance ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '16px',
                                background: '#f9fafb',
                                borderRadius: '12px',
                                gap: '12px'
                            }}>
                                {attendance.status === 'present' && <CheckCircle size={24} color="#16a34a" />}
                                {attendance.status === 'late' && <AlertCircle size={24} color="#d97706" />}
                                {attendance.status === 'absent' && <XCircle size={24} color="#dc2626" />}
                                {attendance.status === 'on_leave' && <Palmtree size={24} color="#3b82f6" />}
                                {attendance.status === 'half_day' && <Coffee size={24} color="#7c3aed" />}
                                <span style={{ fontSize: '18px', fontWeight: 600, textTransform: 'capitalize' }}>
                                    {attendance.status?.replace('_', ' ')}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '4px' }}>Check In</div>
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#14532d' }}>
                                        {attendance.check_in
                                            ? new Date(attendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '-'}
                                    </div>
                                </div>
                                <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#b91c1c', marginBottom: '4px' }}>Check Out</div>
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#7f1d1d' }}>
                                        {attendance.check_out
                                            ? new Date(attendance.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '-'}
                                    </div>
                                </div>
                            </div>

                            {attendance.check_in && attendance.check_out && (
                                <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#6d28d9', marginBottom: '4px' }}>Hours Worked</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#4c1d95' }}>
                                        {((new Date(attendance.check_out) - new Date(attendance.check_in)) / (1000 * 60 * 60)).toFixed(1)} hours
                                    </div>
                                </div>
                            )}

                            {attendance.notes && (
                                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Notes</div>
                                    <div style={{ color: '#374151' }}>{attendance.notes}</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                            <Clock size={48} color="#e5e7eb" style={{ marginBottom: '12px' }} />
                            <p>No attendance record for this day</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Employee Attendance Modal (for managers)
const EmployeeAttendanceModal = ({ data, onClose, onUpdate }) => {
    const [records] = useState(data.records || []);

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
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                            {data.employee.name}
                        </h3>
                        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
                            {data.employee.department} - {data.employee.role}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={20} color="#6b7280" />
                    </button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', background: '#dcfce7', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#166534' }}>{data.summary.present}</div>
                            <div style={{ fontSize: '11px', color: '#15803d' }}>Present</div>
                        </div>
                        <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#92400e' }}>{data.summary.late}</div>
                            <div style={{ fontSize: '11px', color: '#b45309' }}>Late</div>
                        </div>
                        <div style={{ padding: '12px', background: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#991b1b' }}>{data.summary.absent}</div>
                            <div style={{ fontSize: '11px', color: '#b91c1c' }}>Absent</div>
                        </div>
                        <div style={{ padding: '12px', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d4ed8' }}>{data.summary.onLeave}</div>
                            <div style={{ fontSize: '11px', color: '#1d4ed8' }}>Leave</div>
                        </div>
                    </div>

                    {/* Records list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {records.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                No attendance records this month
                            </div>
                        ) : (
                            records.map((record, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: '#f9fafb',
                                    borderRadius: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>
                                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                            {record.check_in
                                                ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '-'} - {record.check_out
                                                ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '-'}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        textTransform: 'capitalize',
                                        background: record.status === 'present' ? '#dcfce7' :
                                            record.status === 'late' ? '#fef3c7' :
                                            record.status === 'absent' ? '#fee2e2' :
                                            record.status === 'on_leave' ? '#dbeafe' : '#f3f4f6',
                                        color: record.status === 'present' ? '#166534' :
                                            record.status === 'late' ? '#92400e' :
                                            record.status === 'absent' ? '#991b1b' :
                                            record.status === 'on_leave' ? '#1d4ed8' : '#374151'
                                    }}>
                                        {record.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
