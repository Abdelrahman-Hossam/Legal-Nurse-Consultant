import { useEffect, useState } from 'react';
import userService from '../services/user.service';
import PagesTopBar, {
    pagesListPageCanvasClass,
    pagesListPageHeaderBandClass,
    pagesListPageMaxInnerClass,
    pagesTopBarFlushOnCreamClass,
    pagesTopBarPrimaryClass,
    pagesTopBarSplitTitle,
    pagesTopBarUiSansClass,
    pagesTopBarWatermarkWord
} from '../shared/components/PagesTopBar';

const UsersManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, admins: 0, nurses: 0 });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        password: '',
        status: 'active'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, roleFilter, statusFilter, searchQuery]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                role: roleFilter !== 'all' ? roleFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchQuery || undefined
            };
            const response = await userService.getAllUsers(params);
            setUsers(response.data.users || []);
            setPagination(response.data.pagination || { page: 1, pages: 1, total: 0, limit: 10 });

            // Calculate stats
            const total = response.data.pagination?.total || 0;
            const active = response.data.users?.filter(u => u.status === 'active').length || 0;
            const admins = response.data.users?.filter(u => u.role === 'admin').length || 0;
            const nurses = response.data.users?.filter(u => u.role === 'legal-nurse').length || 0;
            setStats({ total, active, admins, nurses });
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await userService.createUser(formData);
            setShowAddModal(false);
            setFormData({ fullName: '', email: '', role: '', password: '', status: 'active' });
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await userService.updateUser(selectedUser._id, formData);
            setShowEditModal(false);
            setSelectedUser(null);
            setFormData({ fullName: '', email: '', role: '', password: '', status: 'active' });
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        try {
            setSubmitting(true);
            await userService.deleteUser(selectedUser._id);
            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            password: '',
            status: user.status
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            'Admin': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'Attorney': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'Legal Nurse': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
            'Client': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        };
        return colors[role] || colors['Client'];
    };

    const getStatusColor = (status) => {
        return status === 'Active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    };

    return (
        <>
            <div className={pagesListPageCanvasClass}>
                <div className={pagesListPageMaxInnerClass}>
                    <div className="relative z-[1]">
                        <div className={pagesListPageHeaderBandClass}>
                        <PagesTopBar
                            eyebrow="Users"
                            title={pagesTopBarSplitTitle('User', 'Management')}
                            titleClassName="!m-0 !p-0"
                            subtitle="Manage system users and permissions"
                            className={pagesTopBarFlushOnCreamClass}
                            watermark={pagesTopBarWatermarkWord('Team')}
                        >
                            <div className={`flex flex-wrap items-center gap-3 ${pagesTopBarUiSansClass}`}>
                                <button type="button" onClick={() => setShowAddModal(true)} className={pagesTopBarPrimaryClass}>
                                    <span className="material-icons text-sm">person_add</span>
                                    Add User
                                </button>
                            </div>
                        </PagesTopBar>
                        </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="material-icons text-blue-600">people</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-slate-500 uppercase font-bold">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <span className="material-icons text-green-600">check_circle</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.active}</p>
                            <p className="text-xs text-slate-500 uppercase font-bold">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <span className="material-icons text-purple-600">admin_panel_settings</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.admins}</p>
                            <p className="text-xs text-slate-500 uppercase font-bold">Admins</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                            <span className="material-icons text-teal-600">medical_services</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.nurses}</p>
                            <p className="text-xs text-slate-500 uppercase font-bold">Legal Nurses</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="attorney">Attorney</option>
                            <option value="nurse">Legal Nurse</option>
                            <option value="client">Client</option>
                        </select>
                        <select
                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400">
                            <tr>
                                <th className="px-6 py-3 text-left">User</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-left">Role</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-left">Last Login</th>
                                <th className="px-6 py-3 text-left">Cases</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <span className="material-icons animate-spin text-4xl text-[#0891b2]">refresh</span>
                                        <p className="mt-2 text-slate-500">Loading users...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#1f3b61]/10 flex items-center justify-center text-[#1f3b61] text-sm font-bold ring-2 ring-white dark:ring-slate-800">
                                                    {getInitials(user.fullName)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getRoleBadgeColor(user.role)}`}>
                                                {user.role === 'legal-nurse' ? 'Legal Nurse' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(user.status)}`}>
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.casesAssigned || 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <span className="material-icons text-slate-400 hover:text-[#0891b2]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(user)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="material-icons text-slate-400 hover:text-red-500">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {[...Array(pagination.pages)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setPagination({ ...pagination, page: i + 1 })}
                                className={`px-3 py-1.5 rounded-lg text-sm ${pagination.page === i + 1
                                    ? 'bg-[#0891b2] text-white'
                                    : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    } transition-colors`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= pagination.pages}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Add New User</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                                    placeholder="Enter email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Password *</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                                    placeholder="Enter password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Role *</label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                                >
                                    <option value="">Select role</option>
                                    <option value="admin">Admin</option>
                                    <option value="attorney">Attorney</option>
                                    <option value="legal-nurse">Legal Nurse</option>
                                    <option value="client">Client</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Adding...' : 'Add User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Edit User</h3>
                            <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleEditUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Role *</label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="attorney">Attorney</option>
                                    <option value="legal-nurse">Legal Nurse</option>
                                    <option value="client">Client</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Status *</label>
                                <select
                                    required
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Updating...' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-red-600">Delete User</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Are you sure you want to delete <span className="font-bold">{selectedUser.fullName}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UsersManagement;
