import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { fetchAllUsers, updateUserRole } from '../../store/slices/adminSlice.ts';
import { Users, Shield, HardDrive, Activity, Loader, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const UsersManage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { users, loading } = useAppSelector(state => state.admin);
    const { user: currentUser } = useAppSelector(state => state.auth);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchAllUsers());
    }, [dispatch]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (userId === currentUser?.id) {
            setRoleUpdateError("You cannot change your own role.");
            return;
        }

        try {
            await dispatch(updateUserRole({ userId, role: newRole })).unwrap();
            setRoleUpdateError(null);
        } catch (error) {
            console.error('Failed to update user role:', error);
            setRoleUpdateError('Failed to update user role. Please try again.');
        }
    };

    const formatStorageSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate system statistics
    const totalUsers = users.length;
    const totalStorage = users.reduce((acc, user) => acc + user.storage_used, 0);
    const mfaEnabledUsers = users.filter(user => user.mfa_enabled).length;
    const usersByRole = {
        ADMIN: users.filter(user => user.role === 'ADMIN').length,
        USER: users.filter(user => user.role === 'USER').length,
        GUEST: users.filter(user => user.role === 'GUEST').length
    };

    return (
        <div className="p-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-indigo-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-semibold text-gray-900">{totalUsers}</p>
                            <div className="mt-1 text-xs text-gray-500">
                                Admin: {usersByRole.ADMIN} • Regular: {usersByRole.USER} • Guest: {usersByRole.GUEST}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <Shield className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">MFA Enabled</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {totalUsers > 0 ? ((mfaEnabledUsers / totalUsers) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <HardDrive className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Storage Used</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {formatStorageSize(totalStorage)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <Activity className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Today</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {users.filter(user =>
                                    new Date(user.last_login).toDateString() === new Date().toDateString()
                                ).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Management Section */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage user roles and monitor account activity
                    </p>
                </div>

                {roleUpdateError && (
                    <div className="mx-6 mt-4 flex items-center p-4 bg-red-50 text-red-700 rounded-md">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        {roleUpdateError}
                    </div>
                )}

                {/* Search Bar */}
                <div className="p-4">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Storage Used
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    MFA Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Active
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center">
                                        <Loader className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className={user.id === currentUser?.id ? 'bg-blue-50' : ''}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.username}
                                                        {user.id === currentUser?.id && (
                                                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={user.id === currentUser?.id}
                                                className={`text-sm rounded-md border-gray-300 
                                                    focus:ring-indigo-500 focus:border-indigo-500
                                                    ${user.id === currentUser?.id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="USER">User</option>
                                                <option value="ADMIN">Admin</option>
                                                <option value="GUEST">Guest</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatStorageSize(user.storage_used)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.mfa_enabled
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {user.mfa_enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersManage;