import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios.ts';

interface UserDetails {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'USER' | 'GUEST';
    mfa_enabled: boolean;
    created_at: string;
    last_login: string;
    storage_used: number;
}

interface AdminState {
    users: UserDetails[];
    loading: boolean;
    error: string | null;
    selectedUser: UserDetails | null;
}

const initialState: AdminState = {
    users: [],
    loading: false,
    error: null,
    selectedUser: null
};

export const fetchAllUsers = createAsyncThunk(
    'admin/fetchAllUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/admin/users/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch users');
        }
    }
);

export const updateUserRole = createAsyncThunk(
    'admin/updateUserRole',
    async ({ userId, role }: { userId: string; role: string }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/admin/users/${userId}/`, { role });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to update user role');
        }
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        setSelectedUser: (state, action) => {
            state.selectedUser = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateUserRole.fulfilled, (state, action) => {
                const updatedUser = action.payload;
                state.users = state.users.map(user => 
                    user.id === updatedUser.id ? updatedUser : user
                );
                if (state.selectedUser?.id === updatedUser.id) {
                    state.selectedUser = updatedUser;
                }
            });
    }
});

export const { setSelectedUser } = adminSlice.actions;
export default adminSlice.reducer;