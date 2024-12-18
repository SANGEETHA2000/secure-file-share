import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/redux.ts';
import Dashboard from './pages/Dashboard.tsx';
import Login from './components/auth/Login.tsx';
import Register from './components/auth/Register.tsx';

const App = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);

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
          element={!isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
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