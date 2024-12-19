import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { FolderIcon, ShareIcon, UsersIcon, LogOutIcon, Shield } from 'lucide-react';
import { fetchUserProfile, logout } from '../../store/slices/authSlice.ts';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Dispatch logout action to clear Redux state
    dispatch(logout());
    // Clear any stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Navigate to login page
    navigate('/login');
  };
  const { user, loading } = useAppSelector(state => state.auth);

  useEffect(() => {
      if (!user && localStorage.getItem('token')) {
          dispatch(fetchUserProfile());
      }
  }, [dispatch, user]);

  const navigation = [
    { name: 'My Files', icon: FolderIcon, href: '/dashboard' },
    { name: 'Shared Files', icon: ShareIcon, href: '/shared' },
    { name: 'Security Settings', icon: Shield, href: '/security' },
    { name: 'Logout', icon: LogOutIcon, onClick: handleLogout, href: undefined  },
    { name: 'Users', icon: UsersIcon, href: '/users', adminOnly: true },
  ];

  const renderNavigationItem = (item) => {
    if (item.onClick) {
      return (
        <button
          key={item.name}
          onClick={item.onClick}
          className="group w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
        >
          <item.icon className="mr-3 h-6 w-6 text-gray-400 group-hover:text-indigo-600" />
          {item.name}
        </button>
      );
    }

    return (
      <a
        key={item.name}
        href={item.href}
        className="group w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
      >
        <item.icon className="mr-3 h-6 w-6 text-gray-400 group-hover:text-indigo-600" />
        {item.name}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <img src="title.png" alt="FortiFile" className="h-6" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-sm text-gray-500">
                  Welcome, {loading ? '...' : user?.first_name || 'Guest'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map(item => (
                (!item.adminOnly || user?.role === 'ADMIN') && renderNavigationItem(item)
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow">
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;