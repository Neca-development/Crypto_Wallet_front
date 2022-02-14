import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import walletSlice from './walletSlice';

export const store = configureStore({
  reducer: {
    wallets: walletSlice,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
