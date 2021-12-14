import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { WalletFactory } from '../../lib/main';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Wallet from './components/Wallet';
import { setWallets } from './store/walletSlice';

function App() {
  const dispatch = useDispatch();
  const [localWallets, setLocalWallets] = useState([]);

  const loadWallets = async () => {
    const wf = new WalletFactory();
    //@ts-ignore
    const data = await wf.createWallets('light afraid crawl solve chicken receive sound prize figure turn punch angry');
    const data1 = await wf.createWalletByPrivateKey(
      '86E4A2D8C28F5F448175500EA545E58372F26FEBB71F82EA268BA7FB382C7462',
      'Tron'
    );
    const data2 = await wf.createWalletByPrivateKey(
      'aafdd04dd28d1fed7ca6a2ea5ede0453d94a21336a5bee8998ac1255e6e60941',
      'Tron'
    );
    console.log({ data, data1, data2 });
    //@ts-ignore
    setLocalWallets(data.wallets);
    //@ts-ignore
    dispatch(setWallets(data.wallets));
    // console.log(wallets);
  };

  useEffect(() => {
    loadWallets();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar wallets={localWallets} />
        <Routes>
          <Route path="/:address" element={<Wallet />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
