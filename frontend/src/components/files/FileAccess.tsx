import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux.ts';
import { verifyShareAccess } from '../../store/slices/fileSlice.ts';
import { login } from '../../store/slices/authSlice.ts';
import { AlertCircle, Loader } from 'lucide-react';

const FileAccess: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !token) return;

        try {
            setIsLoading(true);
            setError(null);

            // First verify share access
            const shareResult = await dispatch(verifyShareAccess({ token, email })).unwrap();
            
            // If successful, log in as guest or regular user
            await dispatch(login({ 
                username: email.split('@')[0], // Use email prefix as username
                password: shareResult.temporaryPassword || '' // For guest users
            })).unwrap();

            // Navigate to the shared file view
            navigate(`/guest/shared`);
        } catch (error: any) {
            setError(error.message || 'Failed to access file');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
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