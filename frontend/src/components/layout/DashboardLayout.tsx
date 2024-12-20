// src/components/layout/DashboardLayout.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { FolderIcon, ShareIcon, UsersIcon, LogOutIcon, Shield, LucideIcon } from 'lucide-react';
import { fetchUserProfile, logout } from '../../store/slices/authSlice.ts';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, loading } = useAppSelector(state => state.auth);

  const isActivePath = (path: string) => {
    if (path === '/admin' && currentPath.startsWith('/admin')) {
        return true;
    }
    return currentPath === path;
  };

  const getLinkClassName = (path: string | undefined) => {
      const baseClasses = "group w-full flex items-center rounded-md px-3 py-2 text-sm font-medium";
      return `${baseClasses} ${
          path && isActivePath(path)
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
      }`;
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    if (!user && localStorage.getItem('token')) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, user]);

  // Role-based navigation configurations
  const adminNavigation: NavigationItem[] = [
    { name: 'Users', icon: UsersIcon, href: '/admin/users' },
    { name: 'Files', icon: FolderIcon, href: '/admin/files' },
    { name: 'Security Settings', icon: Shield, href: '/security' },
    { name: 'Logout', icon: LogOutIcon, onClick: handleLogout },
  ];

  const userNavigation: NavigationItem[] = [
    { name: 'My Files', icon: FolderIcon, href: '/user/files' },
    { name: 'Files Shared with Me', icon: ShareIcon, href: '/user/shared' },
    { name: 'Security Settings', icon: Shield, href: '/security' },
    { name: 'Logout', icon: LogOutIcon, onClick: handleLogout },
  ];

  const guestNavigation: NavigationItem[] = [
    { name: 'Files Shared with Me', icon: ShareIcon, href: '/guest/shared' },
    { name: 'Security Settings', icon: Shield, href: '/security' },
    { name: 'Logout', icon: LogOutIcon, onClick: handleLogout },
  ];

  const navigationItems = user?.role === 'ADMIN' 
    ? adminNavigation 
    : user?.role === 'GUEST'
    ? guestNavigation
    : userNavigation;

  const renderNavigationItem = (item: NavigationItem) => {
    const IconComponent = item.icon;
    if (item.onClick) {
      return (
        <button
          key={item.name}
          onClick={item.onClick}
          className={getLinkClassName(item.href)}
        >
          <IconComponent className={`mr-3 h-6 w-6 ${
              item.href && isActivePath(item.href)
                  ? 'text-indigo-600'
                  : 'text-gray-400 group-hover:text-indigo-600'
          }`} />
          {item.name}
        </button>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href || '#'}
        className={getLinkClassName(item.href)}
      >
        <IconComponent className={`mr-3 h-6 w-6 ${
            item.href && isActivePath(item.href)
                ? 'text-indigo-600'
                : 'text-gray-400 group-hover:text-indigo-600'
        }`} />
        {item.name}
      </Link>
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
                <img src="/title.png" alt="FortiFile" className="h-6" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <span className="text-sm text-gray-500">
                  Welcome, {loading ? '...' : user?.first_name || 'Guest'}!
                </span>
              </div>
              {user && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {navigationItems.map(renderNavigationItem)}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;