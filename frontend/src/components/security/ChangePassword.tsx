import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/redux.ts';
import { changePassword } from '../../store/slices/authSlice.ts';
import { CheckCircle, Loader, Lock, XCircle } from 'lucide-react';

interface ChangePasswordFormData {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
}

interface ChangePasswordFormProps {
    onClose: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onClose }) => {
    const dispatch = useAppDispatch();

    const [formData, setFormData] = useState<ChangePasswordFormData>({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
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

        if (formData.new_password !== formData.confirm_new_password) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await dispatch(changePassword(formData)).unwrap();
            setSuccess(true);
        } catch (err) {
            setError('Failed to change password. Please try again.');
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
                    <h2 className="text-2xl font-bold">Change Password</h2>
                </div>
                {success ? (
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-800">Password Changed Successfully</p>
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
                            id="current_password"
                            name="current_password"
                            type="password"
                            required
                            placeholder="Current Password"
                            className={`input-field ${error ? 'input-error' : ''}`}
                            value={formData.current_password}
                            onChange={handleChange}
                        />

                        <input
                            id="new_password"
                            name="new_password"
                            type="password"
                            required
                            placeholder="New Password"
                            className={`input-field ${error ? 'input-error' : ''}`}
                            value={formData.new_password}
                            onChange={handleChange}
                        />

                        <input
                            id="confirm_new_password"
                            name="confirm_new_password"
                            type="password"
                            required
                            placeholder="Confirm New Password"
                            className={`input-field ${error ? 'input-error' : ''}`}
                            value={formData.confirm_new_password}
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
                                    <span>Changing Password...</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    <span>Change Password</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePasswordForm;