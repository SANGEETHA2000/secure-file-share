import React, { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { uploadFile } from '../../store/slices/fileSlice.ts';
import { UploadCloud, X, Loader } from 'lucide-react';

const FileUpload: React.FC = () => {
    const dispatch = useAppDispatch();
    const { loading, uploadProgress } = useAppSelector(state => state.files);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Handle the actual file upload
    const handleFileUpload = useCallback(async (file: File) => {
        try {
            await dispatch(uploadFile(file)).unwrap();
            setSelectedFile(null);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    }, [dispatch]);

    // Handle files being dropped
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            setSelectedFile(files[0]);
            handleFileUpload(files[0]);
        }
    }, [handleFileUpload]);

    // Handle drag events to show visual feedback
    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    // Handle file selection through the file input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            handleFileUpload(e.target.files[0]);
        }
    };

    // Clear selected file
    const handleClear = () => {
        setSelectedFile(null);
    };

    return (
        <div className="w-full">
            {/* Upload Container */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 
                    ${dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}
                    ${loading ? 'opacity-50' : ''}
                    transition-all duration-200 ease-in-out`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {/* Upload Icon and Text */}
                <div className="flex flex-col items-center justify-center space-y-3">
                    <UploadCloud 
                        className={`h-12 w-12 ${dragActive ? 'text-indigo-600' : 'text-gray-400'}`}
                    />
                    <div className="flex flex-col items-center space-y-2">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                            Files will be encrypted before upload
                        </p>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        onChange={handleChange}
                        className="hidden"
                        id="file-upload"
                        disabled={loading}
                    />

                    {/* Upload Button */}
                    <label
                        htmlFor="file-upload"
                        className={`
                            px-4 py-2 text-sm font-medium rounded-md
                            ${loading 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'}
                            text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                        `}
                    >
                        Select File
                    </label>
                </div>

                {/* Selected File Display */}
                {selectedFile && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                    {selectedFile.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                    ({Math.round(selectedFile.size / 1024)} KB)
                                </span>
                            </div>
                            {!loading && (
                                <button
                                    onClick={handleClear}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Upload Progress */}
                {loading && uploadProgress !== null && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Uploading...</span>
                            <span className="text-sm text-gray-600">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
                        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;