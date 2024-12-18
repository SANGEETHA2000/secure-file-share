import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { login, verifyMFA } from '../../store/slices/authSlice.ts';
import { Loader, Lock } from 'lucide-react';
import { Header } from '../layout/Header.tsx';

const Login = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, error, requiresMFA, isAuthenticated, tempUserId } = useAppSelector(
        (state) => state.auth
    );

    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });
    const [mfaToken, setMfaToken] = useState('');
    const registrationMessage = location.state?.message;

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(login(credentials));
    };

    const handleMFASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tempUserId) {
            dispatch(verifyMFA({ userId: tempUserId, token: mfaToken }));
        }
    };

    // If MFA is required, show the MFA input form
    if (requiresMFA) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Enter Authentication Code
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Please enter the 6-digit code from your authenticator app
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleMFASubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <input
                                type="text"
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value)}
                                placeholder="000000"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                maxLength={6}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? (
                                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            ) : (
                                'Verify Code'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Main login form
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-8">
            <div className="w-full max-w-[400px] space-y-6 gap-4">
                <Header />
                <div className="card">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold">Sign In</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {registrationMessage && (
                            <div className="success-message">{registrationMessage}</div>
                        )}

                        <div className="space-y-4">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Username"
                                autoComplete="username"
                                required
                                value={credentials.username}
                                onChange={handleChange}
                                className={`input-field ${error ? 'input-error' : ''}`}
                            />

                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Password"
                                autoComplete="current-password"
                                required
                                value={credentials.password}
                                onChange={handleChange}
                                className={`input-field ${error ? 'input-error' : ''}`}
                            />
                        </div>

                        {error && (
                        <div className="error-message">
                            <Lock className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center"
                            disabled={loading}
                            >
                            {loading ? (
                                <>
                                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="text-center text-sm text-gray-600 mb-4">
                            New to FortiFile?
                        </div>
                        <Link
                            to="/register"
                            className="block text-center px-4 py-2 border border-gray-300 rounded-md
                                        text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                            >
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        
    );
};

export default Login;