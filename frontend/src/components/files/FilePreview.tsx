// src/components/files/FilePreview.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader, MaximizeIcon, MinimizeIcon } from 'lucide-react';
import api from '../../api/axios.ts';
import { decryptFile } from '../../utils/encryption.ts';

interface FilePreviewProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    fileName: string;
    mimeType: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
    isOpen,
    onClose,
    fileId,
    fileName,
    mimeType
}) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const fetchAndDecryptPreview = async () => {
            try {
                setLoading(true);
                setError(null);
                // Fetch encrypted file with client key in headers
                const response = await api.get(`/files/${fileId}/preview/`, {
                    responseType: 'blob'
                });
                // Get client encryption key from headers
                const clientKey = response.headers['x-client-key'];
                if (clientKey && clientKey != 'None') {
                    // Convert blob to ArrayBuffer for decryption
                    const encryptedBuffer = await response.data.arrayBuffer();
                    
                    // Decrypt the content
                    const decryptedContent = await decryptFile(encryptedBuffer, clientKey);
                    
                    // Create URL for decrypted content
                    const blob = new Blob([decryptedContent], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    setContent(url);
                } else {
                    // If no client key, use the content directly
                    const url = URL.createObjectURL(response.data);
                    setContent(url);
                }
            } catch (error) {
                console.error('Preview error:', error);
                setError('Failed to load preview');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && fileId) {
            fetchAndDecryptPreview();
        }

        return () => {
            if (content) {
                URL.revokeObjectURL(content);
            }
        };
    }, [isOpen, fileId, mimeType]);

    if (!isOpen) return null;

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const renderPreview = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-full">
                    <Loader className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex justify-center items-center h-full text-red-600">
                    {error}
                </div>
            );
        }

        if (!content) return null;

        switch (mimeType) {
            case 'application/pdf':
                return (
                    <iframe
                        src={content}
                        className="w-full h-full"
                        title={fileName}
                    />
                );
            case 'image/jpeg':
            case 'image/png':
                return (
                    <img
                        src={content}
                        alt={fileName}
                        className="max-h-full max-w-full object-contain"
                    />
                );
            case 'text/plain':
                return (
                    <iframe
                        src={content}
                        className="w-full h-full bg-white"
                        title={fileName}
                    />
                );
            default:
                return (
                    <div className="text-center text-gray-500">
                        Preview not available for this file type
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg shadow-xl flex flex-col ${
                isFullscreen ? 'w-full h-full' : 'w-4/5 h-4/5 max-w-6xl max-h-[80vh]'
            }`}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-medium">{fileName}</h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleFullscreen}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            {isFullscreen ? (
                                <MinimizeIcon className="h-5 w-5" />
                            ) : (
                                <MaximizeIcon className="h-5 w-5" />
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto p-4">
                    {renderPreview()}
                </div>
            </div>
        </div>
    );
};

export default FilePreview;