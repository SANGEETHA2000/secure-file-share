import React, { ReactNode } from 'react';
import { Search, Loader, FileIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FileListLayoutProps {
    title: string;
    description: string;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    loading: boolean;
    renderFileActions: (file: any) => ReactNode;
    files: any[];
    showUploadedBy?: boolean;
    sortConfig: {
        key: 'name' | 'uploaded_at' | 'size';
        direction: 'asc' | 'desc';
    };
    onSort: (key: 'name' | 'uploaded_at' | 'size') => void;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const FileListLayout: React.FC<FileListLayoutProps> = ({
    title,
    description,
    searchTerm,
    onSearchChange,
    loading,
    renderFileActions,
    files,
    showUploadedBy = false,
    sortConfig,
    onSort,
}) => {
    const renderSortArrow = (key: 'name' | 'uploaded_at' | 'size') => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            {/* File List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="min-w-full divide-y divide-gray-200">
                    {/* Table Header */}
                    <div className="bg-gray-50">
                        <div className={`grid ${showUploadedBy ? 'grid-cols-12' : 'grid-cols-10'} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                            <div 
                                className="col-span-4 cursor-pointer hover:text-gray-700"
                                onClick={() => onSort('name')}
                            >
                                Name {renderSortArrow('name')}
                            </div>
                            {showUploadedBy && (
                                <div className="col-span-2">
                                    Uploaded By
                                </div>
                            )}
                            <div 
                                className="col-span-3 cursor-pointer hover:text-gray-700"
                                onClick={() => onSort('uploaded_at')}
                            >
                                Uploaded {renderSortArrow('uploaded_at')}
                            </div>
                            <div 
                                className="col-span-2 cursor-pointer hover:text-gray-700"
                                onClick={() => onSort('size')}
                            >
                                Size {renderSortArrow('size')}
                            </div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <div className="px-6 py-4 text-center">
                                <Loader className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                            </div>
                        ) : files.length === 0 ? (
                            <div className="px-6 py-4 text-center text-gray-500">
                                No files found
                            </div>
                        ) : (
                            files.map(file => (
                                <div key={file.id} className={`grid ${showUploadedBy ? 'grid-cols-12' : 'grid-cols-10'} px-6 py-4 hover:bg-gray-50`}>
                                    <div className="col-span-4 flex items-center">
                                        <FileIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="truncate">{file.original_name}</span>
                                    </div>
                                    {showUploadedBy && (
                                        <div className="col-span-2 flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {file.uploaded_by?.username}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {file.uploaded_by?.email}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-span-3 text-sm text-gray-500 flex items-center">
                                        {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-500 flex items-center">
                                        {formatFileSize(file.size)}
                                    </div>
                                    <div className="col-span-1 flex justify-end space-x-2">
                                        {renderFileActions(file)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileListLayout;