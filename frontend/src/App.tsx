import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/redux.ts';
import Dashboard from './pages/Dashboard.tsx';
import Login from './components/auth/Login.tsx';
import Register from './components/auth/Register.tsx';
import AdminDashboard from './components/admin/AdminDashboard.tsx';
import SecuritySettings from './components/security/SecuritySettings.tsx';
import { fetchUserProfile } from './store/slices/authSlice.ts';

const App = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
        dispatch(fetchUserProfile());
    }
}, [dispatch, user]);

  return (
    <Router>
      <Routes>
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
            path="/security" 
            element={
                isAuthenticated ? (
                    <SecuritySettings />
                ) : (
                    <Navigate to="/login" replace />
                )
            } 
        />
        <Route 
            path="/admin" 
            element={
                isAuthenticated && user?.role === 'ADMIN' 
                    ? <AdminDashboard /> 
                    : <Navigate to="/dashboard" />
            } 
        />
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" />} 
        />
      </Routes>
    </Router>
  );
};

export default App;