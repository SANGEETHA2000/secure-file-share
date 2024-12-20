import React, { useEffect } from 'react';
import SharedFileList from '../../components/files/SharedFileList.tsx';
import { useAppDispatch } from '../../hooks/redux.ts';
import { fetchSharedFiles } from '../../store/slices/fileSlice.ts';
import { AlertTriangle } from 'lucide-react';

const GuestShared: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchSharedFiles());
    }, [dispatch]);

    return (
        <>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            Guest access: You can only view and download shared files.
                        </p>
                    </div>
                </div>               
            </div>
            <SharedFileList />
        </>
    );
};

export default GuestShared;