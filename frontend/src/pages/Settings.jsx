import PagesTopBar from '../shared/components/PagesTopBar';

const Settings = () => {
    return (
        <div className="max-w-7xl mx-auto">
            <PagesTopBar title="My Settings" subtitle="Account and workspace preferences" />
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                <p className="text-slate-600 dark:text-slate-400">Settings page coming soon...</p>
            </div>
        </div>
    );
};

export default Settings;
