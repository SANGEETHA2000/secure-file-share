import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { useAppDispatch } from '../../hooks/redux.ts';
import { downloadFile } from '../../store/slices/fileSlice.ts';

interface FileDownloadProps {
    fileId: string;
    fileName: string;
}

const FileDownload: React.FC<FileDownloadProps> = ({ fileId, fileName }) => {
    const dispatch = useAppDispatch();
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDownloading) return; // Prevent multiple simultaneous downloads
        
        setIsDownloading(true);
        try {
            await dispatch(downloadFile(fileId)).unwrap();
        } catch (error) {
            // You might want to show an error notification here
            console.error('Download failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-1 hover:bg-gray-100 rounded-full relative group"
            title={`Download ${fileName}`}
        >
            {isDownloading ? (
                <Loader className="h-5 w-5 text-gray-500 animate-spin" />
            ) : (
                <Download className="h-5 w-5 text-gray-500 group-hover:text-indigo-600" />
            )}
            
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Download
            </span>
        </button>
    );
};

export default FileDownload;