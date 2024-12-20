// src/components/files/FileDownload.tsx
import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/redux.ts';
import { downloadFile } from '../../store/slices/fileSlice.ts';
import { Download, Loader, AlertCircle } from 'lucide-react';
import { decryptFile } from '../../utils/encryption.ts';

interface FileDownloadProps {
    fileId: string;
    fileName: string;
    className?: string;
}

const FileDownload: React.FC<FileDownloadProps> = ({ 
    fileId, 
    fileName,
    className = "p-1 hover:bg-gray-100 rounded-full" 
}) => {
    const dispatch = useAppDispatch();
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [decryptionProgress, setDecryptionProgress] = useState<number | null>(null);

    const handleDownload = async () => {
        if (downloading) return;

        try {
            setDownloading(true);
            setError(null);
            setDecryptionProgress(0);
            
            // Get the server-decrypted file and client key
            const result = await dispatch(downloadFile(fileId)).unwrap();

            // If no client key, just download the file directly
            if (!result.clientKey) {
                const url = window.URL.createObjectURL(new Blob([result.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', result.filename || fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                return;
            }

            // Convert Blob to ArrayBuffer for decryption
            setDecryptionProgress(25);
            const encryptedBuffer = await result.data.arrayBuffer();
            
            // Decrypt the file using client key
            setDecryptionProgress(50);
            const decryptedContent = await decryptFile(encryptedBuffer, result.clientKey);
            
            setDecryptionProgress(75);
            // Create a blob with the decrypted content
            const decryptedBlob = new Blob([decryptedContent], { 
                type: result.contentType 
            });

            // Create download URL and trigger download
            const url = window.URL.createObjectURL(decryptedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', result.filename || fileName);
            
            setDecryptionProgress(90);
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            link.remove();
            window.URL.revokeObjectURL(url);
            setDecryptionProgress(100);

        } catch (error) {
            console.error('Download/Decryption failed:', error);
            setError('Failed to download file. Please try again.');
        } finally {
            setDownloading(false);
            setTimeout(() => {
                setDecryptionProgress(null);
            }, 1000);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleDownload}
                disabled={downloading}
                className={`${className} ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={downloading ? 'Downloading...' : 'Download'}
            >
                {downloading ? (
                    <div className="relative">
                        <Loader className="h-5 w-5 text-gray-500 animate-spin" />
                        {decryptionProgress !== null && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-200 rounded-full">
                                <div 
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                                    style={{ width: `${decryptionProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <Download className="h-5 w-5 text-gray-500" />
                )}
            </button>

            {error && (
                <div className="absolute bottom-full mb-2 right-0 w-48 bg-red-50 text-red-800 text-xs p-2 rounded-md shadow-lg">
                    <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-400 mr-1 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileDownload;