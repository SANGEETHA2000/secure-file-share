import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { enableMFA, verifyMFASetup } from '../../store/slices/authSlice.ts';
import { QrCode, Lock, Loader } from 'lucide-react';

// This component guides users through the MFA setup process, showing QR codes
// and handling verification
const MFASetup: React.FC = () => {
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector(state => state.auth);
    const [step, setStep] = useState<'initial' | 'verify'>('initial');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState<string>('');

    // Start the MFA setup process by getting a QR code and secret
    const handleStartSetup = async () => {
        try {
            const result = await dispatch(enableMFA()).unwrap();
            setQrCode(result.provisioning_uri);
            setSecret(result.secret);
            setStep('verify');
        } catch (error) {
            console.error('Failed to start MFA setup:', error);
        }
    };

    // Verify the MFA setup with the user's input code
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(verifyMFASetup({ token: verificationCode })).unwrap();
            // You might want to show a success message or redirect
        } catch (error) {
            console.error('MFA verification failed:', error);
        }
    };

    // Helper function to format the secret key in groups for better readability
    const formatSecret = (secret: string): string => {
        return secret.match(/.{1,4}/g)?.join(' ') || secret;
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
                    <Lock className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Two-Factor Authentication
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Enhance your account security by enabling two-factor authentication
                </p>
            </div>

            {step === 'initial' ? (
                <div className="space-y-4">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Two-factor authentication adds an extra layer of security to your account
                                    by requiring a verification code in addition to your password.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleStartSetup}
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {loading ? (
                            <Loader className="animate-spin h-5 w-5" />
                        ) : (
                            <>
                                <QrCode className="h-5 w-5 mr-2" />
                                Set Up Two-Factor Authentication
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* QR Code Display */}
                    <div className="text-center">
                        <img
                            src={qrCode}
                            alt="QR Code for 2FA"
                            className="mx-auto mb-4"
                        />
                        <p className="text-sm text-gray-600 mb-2">
                            Scan this QR code with your authenticator app
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-xs text-gray-500 mb-1">
                                Manual entry code:
                            </p>
                            <p className="font-mono text-sm select-all">
                                {formatSecret(secret)}
                            </p>
                        </div>
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                id="code"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter 6-digit code"
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
                            disabled={loading || verificationCode.length !== 6}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader className="animate-spin h-5 w-5" />
                            ) : (
                                'Verify and Enable'
                            )}
                        </button>
                    </form>

                    <div className="text-sm text-gray-500">
                        <p>
                            Make sure to save your recovery codes and keep them in a safe place.
                            You'll need them if you lose access to your authenticator app.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MFASetup;