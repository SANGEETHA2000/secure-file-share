import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/redux.ts';
import FileListLayout from '../layout/FileListLayout.tsx';
import FileDownload from './FileDownload.tsx';

export const SharedFileList: React.FC = () => {
    const { sharedFiles, loading } = useAppSelector(state => state.files);
    const [searchTerm, setSearchTerm] = useState('');
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

    const renderFileActions = (file: any) => (
        <FileDownload fileId={file.id} fileName={file.original_name} />
    );

    return (
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
    );
};

export default SharedFileList;