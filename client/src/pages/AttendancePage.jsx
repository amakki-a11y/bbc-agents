import { useState, useEffect } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import {
    Clock, LogIn, LogOut, Users, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, Filter, CheckCircle, XCircle,
    AlertCircle, Coffee
} from 'lucide-react';

const AttendancePage = () => {
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [myAttendance, setMyAttendance] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [filterDepartment, setFilterDepartment] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('today'); // 'today' or 'calendar'
    const [calendarData, setCalendarData] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [attendanceRes, deptRes] = await Promise.all([
                http.get('/api/attendance/today'),
                http.get('/api/departments')
            ]);
            setTodayAttendance(attendanceRes.data);
            setDepartments(deptRes.data);

            // Find current user's attendance
            const records = attendanceRes.data?.records || [];
            // For demo, we'll assume first record could be current user
            // In production, you'd match by user ID
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendarData = async () => {
        try {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;
            const res = await http.get(`/api/attendance/monthly?year=${year}&month=${month}`);
            setCalendarData(res.data || []);
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
            setCalendarData([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (viewMode === 'calendar') {
            fetchCalendarData();
        }
    }, [selectedDate, viewMode]);

    const handleCheckIn = async () => {
        try {
            setCheckingIn(true);
            await http.post('/api/attendance/check-in');
            fetchData();
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
            await http.post('/api/attendance/check-out');
            fetchData();
        } catch (error) {
            console.error('Check-out failed:', error);
            alert(error.response?.data?.error || 'Check-out failed');
        } finally {
            setCheckingOut(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <CheckCircle size={16} color="#16a34a" />;
            case 'late':
                return <AlertCircle size={16} color="#d97706" />;
            case 'absent':
                return <XCircle size={16} color="#dc2626" />;
            case 'half_day':
                return <Coffee size={16} color="#7c3aed" />;
            default:
                return <Clock size={16} color="#6b7280" />;
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            present: { bg: '#dcfce7', color: '#166534' },
            late: { bg: '#fef3c7', color: '#92400e' },
            absent: { bg: '#fee2e2', color: '#991b1b' },
            half_day: { bg: '#ede9fe', color: '#5b21b6' }
        };
        const style = styles[status] || { bg: '#f3f4f6', color: '#374151' };
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                background: style.bg,
                color: style.color,
                textTransform: 'capitalize',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                {getStatusIcon(status)}
                {status?.replace('_', ' ') || 'Unknown'}
            </span>
        );
    };

    const filteredRecords = (todayAttendance?.records || []).filter(record => {
        if (!filterDepartment) return true;
        return record.employee?.department?.id === filterDepartment;
    });

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add empty slots for days before the first day
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const navigateMonth = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedDate(newDate);
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <Dashboard>
            <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                <Clock size={28} style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
                                Attendance
                            </h1>
                            <p style={{ color: '#6b7280', marginTop: '4px' }}>
                                Track employee attendance and time
                            </p>
                        </div>

                        {/* View Mode Toggle */}
                        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setViewMode('today')}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    background: viewMode === 'today' ? 'white' : 'transparent',
                                    color: viewMode === 'today' ? '#1f2937' : '#6b7280',
                                    boxShadow: viewMode === 'today' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    background: viewMode === 'calendar' ? 'white' : 'transparent',
                                    color: viewMode === 'calendar' ? '#1f2937' : '#6b7280',
                                    boxShadow: viewMode === 'calendar' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <CalendarIcon size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                Calendar
                            </button>
                        </div>
                    </div>
                </div>

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
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                                Current time: {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleCheckIn}
                                disabled={checkingIn}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: 'white',
                                    color: '#16a34a',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    opacity: checkingIn ? 0.7 : 1
                                }}
                            >
                                <LogIn size={18} />
                                {checkingIn ? 'Checking In...' : 'Check In'}
                            </button>
                            <button
                                onClick={handleCheckOut}
                                disabled={checkingOut}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '2px solid white',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    opacity: checkingOut ? 0.7 : 1
                                }}
                            >
                                <LogOut size={18} />
                                {checkingOut ? 'Checking Out...' : 'Check Out'}
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'today' ? (
                    <>
                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Present</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#14532d' }}>
                                    {todayAttendance?.present || 0}
                                </div>
                            </div>
                            <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                <div style={{ color: '#b45309', fontSize: '14px', fontWeight: 500 }}>Late</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#78350f' }}>
                                    {todayAttendance?.late || 0}
                                </div>
                            </div>
                            <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                <div style={{ color: '#b91c1c', fontSize: '14px', fontWeight: 500 }}>Absent</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#7f1d1d' }}>
                                    {(todayAttendance?.totalActive || 0) - (todayAttendance?.checkedIn || 0)}
                                </div>
                            </div>
                            <div style={{ background: '#ede9fe', padding: '20px', borderRadius: '12px', border: '1px solid #c4b5fd' }}>
                                <div style={{ color: '#6d28d9', fontSize: '14px', fontWeight: 500 }}>On Leave</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#4c1d95' }}>
                                    {todayAttendance?.onLeave || 0}
                                </div>
                            </div>
                        </div>

                        {/* Filter */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Filter size={18} color="#6b7280" />
                                <select
                                    value={filterDepartment}
                                    onChange={(e) => setFilterDepartment(e.target.value)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        minWidth: '200px'
                                    }}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Attendance Table */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    Loading attendance data...
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    No attendance records for today
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Employee</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Department</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Check In</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Check Out</th>
                                            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecords.map((record, index) => (
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
                                                            {record.employee?.name?.charAt(0).toUpperCase() || 'E'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#1f2937' }}>
                                                                {record.employee?.name || 'Unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', color: '#6b7280' }}>
                                                    {record.employee?.department?.name || 'Unassigned'}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        color: record.check_in ? '#16a34a' : '#9ca3af',
                                                        fontWeight: 500
                                                    }}>
                                                        {record.check_in
                                                            ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : '-'
                                                        }
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        color: record.check_out ? '#dc2626' : '#9ca3af',
                                                        fontWeight: 500
                                                    }}>
                                                        {record.check_out
                                                            ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : '-'
                                                        }
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    {getStatusBadge(record.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    /* Calendar View */
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
                                    cursor: 'pointer'
                                }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                            </h3>
                            <button
                                onClick={() => navigateMonth(1)}
                                style={{
                                    background: 'none',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer'
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
                                {getDaysInMonth(selectedDate).map((date, index) => {
                                    const dayData = calendarData.find(d =>
                                        date && new Date(d.date).toDateString() === date.toDateString()
                                    );

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                aspectRatio: '1',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                background: isToday(date) ? '#ede9fe' : date ? '#f9fafb' : 'transparent',
                                                border: isToday(date) ? '2px solid #7b68ee' : '1px solid transparent',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                gap: '4px'
                                            }}
                                        >
                                            {date && (
                                                <>
                                                    <span style={{
                                                        fontSize: '14px',
                                                        fontWeight: isToday(date) ? 600 : 400,
                                                        color: isToday(date) ? '#7b68ee' : '#374151'
                                                    }}>
                                                        {date.getDate()}
                                                    </span>
                                                    {dayData && (
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: '2px',
                                                            flexWrap: 'wrap',
                                                            justifyContent: 'center'
                                                        }}>
                                                            {dayData.present > 0 && (
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    background: '#16a34a'
                                                                }} title={`${dayData.present} present`} />
                                                            )}
                                                            {dayData.late > 0 && (
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    background: '#d97706'
                                                                }} title={`${dayData.late} late`} />
                                                            )}
                                                            {dayData.absent > 0 && (
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    background: '#dc2626'
                                                                }} title={`${dayData.absent} absent`} />
                                                            )}
                                                        </div>
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
                                gap: '24px',
                                marginTop: '20px',
                                paddingTop: '16px',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }} />
                                    Present
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706' }} />
                                    Late
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} />
                                    Absent
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default AttendancePage;
