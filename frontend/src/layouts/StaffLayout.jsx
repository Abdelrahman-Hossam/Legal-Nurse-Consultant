import { useState } from 'react';
import DashboardSwitcher from '../shared/components/DashboardSwitcher';
import Navbar from '../shared/components/Navbar';
import StaffSidebar from '../shared/components/StaffSidebar';

const StaffLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="bg-[#f3efe5] dark:bg-[#14181e] min-h-screen">
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex pt-16">
                <StaffSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 md:ml-64 p-4 md:p-8">
                    {children}
                </main>
            </div>
            <DashboardSwitcher />
        </div>
    );
};

export default StaffLayout;
