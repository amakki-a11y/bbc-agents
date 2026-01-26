import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Square, Plus, Clock, X } from 'lucide-react';
import { API_URL } from '../../api/http';

const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeLog = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
};

const parseTimeInput = (input) => {
    // Parse input like "2h 30m", "2h", "30m", "2:30", "90" (minutes)
    const hoursMatch = input.match(/(\d+)\s*h/i);
    const minutesMatch = input.match(/(\d+)\s*m/i);
    const colonMatch = input.match(/^(\d+):(\d+)$/);
    const plainNumber = input.match(/^(\d+)$/);

    let totalSeconds = 0;

    if (colonMatch) {
        totalSeconds = parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60;
    } else if (hoursMatch || minutesMatch) {
        if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
        if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
    } else if (plainNumber) {
        totalSeconds = parseInt(plainNumber[1]) * 60; // Treat as minutes
    }

    return totalSeconds;
};

const TrackTimeField = ({ taskId, timeEntries = [], onTaskRefresh }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [activeEntryId, setActiveEntryId] = useState(null);
    const [showAddManual, setShowAddManual] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Calculate total logged time
    const totalSeconds = timeEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);

    // Check for running timer on mount
    useEffect(() => {
        const runningEntry = timeEntries.find(e => e.end_time === null);
        if (runningEntry) {
            setActiveEntryId(runningEntry.id);
            setIsRunning(true);
            startTimeRef.current = new Date(runningEntry.start_time);
            const elapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
            setElapsedSeconds(elapsed);
        }
    }, [timeEntries]);

    // Timer tick
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
                setElapsedSeconds(elapsed);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning]);

    const handleStartTimer = async () => {
        if (!taskId) return;

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        try {
            const response = await fetch(`${API_URL}/tasks/details/${taskId}/time-entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    start_time: new Date().toISOString()
                })
            });

            if (response.ok) {
                const entry = await response.json();
                setActiveEntryId(entry.id);
                startTimeRef.current = new Date();
                setElapsedSeconds(0);
                setIsRunning(true);
                if (onTaskRefresh) await onTaskRefresh();
            }
        } catch (error) {
            console.error('Failed to start timer:', error);
        }
    };

    const handleStopTimer = async () => {
        if (!activeEntryId) return;

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        try {
            await fetch(`${API_URL}/tasks/details/time-entries/${activeEntryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    end_time: new Date().toISOString(),
                    duration: elapsedSeconds
                })
            });

            setIsRunning(false);
            setActiveEntryId(null);
            setElapsedSeconds(0);
            if (onTaskRefresh) await onTaskRefresh();
        } catch (error) {
            console.error('Failed to stop timer:', error);
        }
    };

    const handleAddManualTime = async () => {
        const seconds = parseTimeInput(manualInput);
        if (seconds <= 0 || !taskId) return;

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        try {
            const now = new Date();
            const startTime = new Date(now.getTime() - seconds * 1000);

            await fetch(`${API_URL}/tasks/details/${taskId}/time-entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    start_time: startTime.toISOString(),
                    end_time: now.toISOString(),
                    duration: seconds,
                    is_manual: true
                })
            });

            setManualInput('');
            setShowAddManual(false);
            if (onTaskRefresh) await onTaskRefresh();
        } catch (error) {
            console.error('Failed to add manual time:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#6b7280',
                    minWidth: '90px'
                }}>
                    Track Time
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Total Time Badge */}
                    {(totalSeconds > 0 || isRunning) && (
                        <div
                            onClick={() => setShowHistory(!showHistory)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#f0fdf4',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #bbf7d0',
                                cursor: 'pointer'
                            }}
                        >
                            <Timer size={14} style={{ color: '#16a34a' }} />
                            <span style={{
                                fontSize: '0.8rem',
                                color: '#15803d',
                                fontWeight: 600
                            }}>
                                {formatTimeLog(totalSeconds)}
                            </span>
                        </div>
                    )}

                    {/* Timer Controls */}
                    {isRunning ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                fontFamily: 'monospace',
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#dc2626',
                                background: '#fef2f2',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid #fecaca'
                            }}>
                                {formatDuration(elapsedSeconds)}
                            </div>
                            <button
                                onClick={handleStopTimer}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    background: '#dc2626',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                                }}
                                title="Stop Timer"
                            >
                                <Square size={14} fill="white" />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={handleStartTimer}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#16a34a',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
                                }}
                            >
                                <Play size={12} fill="white" />
                                Start
                            </button>
                            <button
                                onClick={() => setShowAddManual(!showAddManual)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    background: '#f3f4f6',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    color: '#6b7280',
                                    cursor: 'pointer'
                                }}
                                title="Add time manually"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Time Input */}
            {showAddManual && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="e.g., 2h 30m or 1:30"
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            outline: 'none'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddManualTime();
                            if (e.key === 'Escape') setShowAddManual(false);
                        }}
                    />
                    <button
                        onClick={handleAddManualTime}
                        disabled={!manualInput.trim()}
                        style={{
                            padding: '8px 14px',
                            background: manualInput.trim() ? '#4f46e5' : '#e5e7eb',
                            color: manualInput.trim() ? 'white' : '#9ca3af',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: manualInput.trim() ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Add
                    </button>
                    <button
                        onClick={() => setShowAddManual(false)}
                        style={{
                            padding: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Time Log History */}
            {showHistory && timeEntries.length > 0 && (
                <div style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        marginBottom: '8px'
                    }}>
                        Time Log
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {timeEntries.slice(0, 5).map((entry, idx) => (
                            <div
                                key={entry.id || idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 10px',
                                    background: 'white',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={12} style={{ color: '#9ca3af' }} />
                                    <span style={{ color: '#374151' }}>
                                        {new Date(entry.start_time).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    {entry.is_manual && (
                                        <span style={{
                                            fontSize: '0.65rem',
                                            padding: '1px 4px',
                                            background: '#e5e7eb',
                                            borderRadius: '3px',
                                            color: '#6b7280'
                                        }}>
                                            manual
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontWeight: 600, color: '#4b5563' }}>
                                    {entry.duration ? formatTimeLog(entry.duration) : (
                                        <span style={{ color: '#dc2626' }}>Running...</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackTimeField;
