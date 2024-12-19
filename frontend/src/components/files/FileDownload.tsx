import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import api from '../../api/axios.ts';

interface FileDownloadProps {
    fileId: string;
    fileName: string;
}

const FileDownload: React.FC<FileDownloadProps> = ({ fileId, fileName }) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (downloading) return; // Prevent multiple simultaneous downloads

        try {
            setDownloading(true);
            
            // Make the download request with blob response type
            const response = await api.get(`/files/${fileId}/download/`, {
                responseType: 'blob',  // This is crucial for handling binary data
            });

            // Create a blob URL and trigger the download
            const blob = new Blob([response.data], { 
                type: response.headers['content-type'] 
            });
            const url = window.URL.createObjectURL(blob);
            
            // Create and use a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // You might want to add error handling UI here
        } finally {
            setDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-1 hover:bg-gray-100 rounded-full"
            title={downloading ? 'Downloading...' : 'Download'}
        >
            {downloading ? (
                <Loader className="h-5 w-5 text-gray-500 animate-spin" />
            ) : (
                <Download className="h-5 w-5 text-gray-500" />
            )}
        </button>
    );
};

export default FileDownload;