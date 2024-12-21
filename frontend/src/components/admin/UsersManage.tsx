import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { fetchAllUsers } from '../../store/slices/adminSlice.ts';
import { Users, Shield, HardDrive, Activity, Loader, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import StatisticsCard from '../layout/StatisticsCardLayout.tsx';

const UsersManage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { users, loading } = useAppSelector(state => state.admin);
    const { user: currentUser } = useAppSelector(state => state.auth);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(fetchAllUsers());
    }, [dispatch]);

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
                <StatisticsCard
                    icon={Users}
                    title="Total Users"
                    value={totalUsers}
                    iconColor="text-indigo-600"
                    subtitle={`Admin: ${usersByRole.ADMIN}, User: ${usersByRole.USER}, Guest: ${usersByRole.GUEST}`}
                />
                
                <StatisticsCard
                    icon={Shield}
                    title="MFA Enabled"
                    value={`${totalUsers > 0 ? ((mfaEnabledUsers / totalUsers) * 100).toFixed(1) : 0}%`}
                    iconColor="text-green-600"
                />
                
                <StatisticsCard
                    icon={HardDrive}
                    title="Total Storage Used"
                    value={formatStorageSize(totalStorage)}
                    iconColor="text-blue-600"
                />
                
                <StatisticsCard
                    icon={Activity}
                    title="Active Today"
                    value={users.filter(user =>
                        new Date(user.last_login).toDateString() === new Date().toDateString()
                    ).length}
                    iconColor="text-purple-600"
                />
            </div>

            {/* User Management Section */}           
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">All Users</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage user roles and monitor account activity</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className='relative'>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>
            
            <div className="bg-white rounded-lg shadow">
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
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.role}
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
                                            {user.last_login ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true }) : 'N/A'}
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