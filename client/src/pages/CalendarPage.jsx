import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import {
    ChevronLeft, ChevronRight, Plus, Clock, Users, MapPin,
    Calendar as CalendarIcon, MoreHorizontal, X
} from 'lucide-react';
import api from '../services/api';

const CalendarPage = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // month, week, day
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch tasks as events
    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            // Fetch tasks with due dates
            const response = await api.get('/tasks', {
                params: {
                    startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
                    endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
                }
            });

            // Convert tasks to calendar events
            const taskEvents = (response.data.tasks || response.data || [])
                .filter(task => task.dueDate)
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    date: new Date(task.dueDate),
                    type: 'task',
                    priority: task.priority,
                    status: task.status,
                    color: getPriorityColor(task.priority)
                }));

            setEvents(taskEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'URGENT': '#ef4444',
            'HIGH': '#f97316',
            'MEDIUM': '#eab308',
            'LOW': '#22c55e',
            'NONE': '#6b7280'
        };
        return colors[priority] || colors['NONE'];
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month's days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    const navigateMonth = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getEventsForDate = (date) => {
        return events.filter(event =>
            event.date.toDateString() === date.toDateString()
        );
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const days = getDaysInMonth(currentDate);

    return (
        <Dashboard>
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-secondary)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={() => navigateMonth(-1)}
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => navigateMonth(1)}
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0
                        }}>
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h1>

                        <button
                            onClick={goToToday}
                            style={{
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            Today
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* View Selector */}
                        <div style={{
                            display: 'flex',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            padding: '4px'
                        }}>
                            {['month', 'week', 'day'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    style={{
                                        background: view === v ? 'var(--primary)' : 'transparent',
                                        color: view === v ? 'white' : 'var(--text-secondary)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0.5rem 1rem',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowEventModal(true)}
                            className="btn-modern btn-modern-primary"
                        >
                            <Plus size={18} />
                            Add Event
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div style={{ flex: 1, padding: '1.5rem 2rem', overflow: 'auto' }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            color: 'var(--text-muted)'
                        }}>
                            Loading calendar...
                        </div>
                    ) : (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Day Headers */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                borderBottom: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)'
                            }}>
                                {dayNames.map(day => (
                                    <div key={day} style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                flex: 1
                            }}>
                                {days.map((day, index) => {
                                    const dayEvents = getEventsForDate(day.date);
                                    const today = isToday(day.date);

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedDate(day.date)}
                                            style={{
                                                borderRight: (index + 1) % 7 !== 0 ? '1px solid var(--border-color)' : 'none',
                                                borderBottom: index < 35 ? '1px solid var(--border-color)' : 'none',
                                                padding: '0.5rem',
                                                minHeight: '100px',
                                                cursor: 'pointer',
                                                background: today ? 'rgba(99, 102, 241, 0.05)' :
                                                    selectedDate?.toDateString() === day.date.toDateString() ? 'var(--bg-hover)' : 'transparent',
                                                opacity: day.isCurrentMonth ? 1 : 0.4,
                                                transition: 'background 0.15s'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                marginBottom: '0.5rem'
                                            }}>
                                                <span style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.875rem',
                                                    fontWeight: today ? 600 : 400,
                                                    background: today ? 'var(--primary)' : 'transparent',
                                                    color: today ? 'white' : 'var(--text-primary)'
                                                }}>
                                                    {day.date.getDate()}
                                                </span>
                                            </div>

                                            {/* Events */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {dayEvents.slice(0, 3).map(event => (
                                                    <div
                                                        key={event.id}
                                                        style={{
                                                            background: event.color,
                                                            color: 'white',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 500,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--text-muted)',
                                                        paddingLeft: '6px'
                                                    }}>
                                                        +{dayEvents.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Event Modal */}
                {showEventModal && (
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
                            maxWidth: '500px',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow-xl)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <h2 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    Add Event
                                </h2>
                                <button
                                    onClick={() => setShowEventModal(false)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                To add events, create tasks with due dates from the Projects or Workspace sections.
                            </p>

                            <button
                                onClick={() => setShowEventModal(false)}
                                className="btn-modern btn-modern-primary"
                                style={{ width: '100%' }}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default CalendarPage;
