import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.tsx';

const GuestDashboard: React.FC = () => {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
};

export default GuestDashboard;