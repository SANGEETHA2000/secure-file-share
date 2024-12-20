import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.tsx';

const AdminDashboard: React.FC = () => {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
};

export default AdminDashboard;