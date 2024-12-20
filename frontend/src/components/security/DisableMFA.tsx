import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/redux.ts';
import { disableMFA } from '../../store/slices/authSlice.ts';
import { Loader, Lock, CheckCircle, XCircle } from 'lucide-react';

interface DisableMFAFormData {
    password: string;
}

interface DisableMFAFormProps {
    onClose: () => void;
}

const DisableMFAForm: React.FC<DisableMFAFormProps> = ({ onClose }) => {
    const dispatch = useAppDispatch();

    const [formData, setFormData] = useState<DisableMFAFormData>({
        password: '',
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await dispatch(disableMFA(formData.password)).unwrap();
            setSuccess(true);
        } catch (err) {
            setError('Failed to disable MFA. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                >
                    <XCircle className="h-6 w-6" />
                </button>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">Disable Multi-Factor Authentication</h2>
                </div>
                {success ? (
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-800">MFA Disabled Successfully</p>
                        <button
                            onClick={onClose}
                            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="Enter your password"
                            className={`input-field ${error ? 'input-error' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                        />

                        {error && (
                            <div className="error-message">
                                <Lock className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin h-4 w-4" />
                                    <span>Disabling MFA...</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    <span>Disable MFA</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DisableMFAForm;