// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/redux.ts';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import UserDashboard from './pages/user/UserDashboard.tsx';
import GuestDashboard from './pages/guest/GuestDashboard.tsx';

// Pages
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import SecuritySettings from './components/security/SecuritySettings.tsx';
import UsersManage from './components/admin/UsersManage.tsx';
import FilesManage from './components/admin/FilesManage.tsx';
import UserFiles from './pages/user/UserFiles.tsx';
import UserShared from './pages/user/UserShared.tsx';
import GuestShared from './pages/guest/GuestShared.tsx';

// Role-based redirect component
const RoleBasedRedirect: React.FC = () => {
    const { user } = useAppSelector(state => state.auth);

    if (user?.role === 'ADMIN') {
        return <Navigate to="/admin/users" replace />;
    }
    if (user?.role === 'GUEST') {
        return <Navigate to="/guest/shared" replace />;
    }
    return <Navigate to="/user/files" replace />;
};

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Common Route */}
                <Route 
                    path="/security" 
                    element={
                        <ProtectedRoute>
                            <SecuritySettings />
                        </ProtectedRoute>
                    } 
                />

                {/* Admin Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute requiredRole="ADMIN">
                        <AdminDashboard />
                    </ProtectedRoute>
                }>
                    <Route path="users" element={<UsersManage />} />
                    <Route path="files" element={<FilesManage />} />
                    <Route index element={<Navigate to="users" replace />} />
                </Route>

                {/* User Routes */}
                <Route path="/user" element={
                    <ProtectedRoute requiredRole="USER">
                        <UserDashboard />
                    </ProtectedRoute>
                }>
                    <Route path="files" element={<UserFiles />} />
                    <Route path="shared" element={<UserShared />} />
                    <Route index element={<Navigate to="files" replace />} />
                </Route>

                {/* Guest Routes */}
                <Route path="/guest" element={
                    <ProtectedRoute requiredRole="GUEST">
                        <GuestDashboard />
                    </ProtectedRoute>
                }>
                    <Route path="shared" element={<GuestShared />} />
                    <Route index element={<Navigate to="shared" replace />} />
                </Route>

                {/* Redirects */}
                <Route path="/dashboard" element={<RoleBasedRedirect />} />
                <Route path="/" element={<RoleBasedRedirect />} />
                <Route path="*" element={<RoleBasedRedirect />} />
            </Routes>
        </Router>
    );
};

export default App;