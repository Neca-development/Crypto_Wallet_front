import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';

const Wallet = () => {
  let { address } = useParams();
  const dispatch = useAppDispatch();
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const [currentWallet, setCurrentWallet] = useState(null);

  const getWalletbyAddress = () => {
    const publicKey = address?.split('&')[0];
    const chainId = address?.split('&')[1];
    const findedWallet = wallets.find((x: any) => x.address === publicKey && x.chainId === chainId);
    setCurrentWallet(findedWallet);
  };

  useEffect(() => {
    getWalletbyAddress();
    console.log(currentWallet);
  }, [getWalletbyAddress]);

  return <div></div>;
};

export default Wallet;
