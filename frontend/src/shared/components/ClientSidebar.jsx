import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';

const ClientSidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
    }, []);

    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const menuItems = [
        {
            icon: 'dashboard',
            label: 'Dashboard',
            path: '/client/dashboard',
            description: 'Overview & Cases'
        },
        {
            icon: 'folder_open',
            label: 'My Cases',
            path: '/client/cases',
            description: 'Active Cases'
        },
        {
            icon: 'timeline',
            label: 'Timeline',
            path: '/client/timeline',
            description: 'Medical Chronology'
        },
        {
            icon: 'description',
            label: 'Documents',
            path: '/client/documents',
            description: 'Files & Records'
        },
        {
            icon: 'chat',
            label: 'Messages',
            path: '/client/messages',
            description: 'Secure Communication'
        },
        {
            icon: 'receipt_long',
            label: 'Billing',
            path: '/client/billing',
            description: 'Invoices & Payments'
        },
        {
            icon: 'article',
            label: 'Reports',
            path: '/client/reports',
            description: 'Generated Reports'
        }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed top-16 h-[calc(100vh-4rem)] overflow-y-auto z-50 transition-transform duration-300 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0891b2] rounded-lg flex items-center justify-center">
                            <span className="material-icons text-white">security</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Client Portal</h1>
                            <p className="text-xs text-slate-500">Secure Access</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleLinkClick}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive(item.path)
                                    ? 'bg-[#0891b2] text-white shadow-lg shadow-[#0891b2]/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#0891b2]/10 hover:text-[#0891b2]'
                                    }`}
                            >
                                <span className="material-icons text-xl">{item.icon}</span>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm">{item.label}</div>
                                    <div className={`text-xs ${isActive(item.path) ? 'text-white/80' : 'text-slate-400'}`}>
                                        {item.description}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0891b2]/10 border-2 border-[#0891b2]/20 flex items-center justify-center">
                            <span className="material-icons text-[#0891b2]">account_circle</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {user?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Client User')}
                            </p>
                            <p className="text-xs text-slate-500">{user?.email || 'Client'}</p>
                        </div>
                        <button className="p-1 text-slate-400 hover:text-[#0891b2] transition-colors">
                            <span className="material-icons text-lg">settings</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default ClientSidebar;
