import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {
  wallets: [] as any
}

export const walletSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    setWallets: (state, action) => {
      state.wallets = action.payload
    },
  }
})

export const { setWallets } = walletSlice.actions

export default walletSlice.reducer