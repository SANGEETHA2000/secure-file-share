import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios.ts';

interface AuthState {
    user: any | null;        // Stores user information when logged in
    token: string | null;    // Stores the JWT access token
    isAuthenticated: boolean; // Tracks if user is logged in
    requiresMFA: boolean;    // Tracks if MFA verification is needed
    tempUserId: string | null; // Temporarily stores user ID during MFA process
    loading: boolean;        // Tracks if an auth operation is in progress
    error: string | null;    // Stores any error messages
    mfa_enabled: boolean;    // Tracks if MFA is enabled
}

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    mfa_enabled: boolean;
    first_name: string;
    last_name: string;
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

// Set up the initial state
const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'), // Check if we have a saved token
    isAuthenticated: !!localStorage.getItem('token'),
    requiresMFA: false,
    tempUserId: null,
    loading: false,
    error: null,
    mfa_enabled: false
};

// Create an async action for logging in
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { username: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login/', credentials);
            // Handle MFA requirement
            if (response.data.require_mfa) {
                return {
                    requiresMFA: true,
                    userId: response.data.user_id
                } as LoginMFARequiredResponse;
            }

            // If no MFA needed, store the token and return success
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
            return rejectWithValue(error.response?.data?.detail || 'Login failed');
        }
    }
);

// Create an async action for MFA verification
export const verifyMFA = createAsyncThunk(
    'auth/verifyMFA',
    async ({ userId, token }: { userId: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/verify-mfa/', {
                user_id: userId,
                token
            });
            
            localStorage.setItem('token', response.data.access);
            return {
                token: response.data.access
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'MFA verification failed');
        }
    }
);

// Create an async action to fetch the user's profile
// This runs after successful authentication to get user details
export const fetchUserProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {            
            const response = await api.get('/users/me/');
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch profile');
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData: {
        username: string;
        email: string;
        password: string;
        password_confirm: string;
        first_name: string;
        last_name: string;
    }, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/', userData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || 
                'Registration failed. Please try again.'
            );
        }
    }
);

export const enableMFA = createAsyncThunk(
    'auth/enableMFA',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/enable_mfa/');
            console.log(response)
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to enable MFA');
        }
    }
);

// For verifying during MFA setup
export const verifyMFASetup = createAsyncThunk(
    'auth/verifyMFASetup',
    async ({ token }: { token: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/verify_mfa_setup/', { token });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'MFA setup verification failed');
        }
    }
);

// Create the auth slice - this defines how our state can be modified
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Add a logout action to clear everything
        logout: (state) => {
            localStorage.removeItem('token');
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.tempUserId = null;
            localStorage.removeItem('user');
        },
        // Add other synchronous actions here if needed
    },
    extraReducers: (builder) => {
        builder
            // Handle login states
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.requiresMFA) {
                    state.requiresMFA = true;
                    state.tempUserId = action.payload.userId;
                } else {
                    state.token = action.payload.token;
                    state.user = action.payload.user;
                    state.isAuthenticated = true;
                    localStorage.setItem('token', action.payload.token);
                    localStorage.setItem('user', JSON.stringify(action.payload.user));
                }
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle MFA verification states
            .addCase(verifyMFA.fulfilled, (state, action) => {
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.requiresMFA = false;
                state.tempUserId = null;
            })

            // Handle profile fetch states
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            })

            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
                // We don't set isAuthenticated here since we'll require them to login
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            .addCase(enableMFA.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(enableMFA.fulfilled, (state, action) => {
                state.loading = false;
                // We don't set mfa_enabled yet because it needs verification
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
            });
    }
});

// Export our actions and reducer
export const { logout } = authSlice.actions;
export default authSlice.reducer;