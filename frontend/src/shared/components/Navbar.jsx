import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";
import notificationService from "../../services/notification.service";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const notificationsListPath = location.pathname.startsWith("/staff")
    ? "/staff/notifications"
    : "/notifications";
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    fetchUserData();
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUser = authService.getUser();
      if (storedUser) {
        setUser(storedUser);
      } else {
        const response = await authService.getCurrentUser();
        if (response.success) {
          setUser(response.data.user);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const [countResponse, notificationsResponse] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getNotifications({ limit: 5, unread: true }),
      ]);

      if (countResponse.success) {
        setNotificationCount(countResponse.data.count || 0);
      }

      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await notificationService.markAsRead(notification._id);
      setNotificationCount((prev) => Math.max(0, prev - 1));
      setShowNotifications(false);

      // Navigate based on notification type
      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotificationCount(0);
      setNotifications([]);
      setShowNotifications(false);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    return (
      user.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email
    );
  };

  const getUserRole = () => {
    if (!user) return "";
    const roleMap = {
      admin: "Admin",
      attorney: "Attorney",
      "legal-nurse": "Legal Nurse Consultant",
      staff: "Staff",
      client: "Client",
    };
    return roleMap[user.role] || user.role;
  };

  const getProfileImage = () => {
    return (
      user?.profileImage ||
      user?.avatar ||
      "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(getUserDisplayName())
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#f3efe5] text-white flex items-center justify-between px-4 md:px-6 z-50  border-b border-gray-300">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="material-icons text-[#99907e]">menu</span>
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          {/* <span className="material-icons text-[#0891b2]">gavel</span> */}
          <span className="text-lg md:text-xl">
            <div className="flex flex-col">
              <span className="font-black text-[#1a1409] text-2xl font-playfair">
                Caduceus<span className="text-[#7a1f2e]">LNC</span>
              </span>
              <span className="text-[#9a8e7a] font-medium text-[9px] leading-none font-display tracking-[0.2em]">
                LEGAL NURSE CONSULTING
              </span>
            </div>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-green-500/20 px-2 md:px-3 py-0.5 rounded-full border border-green-500/30">
          <span className="material-icons text-green-400 text-xs">shield</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-green-400">
            <span className="hidden md:inline">Secured Session</span>
            <span className="md:hidden">Secure</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <form
          onSubmit={handleSearch}
          className="ml-4 md:ml-8 hidden lg:flex items-center bg-[#ffffff] rounded px-3 py-0.5 w-60 xl:w-80 border border-[#f3efe5] focus-within:border-[#1a1409]"
        >
          <span className="material-icons text-[#99907e] text-sm">search</span>
          <input
            className="rounded focus:ring-0 text-sm w-full placeholder text-[#1a1409] outline-none border-none bg-transparent ml-2 h-7"
            placeholder="Search cases, medical records..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            className="relative cursor-pointer"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span
              className="material-icons text-[#ffc83d]  
            border  hover:border-[#99907e] pt-1.5 pb-1.5 pr-3.5 pl-3.5"
            >
              notifications
            </span>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Notifications
                </h3>
                {notificationCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#0891b2] hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate(notificationsListPath);
                  }}
                  className="text-xs text-[#0891b2] hover:underline w-full text-center"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div
          className="flex items-center gap-3 pl-4 border-l border-white/20 relative"
          ref={profileRef}
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-[#1a1409]">
              {getUserDisplayName()}
            </p>
            <p className="text-[10px] text-[#1a1409]">{getUserRole()}</p>
          </div>
          <img
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-[#0891b2]/30 cursor-pointer"
            src={getProfileImage()}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />

          {showProfileMenu && (
            <div className="absolute right-0 top-12 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/profile");
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <span className="material-icons text-sm">person</span>
                My Profile
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/settings");
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <span className="material-icons text-sm">settings</span>
                Settings
              </button>
              <div className="border-t border-slate-200 dark:border-slate-700"></div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <span className="material-icons text-sm">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
