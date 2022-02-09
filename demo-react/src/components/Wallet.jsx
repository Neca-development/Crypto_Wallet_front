import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { Avatar, Card, List, ListItem } from '@mui/material';

const Wallet = () => {
  let { address } = useParams();
  const dispatch = useAppDispatch();
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [localTransactionHistory, setLocalTransactionHistory] = useState([]);
  const [tokensByAddress, setTokensByAddress] = useState([]);

  const getWalletbyAddress = () => {
    const publicKey = address?.split('&')[0];
    const chainId = address?.split('&')[1];
    const findedWallet = wallets.find((x) => x.address === publicKey && x.chainId === chainId);
    setCurrentWallet(findedWallet);
  };

  const getStory = async () => {
    try {
      console.log('getstory');
      if (currentWallet) {
        //@ts-ignore
        const transactionsHistory = await currentWallet.getTransactionsHistoryByAddress();
        console.log(transactionsHistory);
        setLocalTransactionHistory(transactionsHistory);
        //@ts-ignore
        const tokensBalance = await currentWallet.getTokensByAddress();
        console.log(tokensBalance);
        setTokensByAddress(tokensBalance);
        // @ts-ignore
        // const a = await currentWallet.sendMainToken({ amount: 0.001 });
        // console.log(a);
      }
    } catch {}
  };

  useEffect(() => {
    getStory();
  }, [currentWallet]);

  useEffect(() => {
    getWalletbyAddress();

    console.log(currentWallet);
  }, [getWalletbyAddress]);

  return (
    <>
      {tokensByAddress === null || tokensByAddress === undefined ? (
        <div>...Loading</div>
      ) : (
        <div>
          <h1>tokensByAddress</h1>
          {tokensByAddress.map((storyPoint, index = 0) => (
            <Card key={`${index}_${storyPoint?.txId}`}>
              <h2>
                <Avatar src={storyPoint?.tokenLogo} /> {storyPoint?.tokenName}:
              </h2>
              <b>{storyPoint?.balance}</b>
            </Card>
          ))}
        </div>
      )}

      <List>
        <h1>STORY</h1>
        {localTransactionHistory.map((storyPoint, index = 0) => (
          <div key={`${index}_${storyPoint?.txId}`}>
            <hr />
            <Avatar src={storyPoint?.tokenLogo} />
            <h2>{storyPoint?.tokenName}</h2>
            <p>amount: {storyPoint?.amount}</p>
            <p>{storyPoint?.txId}</p>
            <b>{storyPoint?.timestamp}</b>
            <p>From: {storyPoint?.from}</p>
            <p>To: {storyPoint?.to}</p>
          </div>
        ))}
      </List>
    </>
  );
};

export default Wallet;
