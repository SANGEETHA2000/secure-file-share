import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout.tsx';
import { Upload } from 'lucide-react';
import FileUpload from '../components/files/FileUpload.tsx';
import FileList from '../components/files/FileList.tsx';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Files</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage and share your files securely
            </p>
          </div>
          <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Upload className="h-5 w-5 mr-2" />
            Upload File
          </button>
        </div>

        <div className="space-y-6">
          <FileUpload />
          <FileList />
        </div>

        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          Your file management interface will appear here
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;