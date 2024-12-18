import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { login, verifyMFA } from '../../store/slices/authSlice.ts';
import { Loader } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link 
                            to="/register" 
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            create a new account
                        </Link>
                    </p>
                </div>
                {registrationMessage && (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {/* You can add a checkmark icon here if you'd like */}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">
                                    {registrationMessage}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={credentials.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={credentials.password}
                                onChange={handleChange}
                            />
                        </div>
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
                            'Sign in'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;