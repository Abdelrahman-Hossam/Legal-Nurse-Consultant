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
    { icon: "account_balance", label: "Dashboard", path: "/dashboard" , micolor: "text-gray-500"},
    { icon: "folder", label: "Cases", path: "/cases" , micolor: "text-[#ffd679]"},
    { icon: "people", label: "Clients", path: "/clients", micolor: "text-gray-800" },
    { icon: "work", label: "Law Firms", path: "/law-firms" , micolor: "text-amber-900"},
    { icon: "accessibility_new", label: "Users", path: "/users" , micolor: "text-[#1f3b61]"},
    { icon: "description", label: "Medical Records", path: "/medical-records" , micolor: "text-[#ffffff]"},
    { icon: "bar_chart", label: "Case Analysis", path: "/case-analysis" , micolor: "text-[#2b8a3e]"},
    { icon: "personal_injury", label: "Damages Tracking", path: "/damages" , micolor: "text-[#c92a2a]"},
    { icon: "checklist", label: "Task Manager", path: "/tasks" , micolor: "text-[text-gray-800]"},
    { icon: "list_alt", label: "Notes & Collaboration", path: "/notes" , micolor: "text-[#757575]"},
    { icon: "payments", label: "Billing & Invoices", path: "/billing" , micolor: "text-[#2b8a3e]"},
    { icon: "assessment", label: "Reporting", path: "/reports" , micolor: "text-[#1f3b61]"},
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
                location.pathname === item.path
                  ? "text-[#f3efe5] bg-[#1a1409] font-semibold"
                  : "text-[#1a1409] hover:bg-[#99907e]/20  dark:hover:bg-slate-800 "
              }`}
            >
              <span className={`material-icons ${item.micolor} text-[18px]`}>{item.icon}</span>
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
