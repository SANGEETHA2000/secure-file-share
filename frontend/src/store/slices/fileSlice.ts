import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios.ts';

// Think of a File interface as a blueprint for what information we store about each file
interface File {
    id: string;
    name: string;
    original_name: string;
    size: number;
    uploaded_at: string;
    owner: {
        id: string;
        username: string;
    };
}

// The FileState interface defines what our file management system keeps track of
interface FileState {
    files: File[];
    adminFiles: File[];
    sharedFiles: File[];
    loading: boolean;
    error: string | null;
    uploadProgress: number | null;
    shareLinks: ShareLink[];
    sharingLoading: boolean;
    sharingError: string | null;
    statistics: {
        totalFiles: number;
        totalSize: number;
        activeShares: number;
    } | null;
}

interface ShareLink {
    id: string;
    accessToken: string;
    expiresAt: string;
    permission: 'VIEW' | 'DOWNLOAD';
    sharedWith?: {
        id: string;
        email: string;
    };
}

interface ShareLinkParams {
    fileId: string;
    email: string;
    expires_in_minutes: number;
    permission: 'VIEW' | 'DOWNLOAD';
}

interface ShareAccessParams {
    token: string;
    email: string;
}

interface ShareAccessResponse {
    fileId: string;
    temporaryPassword?: string;
    permission: 'VIEW' | 'DOWNLOAD';
}

interface DownloadResponse {
    data: Blob;
    clientKey?: string;
    filename: string;
    contentType: string;
}

const initialState: FileState = {
    files: [],
    adminFiles: [],
    sharedFiles: [],
    loading: false,
    error: null,
    uploadProgress: null,
    shareLinks: [],
    sharingLoading: false,
    sharingError: null,
    statistics: null
};

// This action handles file uploads with encryption
export const uploadFile = createAsyncThunk(
    'files/upload',
    async (file: globalThis.File, { rejectWithValue, dispatch }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('original_name', file.name);
            formData.append('mime_type', file.type);
            // Add client-side encryption key
            const clientKey = (file as any).clientKey;
            if (clientKey) {
                formData.append('client_key', clientKey);
            }

            const response = await api.post('/files/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 100)
                    );
                    dispatch(setUploadProgress(progress));
                }
            });

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Upload failed');
        }
    }
);

// Fetch the list of files of the user
export const fetchFiles = createAsyncThunk(
    'files/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/files/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch files');
        }
    }
);

// Delete a file
export const deleteFile = createAsyncThunk(
    'files/delete',
    async (fileId: string, { rejectWithValue }) => {
        try {
            await api.delete(`/files/${fileId}/`);
            return fileId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to delete file');
        }
    }
);

// Add this new action to handle file downloads
export const downloadFile = createAsyncThunk<DownloadResponse, string>(
    'files/download',
    async (fileId: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/files/${fileId}/download/`, {
                responseType: 'blob',
                headers: {
                    'Accept': '*/*'
                },
                onDownloadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 100)
                    );
                    console.log('Download progress:', progress);
                }
            });
            // Check if response is ok
            if (!response.data) {
                throw new Error('No data received');
            }

            return {
                data: response.data,
                clientKey: response.headers?.['x-client-key'],
                filename: response.headers?.['content-disposition']?.match(/filename="(.+?)"/)?.[1] || 'downloaded-file',
                contentType: response.headers?.['content-type'] || 'application/octet-stream'
            };
        } catch (error: any) {
            console.error('Download error:', error);
            if (error.response?.status === 204) {
                return rejectWithValue('File not found or no content');
            }
            return rejectWithValue(
                error.response?.data?.detail || 
                error.message || 
                'Download failed'
            );
        }
    }
);

// Add a new action to create share links
export const createShareLink = createAsyncThunk<ShareLink, ShareLinkParams>(
    'files/createShare',
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.post('/shares/', {
                file: params.fileId,
                shared_with_email: params.email,
                expires_in_minutes: params.expires_in_minutes,
                permission: params.permission
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to create share link');
        }
    }
);

// Verify share access
export const verifyShareAccess = createAsyncThunk<ShareAccessResponse, ShareAccessParams>(
    'files/verifyAccess',
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.post('/shares/verify-access/', {
                token: params.token,
                email: params.email
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Invalid or expired share link');
        }
    }
);

// Add a new action to fetch existing shares for a file
export const fetchFileShares = createAsyncThunk(
    'files/fetchShares',
    async (fileId: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/files/${fileId}/shares/`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch shares');
        }
    }
);

// Add a new action to remove a share
export const removeShare = createAsyncThunk(
    'files/removeShare',
    async (shareId: string, { rejectWithValue }) => {
        try {
            await api.delete(`/shares/${shareId}/`);
            return shareId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to remove share');
        }
    }
);

// Add new async thunk for fetching shared files
export const fetchSharedFiles = createAsyncThunk(
    'files/fetchShared',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/files/shared/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch shared files');
        }
    }
);

export const fetchAdminFiles = createAsyncThunk(
    'files/fetchAdminFiles',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/files/all_files/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch files');
        }
    }
);

export const fetchFileStatistics = createAsyncThunk(
    'files/fetchStatistics',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/files/statistics/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch statistics');
        }
    }
);

const fileSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        // Update upload progress
        setUploadProgress: (state, action) => {
            state.uploadProgress = action.payload;
        },
        // Reset progress after upload
        resetUploadProgress: (state) => {
            state.uploadProgress = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle upload states
            .addCase(uploadFile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadFile.fulfilled, (state, action) => {
                state.loading = false;
                state.files.unshift(action.payload);
                state.uploadProgress = null;
            })
            .addCase(uploadFile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.uploadProgress = null;
            })
            
            // Handle fetch states
            .addCase(fetchFiles.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFiles.fulfilled, (state, action) => {
                state.loading = false;
                state.files = action.payload;
            })
            .addCase(fetchFiles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Handle delete states
            .addCase(deleteFile.fulfilled, (state, action) => {
                state.files = state.files.filter(file => file.id !== action.payload);
            })

            // Create share link cases
            .addCase(createShareLink.pending, (state) => {
                state.sharingLoading = true;
                state.sharingError = null;
            })
            .addCase(createShareLink.fulfilled, (state, action) => {
                state.sharingLoading = false;
                state.shareLinks.push(action.payload);
            })
            .addCase(createShareLink.rejected, (state, action) => {
                state.sharingLoading = false;
                state.sharingError = action.payload as string;
            })
    
            // Handle share fetching
            .addCase(fetchFileShares.fulfilled, (state, action) => {
                state.shareLinks = action.payload;
            })
    
            // Handle share removal
            .addCase(removeShare.fulfilled, (state, action) => {
                state.shareLinks = state.shareLinks.filter(
                    share => share.id !== action.payload
                );
            })

            // Handle shared files fetching
            .addCase(fetchSharedFiles.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSharedFiles.fulfilled, (state, action) => {
                state.loading = false;
                state.sharedFiles = action.payload;
            })
            .addCase(fetchSharedFiles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle admin files fetching
            .addCase(fetchAdminFiles.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminFiles.fulfilled, (state, action) => {
                state.loading = false;
                state.adminFiles = action.payload;
            })
            .addCase(fetchAdminFiles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchFileStatistics.fulfilled, (state, action) => {
                state.statistics = {
                    totalFiles: action.payload.total_files,
                    totalSize: action.payload.total_size,
                    activeShares: action.payload.active_shares
                };
            })
            
            // Verify share access cases
            .addCase(verifyShareAccess.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyShareAccess.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(verifyShareAccess.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setUploadProgress, resetUploadProgress } = fileSlice.actions;
export default fileSlice.reducer;