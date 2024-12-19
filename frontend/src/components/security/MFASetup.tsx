import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { QrCode, Smartphone, XCircle } from 'lucide-react';
import { enableMFA, verifyMFASetup } from '../../store/slices/authSlice.ts';

interface MFASetupProps {
    onClose: () => void;
}

// The MFASetup component guides users through the process of enabling MFA,
// breaking it down into clear, manageable steps with visual feedback.
const MFASetup: React.FC<MFASetupProps> = ({ onClose }) => {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector(state => state.auth);
    
    const [step, setStep] = useState<'intro' | 'scan' | 'verify'>('intro');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState<string>('');

    // Handles the initial MFA setup request to get QR code and secret
    const handleStartSetup = async () => {
        try {
            const result = await dispatch(enableMFA()).unwrap();
            const encodedSecret = encodeURIComponent(result.secret);
            const provisioningUri = result.provisioning_uri //`otpauth://totp/Secure%20File%20Share:${encodedSecret}?secret=${encodedSecret}&issuer=Secure%20File%20Share`;
            // const provisioningUri = 'otpauth://totp/Secure%20File%20Share:sangeetha2000.vd%40gmail.com:?secret=L36GQTG4BEVE55OTASPSICIROPAUQSVH&issuer=Secure%20File%20Share'
            console.log(provisioningUri)
            setQrCode(provisioningUri);
            setSecret(result.secret);
            setStep('scan');
        } catch (error) {
            console.error('Failed to start MFA setup:', error);
        }
    };

    // Handles the verification of the MFA setup using the provided code
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(verifyMFASetup({ token: verificationCode })).unwrap();
            onClose(); // Close the setup flow on success
        } catch (error) {
            console.error('MFA verification failed:', error);
        }
    };

    // Helper function to format the secret key in groups for better readability
    const formatSecret = (secret: string): string => {
        return secret.match(/.{1,4}/g)?.join(' ') || secret;
    };

    // Renders the appropriate step content based on current setup stage
    const renderStepContent = () => {
        switch (step) {
            case 'intro':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center">
                            <img src="logo.png" alt="FortiFile" className="w-16 h-16" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">
                                Set Up Two-Factor Authentication
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Two-factor authentication adds an extra layer of security to your account.
                                You'll need to enter a code from your phone in addition to your password when signing in.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900">You'll need:</h4>
                            <ul className="text-sm text-gray-500 space-y-1">
                                <li>• An authenticator app like Google Authenticator or Authy</li>
                                <li>• A few minutes to complete the setup</li>
                            </ul>
                        </div>
                        <button
                            onClick={handleStartSetup}
                            disabled={loading}
                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent
                                     text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700
                                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <QrCode className="h-5 w-5 mr-2" />
                            Begin Setup
                        </button>
                    </div>
                );

            case 'scan':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">
                                Scan QR Code
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Scan this QR code with your authenticator app, or manually enter the code below.
                            </p>
                        </div>
                        
                        <div className="flex justify-center">
                            <img
                                src={qrCode}
                                alt="QR Code for 2FA"
                                className="h-48 w-48"
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-xs text-gray-500 text-center mb-2">
                                Manual entry code:
                            </p>
                            <p className="font-mono text-sm text-center select-all">
                                {formatSecret(secret)}
                            </p>
                        </div>

                        <button
                            onClick={() => setStep('verify')}
                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent
                                     text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700
                                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Smartphone className="h-5 w-5 mr-2" />
                            Next: Verify Setup
                        </button>
                    </div>
                );

            case 'verify':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">
                                Verify Setup
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Enter the 6-digit code from your authenticator app to verify the setup.
                            </p>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <label htmlFor="code" className="sr-only">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                                             placeholder-gray-400 focus:outline-none focus:ring-indigo-500
                                             focus:border-indigo-500 sm:text-sm"
                                    placeholder="Enter 6-digit code"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || verificationCode.length !== 6}
                                className="w-full flex justify-center items-center px-4 py-2 border border-transparent
                                         text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Verify Setup
                            </button>
                        </form>
                    </div>
                );
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
                {renderStepContent()}
            </div>
        </div>
    );
};

export default MFASetup;