import React, { useCallback, useState } from 'react';
import { useAppSelector } from '../../hooks/redux.ts';
import { UploadCloud, X, Loader, AlertCircle } from 'lucide-react';
import { encryptFile } from '../../utils/encryption.ts';

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    selectedFile: File | null;
}

// Define allowed file types and max file size (50MB)
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {
    const { loading, uploadProgress } = useAppSelector(state => state.files);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processFile = async (file: File) => {
        try {
            setError(null);

            // Validate file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError('Invalid file type. Allowed types: PDF, JPEG, PNG, TXT');
                onFileSelect(null);
                return;
            }

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                setError('File size too large. Maximum size: 50MB');
                onFileSelect(null);
                return;
            }

            // Client-side encryption
            const { encryptedFile, key } = await encryptFile(file);

            // Store the encryption key with the file object
            const fileWithKey = new File([encryptedFile], file.name, { type: file.type });
            (fileWithKey as any).clientKey = key;

            onFileSelect(fileWithKey);
        } catch (error) {
            console.error('File processing failed:', error);
            setError('Failed to process file. Please try again.');
            onFileSelect(null);
        }
    };

    // Handle files being dropped
    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await processFile(files[0]);
        }
    }, [onFileSelect]);

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    // Handle file selection through input
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0]);
        }
    };

    // Clear selected file
    const handleClear = () => {
        setError(null);
        onFileSelect(null);
    };

    return (
        <div className="w-full px-6">
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
                            Files will be encrypted before upload (Max size: 50MB)
                        </p>
                        <p className="text-xs text-gray-500">
                            Supported formats: PDF, JPEG, PNG, TXT
                        </p>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        onChange={handleChange}
                        className="hidden"
                        id="file-upload"
                        disabled={loading}
                        accept={ALLOWED_TYPES.join(',')}
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

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 rounded-md">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                            <span className="text-sm text-red-800">{error}</span>
                        </div>
                    </div>
                )}

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