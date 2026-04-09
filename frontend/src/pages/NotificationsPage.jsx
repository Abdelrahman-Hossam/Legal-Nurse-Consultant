import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notification.service';

const LIMIT = 50;

const typeStyles = {
    info: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    warning: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    task: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
    deadline: 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200',
    case: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-200',
    message: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    system: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { limit: LIMIT, skip: 0 };
            if (filter === 'unread') {
                params.unread = true;
            }
            const res = await notificationService.getNotifications(params);
            if (res.success) {
                setItems(res.data.notifications || []);
                setTotal(res.data.total ?? 0);
            } else {
                setError(res.message || 'Failed to load notifications');
            }
        } catch (e) {
            setError(
                e.response?.data?.message ||
                    e.message ||
                    'Failed to load notifications'
            );
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        load();
    }, [load]);

    const handleMarkRead = async (n) => {
        if (n.isRead) return;
        setBusyId(n._id);
        try {
            await notificationService.markAsRead(n._id);
            if (filter === 'unread') {
                setItems((prev) => prev.filter((x) => x._id !== n._id));
                setTotal((t) => Math.max(0, t - 1));
            } else {
                setItems((prev) =>
                    prev.map((x) =>
                        x._id === n._id ? { ...x, isRead: true } : x
                    )
                );
            }
        } catch (e) {
            console.error(e);
        } finally {
            setBusyId(null);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
            if (filter === 'unread') {
                setItems([]);
                setTotal(0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        setBusyId(id);
        try {
            await notificationService.deleteNotification(id);
            setItems((prev) => prev.filter((x) => x._id !== id));
            setTotal((t) => Math.max(0, t - 1));
        } catch (e) {
            console.error(e);
        } finally {
            setBusyId(null);
        }
    };

    const openNotification = async (n) => {
        if (!n.isRead) {
            await handleMarkRead(n);
        }
        if (n.link) {
            navigate(n.link);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Notifications
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {total} total
                        {filter === 'unread' ? ' (unread)' : ''}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`px-3 py-2 text-sm font-medium ${
                                filter === 'all'
                                    ? 'bg-[#7a1f2e] text-white'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-2 text-sm font-medium border-l border-slate-200 dark:border-slate-700 ${
                                filter === 'unread'
                                    ? 'bg-[#7a1f2e] text-white'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            Unread
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        Mark all read
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading && (
                    <p className="p-8 text-center text-slate-500">
                        Loading…
                    </p>
                )}
                {!loading && error && (
                    <p className="p-8 text-center text-red-600">{error}</p>
                )}
                {!loading && !error && items.length === 0 && (
                    <p className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No notifications to show.
                    </p>
                )}
                {!loading && !error && items.length > 0 && (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                        {items.map((n) => (
                            <li
                                key={n._id}
                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                    !n.isRead
                                        ? 'bg-slate-50/80 dark:bg-slate-800/30'
                                        : ''
                                }`}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span
                                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                                    typeStyles[n.type] ||
                                                    typeStyles.info
                                                }`}
                                            >
                                                {n.type || 'info'}
                                            </span>
                                            {!n.isRead && (
                                                <span className="text-xs font-semibold text-[#7a1f2e]">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openNotification(n)}
                                            className="text-left w-full"
                                        >
                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                {n.title}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-2">
                                                {n.createdAt
                                                    ? new Date(
                                                          n.createdAt
                                                      ).toLocaleString()
                                                    : ''}
                                            </p>
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0">
                                        {!n.isRead && (
                                            <button
                                                type="button"
                                                disabled={busyId === n._id}
                                                onClick={() =>
                                                    handleMarkRead(n)
                                                }
                                                className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={busyId === n._id}
                                            onClick={() =>
                                                handleDelete(n._id)
                                            }
                                            className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
