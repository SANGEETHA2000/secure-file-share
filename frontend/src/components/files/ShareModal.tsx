// src/components/files/ShareModal.tsx
import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/redux.ts';
import { X, Copy, Link } from 'lucide-react';
import { createShareLink } from '../../store/slices/fileSlice.ts';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    fileName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    fileId,
    fileName
}) => {
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [expiresIn, setExpiresIn] = useState('24');
    const [permission, setPermission] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');
    const [generatedLink, setGeneratedLink] = useState('');

    const handleShare = async () => {
        try {
            const result = await dispatch(createShareLink({
                fileId,
                email: email || undefined,
                expiresIn: parseInt(expiresIn),
                permission
            })).unwrap();

            setGeneratedLink(`${window.location.origin}/share/${result.accessToken}`);
        } catch (error) {
            console.error('Failed to create share link:', error);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
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
                            Share with (optional)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Expires in
                        </label>
                        <select
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="24">24 hours</option>
                            <option value="72">3 days</option>
                            <option value="168">7 days</option>
                            <option value="720">30 days</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Permission
                        </label>
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as 'VIEW' | 'DOWNLOAD')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="VIEW">View only</option>
                            <option value="DOWNLOAD">Allow download</option>
                        </select>
                    </div>

                    <button
                        onClick={handleShare}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Generate Share Link
                    </button>

                    {generatedLink && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="truncate mr-2">
                                    {generatedLink}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <Copy className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;