import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface AuthState {
    user: any | null;        // Stores user information when logged in
    token: string | null;    // Stores the JWT access token
    isAuthenticated: boolean; // Tracks if user is logged in
    requiresMFA: boolean;    // Tracks if MFA verification is needed
    tempUserId: string | null; // Temporarily stores user ID during MFA process
    loading: boolean;        // Tracks if an auth operation is in progress
    error: string | null;    // Stores any error messages
}

// Set up the initial state
const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'), // Check if we have a saved token
    isAuthenticated: false,
    requiresMFA: false,
    tempUserId: null,
    loading: false,
    error: null
};

// Create an async action for logging in
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { username: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post('/api/v1/auth/login/', credentials);
            
            // Handle MFA requirement
            if (response.data.require_mfa) {
                return {
                    requiresMFA: true,
                    userId: response.data.user_id
                };
            }

            // If no MFA needed, store the token and return success
            localStorage.setItem('token', response.data.access);
            return {
                token: response.data.access,
                requiresMFA: false
            };
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
            const response = await axios.post('/api/v1/auth/verify-mfa/', {
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
    async (_, { getState, rejectWithValue }) => {
        try {
            // Get the current state to access the token
            const { auth } = getState() as { auth: AuthState };
            
            const response = await axios.get('/api/v1/users/me/', {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });
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
            const response = await axios.post('/api/v1/users/', userData);
            
            // After successful registration, we can either:
            // 1. Automatically log the user in
            // 2. Or redirect them to the login page
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || 
                'Registration failed. Please try again.'
            );
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
            state.requiresMFA = false;
            state.tempUserId = null;
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
                    state.isAuthenticated = true;
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
            });
    }
});

// Export our actions and reducer
export const { logout } = authSlice.actions;
export default authSlice.reducer;