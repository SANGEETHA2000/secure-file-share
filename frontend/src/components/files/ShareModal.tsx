import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { createShareLink, fetchFileShares, removeShare } from '../../store/slices/fileSlice.ts';
import { X, Copy, Link, Mail, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ShareModalProps {
    fileId: string;
    fileName: string;
    isOpen: boolean;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ fileId, fileName, isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const { shareLinks, sharingLoading } = useAppSelector(state => state.files);
    const [email, setEmail] = useState('');
    const [expiresIn, setExpiresIn] = useState(24); // Default 24 hours
    const [permission, setPermission] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchFileShares(fileId));
        }
    }, [isOpen, fileId, dispatch]);

    const handleCreateShare = async (type: 'link' | 'email') => {
        const settings = {
            fileId,
            permission,
            expiresIn,
            ...(type === 'email' ? { email } : {})
        };

        await dispatch(createShareLink(settings));
        if (type === 'email') {
            setEmail('');
        }
    };

    const handleCopyLink = (accessToken: string) => {
        const shareUrl = `${window.location.origin}/share/${accessToken}`;
        navigator.clipboard.writeText(shareUrl);
        // You might want to show a success notification here
    };

    const handleRemoveShare = async (shareId: string) => {
        if (window.confirm('Are you sure you want to remove this share?')) {
            await dispatch(removeShare(shareId));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium">Share "{fileName}"</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Share Settings */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Access Permission
                        </label>
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as 'VIEW' | 'DOWNLOAD')}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="VIEW">View Only</option>
                            <option value="DOWNLOAD">Allow Download</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Expires In
                        </label>
                        <select
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(Number(e.target.value))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value={24}>24 hours</option>
                            <option value={72}>3 days</option>
                            <option value={168}>7 days</option>
                            <option value={720}>30 days</option>
                        </select>
                    </div>

                    {/* Share via Email */}
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <button
                            onClick={() => handleCreateShare('email')}
                            disabled={!email || sharingLoading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Share
                        </button>
                    </div>

                    {/* Create Share Link */}
                    <button
                        onClick={() => handleCreateShare('link')}
                        disabled={sharingLoading}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Link className="h-4 w-4 mr-2" />
                        Create Share Link
                    </button>
                </div>

                {/* Active Shares List */}
                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Active Shares</h4>
                    <div className="space-y-2">
                        {shareLinks.map(share => (
                            <div key={share.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        {share.sharedWith ? (
                                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                        ) : (
                                            <Link className="h-4 w-4 text-gray-400 mr-2" />
                                        )}
                                        <span className="text-sm text-gray-900">
                                            {share.sharedWith ? share.sharedWith.email : 'Share Link'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Expires {formatDistanceToNow(new Date(share.expiresAt), { addSuffix: true })}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {!share.sharedWith && (
                                        <button
                                            onClick={() => handleCopyLink(share.accessToken)}
                                            className="p-1 hover:bg-gray-200 rounded-full"
                                        >
                                            <Copy className="h-4 w-4 text-gray-500" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRemoveShare(share.id)}
                                        className="p-1 hover:bg-gray-200 rounded-full"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {shareLinks.length === 0 && (
                            <div className="text-sm text-gray-500 text-center py-4">
                                No active shares
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;