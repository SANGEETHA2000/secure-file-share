import React from 'react';
import { useAppSelector } from '../../hooks/redux.ts';
import { FolderIcon, ShareIcon, UsersIcon, LogOutIcon } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAppSelector(state => state.auth);

  const navigation = [
    { name: 'My Files', icon: FolderIcon, href: '/dashboard' },
    { name: 'Shared Files', icon: ShareIcon, href: '/shared' },
    { name: 'Users', icon: UsersIcon, href: '/users', adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">Secure File Share</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-sm text-gray-500">Welcome, {user?.first_name}</span>
              </div>
              <button className="ml-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                <LogOutIcon className="h-5 w-5" />
                <span className="ml-2">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => (
                (!item.adminOnly || user?.role === 'ADMIN') && (
                  <a
                    key={item.name}
                    href={item.href}
                    className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <item.icon className="mr-3 h-6 w-6 text-gray-400 group-hover:text-indigo-600" />
                    {item.name}
                  </a>
                )
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