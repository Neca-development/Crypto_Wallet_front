import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { WalletFactory } from '../../bundle/cw-lib.bundle.js';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Wallet from './components/Wallet';
import { setWallets } from './store/walletSlice';

function App() {
  const dispatch = useDispatch();
  const [localWallets, setLocalWallets] = useState([]);
  const [localTokens, setLocalTokens] = useState({});

  const loadWallets = async () => {
    const wf = new WalletFactory();
    //@ts-ignore
    const data = await wf.createWallets('light afraid crawl solve chicken receive sound prize figure turn punch angry');
    // const data1 = await wf.createWalletByPrivateKey(
    //   '86E4A2D8C28F5F448175500EA545E58372F26FEBB71F82EA268BA7FB382C7462',
    //   'Tron'
    // );
    // const data2 = await wf.createWalletByPrivateKey(
    //   'aafdd04dd28d1fed7ca6a2ea5ede0453d94a21336a5bee8998ac1255e6e60941',
    //   'Tron'
    // );
    const allTokens = await wf.getAllTokens();
    console.log(allTokens);
    setLocalTokens(allTokens);
    console.log({ data });
    //@ts-ignore
    setLocalWallets(data.wallets);
    //@ts-ignore
    dispatch(setWallets(data.wallets));
    // console.log(wallets);
  };
  // const loadCurrenWallet

  useEffect(() => {
    loadWallets();
  }, []);
  // console.log(localTransactionHistory);
  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar tokens={localTokens} wallets={localWallets} />
        <Routes>
          <Route path="/:address" element={<Wallet />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
