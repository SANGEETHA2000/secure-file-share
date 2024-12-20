// src/components/files/ShareModal.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../hooks/redux.ts';
import { X, Copy, AlertCircle, CheckCircle, XCircle} from 'lucide-react';
import { createShareLink, fetchFileShares } from '../../store/slices/fileSlice.ts';

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

    const handleShare = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setSuccess(null);

            if (!email) {
                setError('Email address is required');
                return;
            }

            await dispatch(createShareLink({
                fileId,
                email,
                expires_in_minutes: expiryMinutes,
                permission
            })).unwrap();

            setSuccess(`File shared successfully with ${email}`);
            setEmail('');
        } catch (error: any) {
            setError(error.message || 'Failed to share file');
        } finally {
            setIsLoading(false);
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