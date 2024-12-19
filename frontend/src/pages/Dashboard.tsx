import React, { useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout.tsx';
import { Upload } from 'lucide-react';
import FileUpload from '../components/files/FileUpload.tsx';
import FileList from '../components/files/FileList.tsx';
import { fetchFiles } from '../store/slices/fileSlice.ts';
import { useAppSelector } from '../hooks/redux.ts';
import { useAppDispatch } from '../hooks/redux.ts';
import { fetchUserProfile } from '../store/slices/authSlice.ts';

const Dashboard = () => {

  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const hasInitiallyFetched = useRef(false);
  
  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            if (!user) {
                await dispatch(fetchUserProfile());
            }
            if (!hasInitiallyFetched.current) {
              await dispatch(fetchFiles());
              hasInitiallyFetched.current = true;
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    if (isAuthenticated) {
        fetchInitialData();
    }
  }, [isAuthenticated, user, dispatch]);

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
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;