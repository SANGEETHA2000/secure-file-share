import { useAppSelector } from './redux.ts';

export const usePermissions = () => {
    const { user } = useAppSelector(state => state.auth);

    return {
        isAdmin: user?.role === 'ADMIN',
        canManageUsers: user?.role === 'ADMIN',
        canShareFiles: user?.role !== 'GUEST',
        canDownloadFiles: user?.role !== 'GUEST',
        canDeleteFiles: user?.role === 'ADMIN' || user?.role === 'USER',
    };
};