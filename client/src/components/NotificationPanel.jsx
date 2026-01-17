import { useNotifications } from '../context/NotificationContext';
import { Check, Clock, MessageSquare, Briefcase, FileText, Bell } from 'lucide-react';

const NotificationItem = ({ notification, onRead }) => {
    const { type, message, created_at, is_read, task, project } = notification;

    const getIcon = () => {
        switch (type) {
            case 'assigned_task': return <Briefcase className="w-4 h-4 text-blue-500" />;
            case 'task_due_soon': return <Clock className="w-4 h-4 text-orange-500" />;
            case 'comment': return <MessageSquare className="w-4 h-4 text-green-500" />;
            case 'project_update': return <FileText className="w-4 h-4 text-purple-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div
            className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
        >
            <div className="flex gap-3">
                <div className="mt-1 flex-shrink-0">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        {getIcon()}
                    </div>
                </div>
                <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!is_read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        {message}
                    </p>
                    <p className="text-xs text-gray-500">
                        {new Date(created_at).toLocaleString()}
                    </p>
                    {(task || project) && (
                        <div className="flex items-center gap-2 mt-1">
                            {task && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">Task: {task.title}</span>}
                        </div>
                    )}
                </div>
                {!is_read && (
                    <button
                        onClick={() => onRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Mark as read"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

const NotificationPanel = ({ onClose }) => {
    const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div>
                        {notifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={markAsRead}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-center">
                <button
                    onClick={onClose}
                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default NotificationPanel;
