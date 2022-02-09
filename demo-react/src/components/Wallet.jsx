import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { Avatar, Card, List, ListItem } from '@mui/material';
import Button from '@mui/material/Button';
import TimeDate from './Time';

const Wallet = () => {
  let { address } = useParams();
  const dispatch = useAppDispatch();
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [localTransactionHistory, setLocalTransactionHistory] = useState([]);
  const [tokensByAddress, setTokensByAddress] = useState([]);

  const [isTrxSuccess, setIsTrxSuccess] = useState(false);

  const [sendTokenForm, setSendTokenForm] = useState({
    tokenName: '',
    receiver: '',
    amount: '',
  });

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

  const clearWallet = () => {
    setTokensByAddress([]);
    setLocalTransactionHistory([]);
  };

  const clearSendTokenForm = () => {
    setSendTokenForm({
      tokenName: '',
      receiver: '',
      amount: '',
    });
  };

  const sendTrx = async () => {
    try {
      const req = await currentWallet.sendMainToken({
        privateKey: currentWallet.privateKey,
        receiverAddress: '0xD6C79898A82868E79a1304CceA14521fAe1797Bd',
        amount: 0.01,
      });
      setIsTrxSuccess(true);
      setTimeout(() => {
        setIsTrxSuccess(false);
      }, 1000);

      alert(`Transaction ${req} was successfully sended`);
      // this.clearSendTrxForm();
    } catch (error) {
      alert(error);
    }
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
      <Button variant="contained" onClick={() => sendTrx()} sx={{ m: 3 }}>
        sendTrx
      </Button>
      <Button variant="contained" onClick={() => clearWallet()}>
        clear
      </Button>
      <div>
        <h1>tokensByAddress</h1>
        {tokensByAddress.length === 0 && <div>...Loading</div>}
        {tokensByAddress.map((storyPoint, index = 0) => (
          <Card sx={{ p: 2, mt: 2 }} key={`${index}_${storyPoint?.txId}`}>
            <h2>
              <Avatar src={storyPoint?.tokenLogo} /> {storyPoint?.tokenName}:
            </h2>
            <b>amount {storyPoint?.balance}</b>
            <div>amount in USDT: {storyPoint?.balanceInUSD}$</div>
          </Card>
        ))}
      </div>

      <List>
        <h1>STORY</h1>
        {localTransactionHistory.length === 0 && <div>...Loading</div>}
        {localTransactionHistory.map((storyPoint, index = 0) => (
          <div key={`${index}_${storyPoint?.txId}`}>
            <hr />
            <Avatar src={storyPoint?.tokenLogo} />
            <h2>{storyPoint?.tokenName}</h2>
            <p>amount: {storyPoint?.amount}</p>
            <div>amount in USDT: {storyPoint?.amountInUSD}$</div>
            <p>{storyPoint?.txId}</p>
            <b>time: {storyPoint?.timestamp}</b>
            <p>From: {storyPoint?.from}</p>
            <p>To: {storyPoint?.to}</p>
          </div>
        ))}
      </List>
    </>
  );
};

export default Wallet;
