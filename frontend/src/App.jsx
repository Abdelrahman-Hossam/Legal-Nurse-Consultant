import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import BillingPage from './modules/billing-time-tracking/pages/BillingPage';
import CaseAnalysis from './modules/case-analysis/pages/CaseAnalysis';
import NotesPage from './modules/collaboration/pages/NotesPage';
import CaseDetail from './modules/crm-case-intake/pages/CaseDetail';
import CasesList from './modules/crm-case-intake/pages/CasesList';
import ClientsList from './modules/crm-case-intake/pages/ClientsList';
import CreateCase from './modules/crm-case-intake/pages/CreateCase';
import LawFirmsList from './modules/crm-case-intake/pages/LawFirmsList';
import DamagesTracking from './modules/damages-tracking/pages/DamagesTracking';
import ClientBilling from './modules/file-sharing-portal/pages/ClientBilling';
import ClientCases from './modules/file-sharing-portal/pages/ClientCases';
import ClientCaseView from './modules/file-sharing-portal/pages/ClientCaseView';
import ClientDashboard from './modules/file-sharing-portal/pages/ClientDashboard';
import ClientDocuments from './modules/file-sharing-portal/pages/ClientDocuments';
import ClientReports from './modules/file-sharing-portal/pages/ClientReports';
import ClientTimeline from './modules/file-sharing-portal/pages/ClientTimeline';
import MessagesPage from './modules/file-sharing-portal/pages/MessagesPage';
import MedicalRecordsList from './modules/medical-records/pages/MedicalRecordsList';
import SearchPage from './modules/ocr-search/pages/SearchPage';
import ReportsPage from './modules/reporting/pages/ReportsPage';
import TasksPage from './modules/task-workflow/pages/TasksPage';
import TimelineBuilder from './modules/timeline-chronology/pages/TimelineBuilder';
import TimelineWork from './modules/timeline-chronology/pages/TimelineWork';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MedlineAccess from './pages/MedlineAccess';
import PortalSettings from './pages/PortalSettings';
import Register from './pages/Register';
import Settings from './pages/Settings';
import StaffDashboard from './pages/StaffDashboard';
import UsersManagement from './pages/UsersManagement';
import NotificationsPage from './pages/NotificationsPage';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';
import StaffLayout from './layouts/StaffLayout';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/client-login" element={<Login />} />

                {/* Admin/Attorney Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
                <Route path="/cases" element={<AdminLayout><CasesList /></AdminLayout>} />
                <Route path="/cases/new" element={<AdminLayout><CreateCase /></AdminLayout>} />
                <Route path="/cases/:id" element={<AdminLayout><CaseDetail /></AdminLayout>} />
                <Route path="/clients" element={<AdminLayout><ClientsList /></AdminLayout>} />
                <Route path="/users" element={<AdminLayout><UsersManagement /></AdminLayout>} />
                <Route path="/medical-records" element={<AdminLayout><MedicalRecordsList /></AdminLayout>} />
                <Route path="/case-analysis" element={<AdminLayout><CaseAnalysis /></AdminLayout>} />
                <Route path="/damages" element={<AdminLayout><DamagesTracking /></AdminLayout>} />
                <Route path="/notes" element={<AdminLayout><NotesPage /></AdminLayout>} />
                <Route path="/law-firms" element={<AdminLayout><LawFirmsList /></AdminLayout>} />
                <Route path="/search" element={<AdminLayout><SearchPage /></AdminLayout>} />
                <Route path="/timeline/:caseId" element={<AdminLayout><TimelineBuilder /></AdminLayout>} />
                <Route path="/reports" element={<AdminLayout><ReportsPage /></AdminLayout>} />
                <Route path="/billing" element={<AdminLayout><BillingPage /></AdminLayout>} />
                <Route path="/tasks" element={<AdminLayout><TasksPage /></AdminLayout>} />
                <Route path="/settings" element={<AdminLayout><PortalSettings /></AdminLayout>} />
                <Route path="/medline" element={<AdminLayout><MedlineAccess /></AdminLayout>} />
                <Route path="/notifications" element={<AdminLayout><NotificationsPage /></AdminLayout>} />
                {/* Staff Routes */}
                <Route path="/staff-dashboard" element={<StaffLayout><StaffDashboard /></StaffLayout>} />
                <Route path="/staff/cases" element={<StaffLayout><CasesList /></StaffLayout>} />
                <Route path="/staff/cases/new" element={<StaffLayout><CreateCase /></StaffLayout>} />
                <Route path="/staff/cases/:id" element={<StaffLayout><CaseDetail /></StaffLayout>} />
                <Route path="/staff/tasks" element={<StaffLayout><TasksPage /></StaffLayout>} />
                <Route path="/staff/medical-records" element={<StaffLayout><MedicalRecordsList /></StaffLayout>} />
                <Route path="/staff/case-analysis" element={<StaffLayout><CaseAnalysis /></StaffLayout>} />
                <Route path="/staff/damages" element={<StaffLayout><DamagesTracking /></StaffLayout>} />
                <Route path="/staff/notes" element={<StaffLayout><NotesPage /></StaffLayout>} />
                <Route path="/staff/billing" element={<StaffLayout><BillingPage /></StaffLayout>} />
                <Route path="/staff/search" element={<StaffLayout><SearchPage /></StaffLayout>} />
                <Route path="/staff/settings" element={<StaffLayout><Settings /></StaffLayout>} />
                <Route path="/staff/timeline/:caseId" element={<StaffLayout><TimelineBuilder /></StaffLayout>} />
                <Route path="/timeline-work" element={<StaffLayout><TimelineWork /></StaffLayout>} />
                <Route path="/staff/notifications" element={<StaffLayout><NotificationsPage /></StaffLayout>} />

                {/* Client Portal Routes */}
                <Route path="/client/dashboard" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
                <Route path="/client/cases" element={<ClientLayout><ClientCases /></ClientLayout>} />
                <Route path="/client/case/:id" element={<ClientLayout><ClientCaseView /></ClientLayout>} />
                <Route path="/client/timeline" element={<ClientLayout><ClientTimeline /></ClientLayout>} />
                <Route path="/client/documents" element={<ClientLayout><ClientDocuments /></ClientLayout>} />
                <Route path="/client/messages" element={<ClientLayout><MessagesPage /></ClientLayout>} />
                <Route path="/client/billing" element={<ClientLayout><ClientBilling /></ClientLayout>} />
                <Route path="/client/reports" element={<ClientLayout><ClientReports /></ClientLayout>} />
            </Routes>
        </Router>
    );
}

export default App;

