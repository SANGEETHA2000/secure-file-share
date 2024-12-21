import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/redux.ts';
import FileListLayout from '../layout/FileListLayout.tsx';
import FileDownload from './FileDownload.tsx';
import FilePreview from './FilePreview.tsx';
import { Eye } from 'lucide-react';

interface SelectedFile {
    id: string;
    name: string;
    mimeType: string;
}

export const SharedFileList: React.FC = () => {
    const { sharedFiles, loading } = useAppSelector(state => state.files);
    const [searchTerm, setSearchTerm] = useState('');
    const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);
    const [sortConfig, setSortConfig] = useState<{
        key: 'name' | 'uploaded_at' | 'size';
        direction: 'asc' | 'desc';
    }>({ key: 'uploaded_at', direction: 'desc' });

    const handleSort = (key: 'name' | 'uploaded_at' | 'size') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePreview = (file: any) => {
        const previewData = {
            id: file.id,
            name: file.original_name,
            mimeType: file.mime_type
        };
        setPreviewFile(previewData);
    };

    const closePreview = () => {
        setPreviewFile(null);
    };

    const filteredAndSortedFiles = sharedFiles
        .filter(file => 
            file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;
            if (sortConfig.key === 'name') {
                return direction * a.original_name.localeCompare(b.original_name);
            } else if (sortConfig.key === 'size') {
                return direction * (a.size - b.size);
            }
            return direction * (new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
        });

    const renderFileActions = (file: any) => {
        const canPreview = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'].includes(file.mime_type);
        const hasDownloadPermission = file.share_permission === 'DOWNLOAD';
        console.log(file);
        return (
            <>
                {canPreview && (
                    <button
                        onClick={() => handlePreview(file)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="Preview"
                    >
                        <Eye className="h-5 w-5 text-gray-500" />
                    </button>
                )}
                {hasDownloadPermission && (
                    <FileDownload fileId={file.id} fileName={file.original_name} />
                )}
            </>
        );
    };

    return (
        <>
            <FileListLayout
                title="Shared Files"
                description="Files shared with you"
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                loading={loading}
                renderFileActions={renderFileActions}
                files={filteredAndSortedFiles}
                showUploadedBy={true}
                sortConfig={sortConfig}
                onSort={handleSort}
            />

            {/* FilePreview Modal */}
            {previewFile && (
                <FilePreview
                    isOpen={true}
                    onClose={closePreview}
                    fileId={previewFile.id}
                    fileName={previewFile.name}
                    mimeType={previewFile.mimeType}
                />
            )}
        </>
    );
};

export default SharedFileList;