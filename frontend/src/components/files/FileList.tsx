import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { deleteFile } from '../../store/slices/fileSlice.ts';
import { Share2, Trash2, Search, Loader, FileIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import FileDownload from './FileDownload.tsx';
import ShareModal from './ShareModal.tsx';

// We define a utility function to format file sizes in a human-readable way
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const FileList: React.FC = () => {
    const dispatch = useAppDispatch();
    const { files, loading } = useAppSelector(state => state.files);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: 'name' | 'uploaded_at' | 'size';
        direction: 'asc' | 'desc';
    }>({ key: 'uploaded_at', direction: 'desc' });
    const [selectedFile, setSelectedFile] = useState<{id: string; name: string} | null>(null);

    // Handle file download
    const handleDownload = async (fileId: string) => {
        console.log('Downloading file:', fileId);
    };

    // Handle file deletion with confirmation
    const handleDelete = async (fileId: string) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            try {
                await dispatch(deleteFile(fileId)).unwrap();
            } catch (error) {
                console.error('Failed to delete file:', error);
            }
        }
    };

    // Handle sharing
    const handleShare = (fileId: string, fileName: string) => {
        setSelectedFile({ id: fileId, name: fileName });
    };

    // Handle sorting
    const handleSort = (key: 'name' | 'uploaded_at' | 'size') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Filter and sort files based on search term and sort config
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

    // Render the sort indicator arrow
    const renderSortArrow = (key: 'name' | 'uploaded_at' | 'size') => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            {/* File List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Table Header */}
                <div className="min-w-full divide-y divide-gray-200">
                    <div className="bg-gray-50">
                        <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div 
                                className="col-span-5 cursor-pointer hover:text-gray-700"
                                onClick={() => handleSort('name')}
                            >
                                Name {renderSortArrow('name')}
                            </div>
                            <div 
                                className="col-span-3 cursor-pointer hover:text-gray-700"
                                onClick={() => handleSort('uploaded_at')}
                            >
                                Uploaded {renderSortArrow('uploaded_at')}
                            </div>
                            <div 
                                className="col-span-2 cursor-pointer hover:text-gray-700"
                                onClick={() => handleSort('size')}
                            >
                                Size {renderSortArrow('size')}
                            </div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <div className="px-6 py-4 text-center">
                                <Loader className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                            </div>
                        ) : filteredAndSortedFiles.length === 0 ? (
                            <div className="px-6 py-4 text-center text-gray-500">
                                No files found
                            </div>
                        ) : (
                            filteredAndSortedFiles.map(file => (
                                <div key={file.id} className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50">
                                    <div className="col-span-5 flex items-center">
                                        <FileIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="truncate">{file.original_name}</span>
                                    </div>
                                    <div className="col-span-3 text-sm text-gray-500 flex items-center">
                                        {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-500 flex items-center">
                                        {formatFileSize(file.size)}
                                    </div>
                                    <div className="col-span-2 flex justify-end space-x-2">
                                        <button
                                            onClick={() => handleDownload(file.id)}
                                            className="p-1 hover:bg-gray-100 rounded-full"
                                            title="Download"
                                        >
                                            <FileDownload fileId={file.id} fileName={file.original_name} />
                                        </button>
                                        <button
                                            onClick={() => handleShare(file.id, file.original_name)}
                                            className="p-1 hover:bg-gray-100 rounded-full"
                                            title="Share"
                                        >
                                            <Share2 className="h-5 w-5 text-gray-500" />
                                            {selectedFile && (
                                                <ShareModal
                                                    fileId={selectedFile.id}
                                                    fileName={selectedFile.name}
                                                    isOpen={true}
                                                    onClose={() => setSelectedFile(null)}
                                                />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="p-1 hover:bg-gray-100 rounded-full"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-5 w-5 text-red-500" />
                                        </button>
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

export default FileList;