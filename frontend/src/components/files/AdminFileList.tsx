import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { Clock, Files, HardDrive, Share2 } from 'lucide-react';
import FileListLayout from '../layout/FileListLayout.tsx';
import FileDownload from './FileDownload.tsx';
import { fetchAdminFiles, fetchFileStatistics } from '../../store/slices/fileSlice.ts';
import StatisticsCard from '../layout/StatisticsCardLayout.tsx';

const AdminFileList: React.FC = () => {
    const dispatch = useAppDispatch();
    const { adminFiles, loading, statistics } = useAppSelector(state => state.files);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: 'name' | 'uploaded_at' | 'size';
        direction: 'asc' | 'desc';
    }>({ key: 'uploaded_at', direction: 'desc' });

    useEffect(() => {
        dispatch(fetchAdminFiles());
        dispatch(fetchFileStatistics());
    }, [dispatch]);


    const handleSort = (key: 'name' | 'uploaded_at' | 'size') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const formatStorageSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    const filteredAndSortedFiles = adminFiles
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
        <>
            <FileDownload fileId={file.id} fileName={file.original_name} />
        </>
    );

    return (
        <>
            {statistics &&
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 pt-6">
                    <StatisticsCard
                        icon={Files}
                        title="Total Files"
                        value={statistics.totalFiles}
                        iconColor="text-indigo-600"
                    />
                    
                    <StatisticsCard
                        icon={HardDrive}
                        title="Total Storage"
                        value={formatStorageSize(statistics.totalSize)}
                        iconColor="text-blue-600"
                    />
                    
                    <StatisticsCard
                        icon={Share2}
                        title="Active Shares"
                        value={statistics.activeShares}
                        iconColor="text-green-600"
                    />
                    
                    <StatisticsCard
                        icon={Clock}
                        title="Average File Size"
                        value={formatStorageSize(
                            statistics.totalFiles > 0 
                                ? statistics.totalSize / statistics.totalFiles 
                                : 0
                        )}
                        iconColor="text-purple-600"
                    />
                </div>
            }
            <FileListLayout
                title="All Files"
                description="View and manage all files in the system"
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                loading={loading}
                renderFileActions={renderFileActions}
                files={filteredAndSortedFiles}
                showUploadedBy={true}
                sortConfig={sortConfig}
                onSort={handleSort}
            />
        </>
    );
};

export default AdminFileList;