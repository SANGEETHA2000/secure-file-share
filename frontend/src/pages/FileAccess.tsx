import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/redux.ts';
import { verifyShareAccess } from '../store/slices/fileSlice.ts';
import { AlertCircle, Loader, Copy, CheckCircle } from 'lucide-react';
import { LogoLayout } from '../components/layout/LogoLayout.tsx';

interface GuestCredentials {
    username: string;
    password: string;
}

const FileAccess: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [guestCredentials, setGuestCredentials] = useState<GuestCredentials | null>(null);
    const [credentialsCopied, setCredentialsCopied] = useState(false);

    const handleAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !token) return;

        try {
            setIsLoading(true);
            setError(null);

            const result = await dispatch(verifyShareAccess({ token, email })).unwrap();
            console.log(result);
            if (result.isNewUser) {
                // For new users, show their temporary credentials
                setGuestCredentials({
                    username: result.username || '',
                    password: result.temporaryPassword || ''
                });
            } else {
                // For existing users, redirect to login page with a message
                navigate('/login', { 
                    state: { 
                        message: 'Please log in to access the shared file',
                        returnUrl: '/guest/shared'  // We'll handle this in the login component
                    }
                });
            }
        } catch (error: any) {
            setError(error.message || 'Failed to access file');
        } finally {
            setIsLoading(false);
        }
    };

    const copyCredentials = async () => {
        if (!guestCredentials) return;
        
        const credentialsText = `Username: ${guestCredentials.username}\nPassword: ${guestCredentials.password}`;
        
        try {
            await navigator.clipboard.writeText(credentialsText);
            setCredentialsCopied(true);
            
            // Reset the copied status after 3 seconds
            setTimeout(() => setCredentialsCopied(false), 3000);
        } catch (err) {
            setError('Failed to copy credentials. Please copy them manually.');
        }
    };

    const proceedToLogin = () => {
        if (guestCredentials) {
            navigate('/login', {
                state: { 
                    message: 'Please log in with your temporary credentials. You can change your password after logging in.',
                    returnUrl: '/guest/shared'
                }
            });
        }
    };

    // If we're showing guest credentials, render that view
    if (guestCredentials) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <LogoLayout />
                    <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="space-y-6">
                            <div className="text-center">
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                                <h2 className="mt-4 text-2xl font-bold text-gray-900">Account Created</h2>
                                <p className="mt-2 text-sm text-gray-500">
                                    Your temporary guest account has been created. Please save these credentials:
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md space-y-2">
                                <p className="text-sm"><strong>Username:</strong> {guestCredentials.username}</p>
                                <p className="text-sm"><strong>Password:</strong> {guestCredentials.password}</p>
                            </div>

                            <button
                                onClick={copyCredentials}
                                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <Copy className={`mr-2 h-4 w-4 ${credentialsCopied ? 'text-green-500' : 'text-gray-500'}`} />
                                {credentialsCopied ? 'Copied!' : 'Copy Credentials'}
                            </button>

                            <button
                                onClick={proceedToLogin}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Proceed to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Otherwise, show the email input form
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <LogoLayout />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Access Shared File
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter your email address to access the shared file
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form onSubmit={handleAccess} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border 
                                             border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter your email address"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent 
                                      rounded-md shadow-sm text-sm font-medium text-white 
                                      ${isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}
                                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="animate-spin h-5 w-5 mr-2" />
                                    Verifying...
                                </>
                            ) : (
                                'Access File'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FileAccess;