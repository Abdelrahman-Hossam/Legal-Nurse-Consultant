import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const menuItems = [
    { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
    { icon: "folder", label: "Cases", path: "/cases" },
    { icon: "people", label: "Clients", path: "/clients" },
    { icon: "business", label: "Law Firms", path: "/law-firms" },
    { icon: "group", label: "Users", path: "/users" },
    { icon: "description", label: "Medical Records", path: "/medical-records" },
    { icon: "analytics", label: "Case Analysis", path: "/case-analysis" },
    { icon: "attach_money", label: "Damages Tracking", path: "/damages" },
    { icon: "assignment", label: "Task Manager", path: "/tasks" },
    { icon: "notes", label: "Notes & Collaboration", path: "/notes" },
    { icon: "payments", label: "Billing & Invoices", path: "/billing" },
    { icon: "assessment", label: "Reporting", path: "/reports" },
  ];

  const toolItems = [
    { icon: "medical_services", label: "Medline Access", path: "/medline" },
    { icon: "settings", label: "Portal Settings", path: "/settings" },
  ];

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
        className={`w-64 bg-[#f3efe5] dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-[calc(100vh-64px)] overflow-y-auto z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <nav className="flex-1 py-6 px-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "text-[#1f3b61] bg-[#1f3b61]/5 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Internal Tools
            </p>
            {toolItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-icons">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                handleLogout();
                handleLinkClick();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
            >
              <span className="material-icons">logout</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 m-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icons text-[#0891b2] text-sm">
              support_agent
            </span>
            <span className="text-xs font-bold">Need Help?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Contact portal technical support for HIPAA security inquiries.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
