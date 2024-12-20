import React, { useEffect } from 'react';
import { SharedFileList } from '../../components/files/SharedFileList.tsx';
import { useAppDispatch } from '../../hooks/redux.ts';
import { fetchSharedFiles } from '../../store/slices/fileSlice.ts';

const UserShared: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchSharedFiles());
    }, [dispatch]);

    return <SharedFileList />;
};

export default UserShared;