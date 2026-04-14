import { useState } from 'react';
import { Button } from '../shared/components/Button';
import PagesTopBar, {
    pagesListPageCanvasClass,
    pagesListPageHeaderBandClass,
    pagesListPageMaxInnerClass,
    pagesTopBarFlushOnCreamClass,
    pagesTopBarSplitTitle,
    pagesTopBarWatermarkWord
} from '../shared/components/PagesTopBar';

const PortalSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        portalName: 'Legal Nurse Consulting Platform',
        companyName: 'LNC Solutions',
        supportEmail: 'support@lnc.com',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        language: 'en',
        enableNotifications: true,
        enableEmailAlerts: true,
        enableSMSAlerts: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
        twoFactorAuth: true,
        ipWhitelist: '',
        auditLogRetention: 2555,
        dataBackupFrequency: 'daily',
        maintenanceMode: false
    });

    const handleSave = () => {
        alert('Settings saved successfully!');
    };

    const tabs = [
        { id: 'general', label: 'General', icon: 'settings' },
        { id: 'security', label: 'Security', icon: 'security' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications' },
        { id: 'compliance', label: 'HIPAA Compliance', icon: 'verified_user' },
        { id: 'backup', label: 'Backup & Recovery', icon: 'backup' }
    ];

    return (
        <div className={pagesListPageCanvasClass}>
            <div className={pagesListPageMaxInnerClass}>
                <div className="relative z-[1]">
                    <div className={pagesListPageHeaderBandClass}>
                        <PagesTopBar
                            eyebrow="Portal settings"
                            title={pagesTopBarSplitTitle('Portal', 'Settings')}
                            titleClassName="!m-0 !p-0"
                            subtitle="Configure system-wide settings and preferences"
                            className={pagesTopBarFlushOnCreamClass}
                            watermark={pagesTopBarWatermarkWord('Portal')}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#d9d4cb] dark:border-slate-800 shadow-sm p-4">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                                            ? 'bg-[#7a1f2e] text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-[#f3efe5] dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="material-icons text-xl">{tab.icon}</span>
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#d9d4cb] dark:border-slate-800 shadow-sm">
                        {/* General Settings */}
                        {activeTab === 'general' && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-[#1f3b61] dark:text-white mb-6">General Settings</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Portal Name</label>
                                        <input
                                            type="text"
                                            value={settings.portalName}
                                            onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Company Name</label>
                                        <input
                                            type="text"
                                            value={settings.companyName}
                                            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Support Email</label>
                                        <input
                                            type="email"
                                            value={settings.supportEmail}
                                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Timezone</label>
                                            <select
                                                value={settings.timezone}
                                                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                            >
                                                <option value="America/New_York">Eastern Time</option>
                                                <option value="America/Chicago">Central Time</option>
                                                <option value="America/Denver">Mountain Time</option>
                                                <option value="America/Los_Angeles">Pacific Time</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Date Format</label>
                                            <select
                                                value={settings.dateFormat}
                                                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                            >
                                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-[#1f3b61] dark:text-white mb-6">Security Settings</h2>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-[#f3efe5]/60 dark:bg-slate-800 rounded-lg border border-[#d9d4cb]/60 dark:border-slate-700">
                                        <div>
                                            <p className="font-medium text-[#1a1409] dark:text-slate-200">Two-Factor Authentication</p>
                                            <p className="text-sm text-slate-500">Require 2FA for all users</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.twoFactorAuth}
                                                onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7a1f2e]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7a1f2e]"></div>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                                        <input
                                            type="number"
                                            value={settings.sessionTimeout}
                                            onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Password Expiry (days)</label>
                                        <input
                                            type="number"
                                            value={settings.passwordExpiry}
                                            onChange={(e) => setSettings({ ...settings, passwordExpiry: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">IP Whitelist (comma-separated)</label>
                                        <textarea
                                            value={settings.ipWhitelist}
                                            onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                                            rows="3"
                                            placeholder="192.168.1.1, 10.0.0.1"
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Settings */}
                        {activeTab === 'notifications' && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-[#1f3b61] dark:text-white mb-6">Notification Settings</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div>
                                            <p className="font-medium">In-App Notifications</p>
                                            <p className="text-sm text-slate-500">Show notifications in the portal</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.enableNotifications}
                                                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7a1f2e]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7a1f2e]"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[#f3efe5]/60 dark:bg-slate-800 rounded-lg border border-[#d9d4cb]/60 dark:border-slate-700">
                                        <div>
                                            <p className="font-medium text-[#1a1409] dark:text-slate-200">Email Alerts</p>
                                            <p className="text-sm text-slate-500">Send email notifications</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.enableEmailAlerts}
                                                onChange={(e) => setSettings({ ...settings, enableEmailAlerts: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7a1f2e]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7a1f2e]"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[#f3efe5]/60 dark:bg-slate-800 rounded-lg border border-[#d9d4cb]/60 dark:border-slate-700">
                                        <div>
                                            <p className="font-medium text-[#1a1409] dark:text-slate-200">SMS Alerts</p>
                                            <p className="text-sm text-slate-500">Send SMS notifications</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.enableSMSAlerts}
                                                onChange={(e) => setSettings({ ...settings, enableSMSAlerts: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7a1f2e]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7a1f2e]"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* HIPAA Compliance */}
                        {activeTab === 'compliance' && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-[#1f3b61] dark:text-white mb-6">HIPAA Compliance Settings</h2>
                                <div className="space-y-6">
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-icons text-green-600">verified_user</span>
                                            <span className="font-bold text-green-700 dark:text-green-400">HIPAA Compliant</span>
                                        </div>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            All data is encrypted and meets HIPAA security requirements
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Audit Log Retention (days)</label>
                                        <input
                                            type="number"
                                            value={settings.auditLogRetention}
                                            onChange={(e) => setSettings({ ...settings, auditLogRetention: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">HIPAA requires minimum 7 years (2555 days)</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <h3 className="font-medium mb-2">Encryption Status</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-green-600 text-sm">check_circle</span>
                                                <span>Data at rest: AES-256 encryption</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-green-600 text-sm">check_circle</span>
                                                <span>Data in transit: TLS 1.3</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-green-600 text-sm">check_circle</span>
                                                <span>Database encryption: Enabled</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Backup & Recovery */}
                        {activeTab === 'backup' && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-[#1f3b61] dark:text-white mb-6">Backup & Recovery Settings</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Backup Frequency</label>
                                        <select
                                            value={settings.dataBackupFrequency}
                                            onChange={(e) => setSettings({ ...settings, dataBackupFrequency: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#7a1f2e]/35 outline-none"
                                        >
                                            <option value="hourly">Hourly</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[#f3efe5]/60 dark:bg-slate-800 rounded-lg border border-[#d9d4cb]/60 dark:border-slate-700">
                                        <div>
                                            <p className="font-medium text-[#1a1409] dark:text-slate-200">Maintenance Mode</p>
                                            <p className="text-sm text-slate-500">Temporarily disable portal access</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.maintenanceMode}
                                                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7a1f2e]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7a1f2e]"></div>
                                        </label>
                                    </div>
                                    <div className="p-4 bg-[#f3efe5] dark:bg-slate-800/80 border border-[#d9d4cb] dark:border-slate-700 rounded-lg">
                                        <h3 className="font-medium mb-2 text-[#1f3b61] dark:text-slate-200">Last Backup</h3>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            {new Date().toLocaleString()} - All data backed up successfully
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="px-6 py-4 border-t border-[#d9d4cb] dark:border-slate-800 flex justify-end gap-3">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                            <Button type="button" variant="primary" onClick={handleSave} className="inline-flex items-center gap-2">
                                <span className="material-icons text-sm">save</span>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortalSettings;
