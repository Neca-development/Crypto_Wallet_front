import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: any = {
  wallets: [],
  walletHistory: [],
};

export const walletSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    setWallets: (state, action) => {
      state.wallets = action.payload;
    },
    setWalletHistory: (state, action) => {
      state.walletHistory = action.payload;
    },
  },
});

export const { setWallets, setWalletHistory } = walletSlice.actions;

export default walletSlice.reducer;
