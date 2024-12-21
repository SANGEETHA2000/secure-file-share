import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux.ts';
import { register } from '../store/slices/authSlice.ts';
import { AlertTriangle, Loader, Lock, UserPlus } from 'lucide-react';
import { LogoLayout } from '../components/layout/LogoLayout.tsx';
import { validateEmail, validatePassword, validateUsername, sanitizeInput } from '../utils/validation.ts';

type UserRole = 'ADMIN' | 'USER' | 'GUEST';

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: UserRole;
}

const Register = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector((state) => state.auth);
    const [ validationError, setValidationError ] = useState<string | null>(null);
    const [ passwordWarning, setPasswordWarning ] = useState<string | null>(null);

    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        role: 'USER'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);
        setPasswordWarning(null);
        const { username, email, password } = formData;
        
        // Sanitize inputs
        const sanitizedUsername = sanitizeInput(username);
        formData.username = sanitizedUsername;

        // Validate username
        const usernameValidation = validateUsername(sanitizedUsername);
        if (!usernameValidation.isValid) {
            setValidationError(usernameValidation.error);
            return;
        }

        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setValidationError(emailValidation.error);
            return;
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setValidationError(passwordValidation.errors[0]);
            return;
        }
        
        // If password is weak, warn the user
        if (passwordValidation.strength === 'weak') {
            setPasswordWarning(
                'Your password is considered weak. Consider using a stronger password with a mix of uppercase, lowercase, numbers, and special characters.'
            );
            // 3 seconds to read the warning
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const result = await dispatch(register(formData));
        if (register.fulfilled.match(result)) {
            navigate('/login', { 
                state: { message: 'Registration successful! Please log in.' }
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-8">
            <div className="w-full max-w-[400px] space-y-6">
                <LogoLayout />
                <div className="card">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold">Create Account</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Join FortiFile for secure file sharing
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    required
                                    placeholder="First Name"
                                    className="input-field"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    required
                                    placeholder="Last Name"
                                    className="input-field"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            placeholder="Username"
                            className={`input-field ${error ? 'input-error' : ''}`}
                            value={formData.username}
                            onChange={handleChange}
                        />

                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="Email address"
                            className={`input-field ${error ? 'input-error' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                        />
                        
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="USER">Regular User</option>
                            <option value="GUEST">Guest User</option>
                        </select>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="Password"
                            className={`input-field ${error ? 'input-error' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <input
                            id="password_confirm"
                            name="password_confirm"
                            type="password"
                            required
                            placeholder="Confirm Password"
                            className={`input-field ${error ? 'input-error' : ''}`}
                            value={formData.password_confirm}
                            onChange={handleChange}
                        />

                        {error && (
                            <div className="error-message">
                                <Lock className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        {validationError && (
                            <div className="error-message">
                                <Lock className="w-4 h-4" />
                                <span>{validationError}</span>
                            </div>
                        )}

                        {passwordWarning && (
                            <div className="warning-message">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                <span>{passwordWarning}</span>
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
                            <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                            <UserPlus className="h-4 w-4" />
                            <span>Create Account</span>
                            </>
                        )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-brand-primary hover:text-brand-dark transition-colors duration-200"
                        >
                            Sign in here
                        </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;