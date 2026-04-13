import { Link, useLocation, useNavigate } from 'react-router-dom';

const StaffSidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    /** Match admin Sidebar behavior; treat nested routes as active for section roots (e.g. /staff/cases/:id). */
    const isPathActive = (path) => {
        if (location.pathname === path) return true;
        if (path === '/staff-dashboard' || path === '/timeline-work') return false;
        return location.pathname.startsWith(`${path}/`);
    };

    const menuItems = [
        { icon: 'dashboard', label: 'My Dashboard', path: '/staff-dashboard', micolor: 'text-gray-500' },
        { icon: 'assignment', label: 'My Cases', path: '/staff/cases', micolor: 'text-[#ffd679]' },
        { icon: 'task_alt', label: 'My Tasks', path: '/staff/tasks', micolor: 'text-[text-gray-800]' },
        { icon: 'description', label: 'Medical Records', path: '/staff/medical-records', micolor: 'text-[#ffffff]' },
        { icon: 'analytics', label: 'Case Analysis', path: '/staff/case-analysis', micolor: 'text-[#2b8a3e]' },
        { icon: 'attach_money', label: 'Damages Tracking', path: '/staff/damages', micolor: 'text-[#c92a2a]' },
        { icon: 'notes', label: 'Notes', path: '/staff/notes', micolor: 'text-[#757575]' },
        { icon: 'timeline', label: 'Timeline Work', path: '/timeline-work', micolor: 'text-[#1f3b61]' },
        { icon: 'schedule', label: 'Time Tracking', path: '/staff/billing', micolor: 'text-[#2b8a3e]' },
    ];

    const toolItems = [
        { icon: 'search', label: 'Medical Search', path: '/staff/search', micolor: 'text-[#1f3b61]' },
        { icon: 'settings', label: 'My Settings', path: '/staff/settings', micolor: 'text-gray-500' },
    ];

    return (
        <>
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`w-64 bg-[#f3efe5] dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-[calc(100vh-64px)] overflow-y-auto z-50 transition-transform duration-300 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}
            >
                <span className="text-[#9a8e7a] font-medium text-[10px] leading-none font-display tracking-[0.2em] h-2 pt-3 pl-16">
                    NAVIGATION
                </span>
                <nav className="flex-1 py-6 px-4 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-[13px] font-display ${
                                isPathActive(item.path)
                                    ? 'text-[#f3efe5] bg-[#1a1409] font-semibold'
                                    : 'text-[#1a1409] hover:bg-[#99907e]/20 dark:hover:bg-slate-800 '
                            }`}
                        >
                            <span className={`material-icons ${item.micolor} text-[18px]`}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[#9a8e7a] font-medium text-[10px] leading-none font-display tracking-[0.2em] h-2 pt-3 pl-8">
                            INTERNAL TOOLS
                        </span>
                        {toolItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleLinkClick}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-[13px] font-display ${
                                    isPathActive(item.path)
                                        ? 'text-[#f3efe5] bg-[#1a1409] font-semibold'
                                        : 'text-[#1a1409] hover:bg-[#99907e]/20 dark:hover:bg-slate-800 '
                                }`}
                            >
                                <span className={`material-icons ${item.micolor} text-[18px]`}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => {
                                handleLogout();
                                handleLinkClick();
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-[#99907e]/20 dark:hover:bg-red-900/20 transition-colors w-full"
                        >
                            <span className="material-icons">logout</span>
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </nav>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 m-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-icons text-[#0891b2] text-sm">support_agent</span>
                        <span className="text-xs font-bold">Need Help?</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        Contact your supervisor or technical support for assistance.
                    </p>
                </div>
            </aside>
        </>
    );
};

export default StaffSidebar;
