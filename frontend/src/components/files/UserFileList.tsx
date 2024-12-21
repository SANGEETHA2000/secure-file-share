import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/redux.ts';
import { Share2, Eye } from 'lucide-react';
import FileListLayout from '../layout/FileListLayout.tsx';
import FileDownload from './FileDownload.tsx';
import ShareModal from './ShareModal.tsx';
import FilePreview from './FilePreview.tsx';

interface SelectedFile {
    id: string;
    name: string;
    mimeType: string;
}

export const UserFileList: React.FC = () => {
    const { files, loading } = useAppSelector(state => state.files);
    const [searchTerm, setSearchTerm] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const [sortConfig, setSortConfig] = useState<{
        key: 'name' | 'uploaded_at' | 'size';
        direction: 'asc' | 'desc';
    }>({ key: 'uploaded_at', direction: 'desc' });
    const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);

    const handleSort = (key: 'name' | 'uploaded_at' | 'size') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleShare = (file: any) => {
        setSelectedFile({
            id: file.id,
            name: file.original_name,
            mimeType: file.mime_type
        });
        setIsShareModalOpen(true);
    };

    const handlePreview = (file: any) => {
        setPreviewFile({
            id: file.id,
            name: file.original_name,
            mimeType: file.mime_type
        });
    };

    const closeShareModal = () => {
        setIsShareModalOpen(false);
        setSelectedFile(null);
    };

    const closePreview = () => {
        setPreviewFile(null);
    };

    const filteredAndSortedFiles = files
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
                <FileDownload fileId={file.id} fileName={file.original_name} />
                <button 
                    className="p-1 hover:bg-gray-100 rounded-full" 
                    title="Share"
                    onClick={() => handleShare(file)}
                >
                    <Share2 className="h-5 w-5 text-gray-500" />
                </button>
            </>
        );
    };

    return (
        <>
            <FileListLayout
                title="My Files"
                description="Manage and share your files"
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                loading={loading}
                renderFileActions={renderFileActions}
                files={filteredAndSortedFiles}
                showUploadedBy={false}
                sortConfig={sortConfig}
                onSort={handleSort}
            />

            {/* ShareModal */}
            {selectedFile && (
                <ShareModal 
                    isOpen={isShareModalOpen}
                    onClose={closeShareModal}
                    fileId={selectedFile.id}
                    fileName={selectedFile.name}
                />
            )}

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

export default UserFileList;