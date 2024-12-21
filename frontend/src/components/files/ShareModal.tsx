// src/components/files/ShareModal.tsx
import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/redux.ts';
import { X, Copy, AlertCircle, CheckCircle } from 'lucide-react';
import { createShareLink } from '../../store/slices/fileSlice.ts';
import { validateEmail, sanitizeInput } from '../../utils/validation.ts';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    fileName: string;
}

const EXPIRY_OPTIONS = [
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '6 hours', value: 360 },
    { label: '1 day', value: 1440 },
    { label: '3 days', value: 4320 },
    { label: '7 days', value: 10080 }
];

const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    fileId,
    fileName
}) => {
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [expiryMinutes, setExpiryMinutes] = useState(30);
    const [permission, setPermission] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [urlCopied, setUrlCopied] = useState(false);

    const handleShare = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setSuccess(null);

            if (!email) {
                setError('Email address is required');
                return;
            }

            // Sanitize email input
            const sanitizedEmail = sanitizeInput(email);
            
            // Validate email
            const emailValidation = validateEmail(sanitizedEmail);
            if (!emailValidation.isValid) {
                setError(emailValidation.error);
                return;
            }

            const result = await dispatch(createShareLink({
                fileId,
                email: sanitizedEmail,
                expires_in_minutes: expiryMinutes,
                permission
            })).unwrap();

            // Generate share URL
            const shareUrl = `${window.location.origin}/share/${result.access_token}`;
            setShareUrl(shareUrl);
            setSuccess(`File shared successfully with ${email}`);
            setEmail('');
        } catch (error: any) {
            setError(error.message || 'Failed to share file');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (shareUrl) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setUrlCopied(true);
                setTimeout(() => setUrlCopied(false), 3000);
            } catch (err) {
                setError('Failed to copy link');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Share {fileName}</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Share with (Email address) *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                                     focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Link expires in
                        </label>
                        <select
                            value={expiryMinutes}
                            onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                                     focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {EXPIRY_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Permissions
                        </label>
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as 'VIEW' | 'DOWNLOAD')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                                     focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="VIEW">View only</option>
                            <option value="DOWNLOAD">View and download</option>
                        </select>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span>{success}</span>
                        </div>
                    )}

                    {shareUrl && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="truncate mr-2">
                                    <p className="text-sm text-gray-500">Share Link:</p>
                                    <p className="text-sm font-mono truncate">{shareUrl}</p>
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700"
                                    title="Copy link"
                                >
                                    <Copy className={`mr-2 h-5 w-5 ${urlCopied ? 'text-green-500' : 'text-gray-500'}`} />
                                    {urlCopied ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleShare}
                        disabled={isLoading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent 
                                  rounded-md shadow-sm text-sm font-medium text-white 
                                  ${isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}
                                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                        {isLoading ? 'Sharing...' : 'Share File'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;