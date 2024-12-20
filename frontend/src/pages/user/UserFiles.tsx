import React, { useEffect, useState } from 'react';
import UserFileList from '../../components/files/UserFileList.tsx';
import FileUpload from '../../components/files/FileUpload.tsx';
import { useAppDispatch, useAppSelector } from '../../hooks/redux.ts';
import { fetchFiles, uploadFile } from '../../store/slices/fileSlice.ts';
import { Loader, Upload } from 'lucide-react';

const UserFiles: React.FC = () => {
    const dispatch = useAppDispatch();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { loading } = useAppSelector(state => state.files);

    useEffect(() => {
        dispatch(fetchFiles());
    }, [dispatch]);

    const handleFileUpload = async () => {
        if (selectedFile) {
            try {
                await dispatch(uploadFile(selectedFile)).unwrap();
                setSelectedFile(null);
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
    };

    return (
        <>
            {/* Upload Section */}
            <div className="flex justify-between p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Upload Files</h2>
                        <p className="mt-1 text-sm text-gray-500">Store your files securely</p>
                    </div>
                </div>
                <button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || loading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent 
                        shadow-sm text-sm font-medium rounded-md text-white 
                        ${!selectedFile || loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {loading ? (
                        <>
                            <Loader className="animate-spin h-5 w-5 mr-2" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="h-5 w-5 mr-2" />
                            Upload File
                        </>
                    )}
                </button>
            </div>

            <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />
            <UserFileList />
        </>
    );
};

export default UserFiles;