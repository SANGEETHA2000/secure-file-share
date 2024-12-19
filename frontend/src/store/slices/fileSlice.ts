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
    loading: boolean;
    error: string | null;
    uploadProgress: number | null;
    shareLinks: ShareLink[];
    sharingLoading: boolean;
    sharingError: string | null;
}

interface ShareSettings {
    fileId: string;
    expiresIn?: number;  // Duration in hours
    email?: string;      // For user-to-user sharing
    permission: 'VIEW' | 'DOWNLOAD';
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

const initialState: FileState = {
    files: [],
    loading: false,
    error: null,
    uploadProgress: null,
    shareLinks: [],
    sharingLoading: false,
    sharingError: null
};

// This action handles file uploads with encryption
export const uploadFile = createAsyncThunk(
    'files/upload',
    async (file: globalThis.File, { rejectWithValue, dispatch }) => {
        try {
            // Create a FormData object to send the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('original_name', file.name); 

            const response = await api.post('/files/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                // Track upload progress
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

// Fetch the list of files
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
export const downloadFile = createAsyncThunk(
    'files/download',
    async (fileId: string, { rejectWithValue }) => {
        try {
            // We use axios api with responseType blob to handle binary data
            const response = await api.get(`/files/${fileId}/download/`, {
                responseType: 'blob',
                // Track download progress if we want to show it
                onDownloadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 100)
                    );
                    console.log(progress);
                    // We could dispatch an action here to update progress in the UI
                }
            });

            // Create a URL for the downloaded blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // Get the filename from the response headers if available
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'downloaded-file';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            link.remove();
            window.URL.revokeObjectURL(url);

            return fileId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Download failed');
        }
    }
);

// Add a new action to create share links
export const createShareLink = createAsyncThunk(
    'files/createShare',
    async (settings: ShareSettings, { rejectWithValue }) => {
        try {
            const response = await api.post('/shares/', settings);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to create share link');
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

            .addCase(createShareLink.pending, (state) => {
                state.sharingLoading = true;
                state.sharingError = null;
            })
            .addCase(createShareLink.fulfilled, (state, action) => {
                state.sharingLoading = false;
                state.shareLinks = [...state.shareLinks, action.payload];
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
            });
    }
});

export const { setUploadProgress, resetUploadProgress } = fileSlice.actions;
export default fileSlice.reducer;