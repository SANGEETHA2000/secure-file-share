// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios.ts';

// Define role type for better type safety
type UserRole = 'ADMIN' | 'USER' | 'GUEST';

interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    mfa_enabled: boolean;
    first_name: string;
    last_name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    requiresMFA: boolean;
    tempUserId: string | null;
    loading: boolean;
    error: string | null;
    mfa_enabled: boolean;
}

interface LoginSuccessResponse {
    token: string;
    user: User;
    requiresMFA: false;
}

interface LoginMFARequiredResponse {
    requiresMFA: true;
    userId: string;
}

interface RegisterData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role?: UserRole;
}

const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    requiresMFA: false,
    tempUserId: null,
    loading: false,
    error: null,
    mfa_enabled: false
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { username: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login/', credentials);
            
            if (response.data.require_mfa) {
                return {
                    requiresMFA: true,
                    userId: response.data.user_id
                } as LoginMFARequiredResponse;
            }

            localStorage.setItem('token', response.data.access);
            try {
                const userResponse = await api.get('/users/me/');
                const userData = userResponse.data;
                localStorage.setItem('user', JSON.stringify(userData));
                return {
                    token: response.data.access,
                    user: userData,
                    requiresMFA: false
                } as LoginSuccessResponse;
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                throw error;
            }
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || 
                'Invalid credentials. Please try again.'
            );
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData: RegisterData, { rejectWithValue }) => {
        try {
            // If role is not provided, default to 'USER'
            const dataWithRole = {
                ...userData,
                role: userData.role || 'USER'
            };
            
            const response = await api.post('/users/', dataWithRole);
            return response.data;
        } catch (error: any) {
            // Handle specific error cases
            if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.username) {
                    return rejectWithValue('Username is already taken');
                }
                if (errorData.email) {
                    return rejectWithValue('Email is already in use');
                }
                if (errorData.password) {
                    return rejectWithValue(errorData.password[0]);
                }
            }
            return rejectWithValue('Registration failed. Please try again.');
        }
    }
);

export const verifyMFA = createAsyncThunk(
    'auth/verifyMFA',
    async ({ userId, token }: { userId: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/verify-mfa/', {
                user_id: userId,
                token
            });
            
            localStorage.setItem('token', response.data.access);

            // Fetch user data after successful MFA verification
            const userResponse = await api.get('/users/me/');
            const userData = userResponse.data;
            localStorage.setItem('user', JSON.stringify(userData));

            return {
                token: response.data.access,
                user: userData
            };
        } catch (error: any) {
            return rejectWithValue('Invalid MFA code. Please try again.');
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {            
            const response = await api.get('/users/me/');
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
        } catch (error: any) {
            return rejectWithValue('Failed to fetch profile');
        }
    }
);

export const enableMFA = createAsyncThunk(
    'auth/enableMFA',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/enable_mfa/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue('Failed to enable MFA');
        }
    }
);

export const verifyMFASetup = createAsyncThunk(
    'auth/verifyMFASetup',
    async ({ token }: { token: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/verify_mfa_setup/', { token });
            return response.data;
        } catch (error: any) {
            return rejectWithValue('Invalid verification code');
        }
    }
);

export const disableMFA = createAsyncThunk(
    'auth/disableMFA',
    async (password: string, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/disable_mfa/', { password });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to disable MFA');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return {
                ...initialState,
                user: null,
                token: null,
                isAuthenticated: false
            };
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login cases
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                if ('requiresMFA' in action.payload && action.payload.requiresMFA) {
                    state.requiresMFA = true;
                    state.tempUserId = action.payload.userId;
                } else {
                    state.token = action.payload.token;
                    state.user = action.payload.user;
                    state.isAuthenticated = true;
                    state.requiresMFA = false;
                    state.mfa_enabled = action.payload.user.mfa_enabled;
                }
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // MFA verification cases
            .addCase(verifyMFA.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyMFA.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.requiresMFA = false;
                state.tempUserId = null;
                state.mfa_enabled = action.payload.user.mfa_enabled;
            })
            .addCase(verifyMFA.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Register cases
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Profile fetch cases
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.user = action.payload;
                state.mfa_enabled = action.payload.mfa_enabled;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // MFA enable/setup cases
            .addCase(enableMFA.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(enableMFA.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(enableMFA.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(verifyMFASetup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyMFASetup.fulfilled, (state) => {
                state.loading = false;
                state.mfa_enabled = true;
            })
            .addCase(verifyMFASetup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // MFA disable cases
            .addCase(disableMFA.fulfilled, (state) => {
                state.user = {
                    ...state.user!,
                    mfa_enabled: false
                };
            });
    }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;