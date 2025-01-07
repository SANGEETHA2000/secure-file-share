import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/redux.ts';
import { Shield, Lock, QrCode } from 'lucide-react';
import MFASetup from './MFASetup.tsx';
import DashboardLayout from '../layout/DashboardLayout.tsx';
import ChangePasswordForm from './ChangePassword.tsx';
import DisableMFAForm from './DisableMFA.tsx';

// The SecuritySettings component provides a central place for users to manage their security preferences,
// with a primary focus on MFA setup and management.
const SecuritySettings = () => {
    const { user } = useAppSelector(state => state.auth);
    const [showMFASetup, setShowMFASetup] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showDisableMFA, setShowDisableMFA] = useState(false);
    
    // If the MFA setup modal is open, we show that instead of the main security settings
    if (showMFASetup) {
        return <MFASetup onClose={() => setShowMFASetup(false)} />;
    }
    
    if (showChangePassword) {
        return <ChangePasswordForm onClose={() => setShowChangePassword(false)} />;
    }

    if (showDisableMFA) {
        return <DisableMFAForm onClose={() => setShowDisableMFA(false)} />;
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your account security preferences and enable additional protection measures.
                    </p>
                </div>

                {/* MFA Status Card */}
                <div className="bg-white shadow rounded-lg">
                    <div className="p-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-1">
                                <Shield className={`h-6 w-6 ${user?.mfa_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Two-Factor Authentication (2FA)
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Add an extra layer of security to your account by requiring both your password
                                    and an authentication code from your phone to sign in.
                                </p>
                                <div className="mt-4">
                                    {user?.mfa_enabled ? (
                                        <div className="flex items-center space-x-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Enabled
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowDisableMFA(true)}
                                                className="text-sm text-red-600 hover:text-red-500"
                                            >
                                                Disable 2FA
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowMFASetup(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent 
                                                    text-sm font-medium rounded-md shadow-sm text-white 
                                                    bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
                                                    focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <QrCode className="h-5 w-5 mr-2" />
                                            Set Up 2FA
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Security Card */}
                <div className="bg-white shadow rounded-lg">
                    <div className="p-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <Lock className="h-6 w-6 pt-1 text-gray-400" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Password Security
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Keep your account secure by using a strong password and changing it periodically.
                                </p>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowChangePassword(true)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 
                                                shadow-sm text-sm font-medium rounded-md text-gray-700 
                                                bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                                                focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SecuritySettings;
