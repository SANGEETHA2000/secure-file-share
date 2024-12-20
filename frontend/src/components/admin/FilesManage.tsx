import React from 'react';
import { useAppSelector } from '../../hooks/redux.ts';
import { Loader } from 'lucide-react';
import AdminFileList from '../files/AdminFileList.tsx';

const FilesManage: React.FC = () => {
    return <AdminFileList />;
};

export default FilesManage;