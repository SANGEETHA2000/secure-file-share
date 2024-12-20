import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.ts';
import fileReducer from './slices/fileSlice.ts';
import adminReducer from './slices/adminSlice.ts';

const store = configureStore({
    reducer: {
        auth: authReducer,
        files: fileReducer,
        admin: adminReducer 
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['auth/login/fulfilled'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;