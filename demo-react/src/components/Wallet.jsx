import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { Avatar, Card, List, ListItem } from '@mui/material';
import Button from '@mui/material/Button';
import TimeDate from './Time';
import { useForm } from 'react-hook-form';
import { Typography, Box } from '@mui/material';
import { color } from '@mui/system';
import TextField from '@mui/material/TextField';
import ModalAccept from './Modal';
import './wallet.scss';

const Wallet = () => {
  let { address } = useParams();
  const dispatch = useAppDispatch();
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [localTransactionHistory, setLocalTransactionHistory] = useState([]);
  const [tokensByAddress, setTokensByAddress] = useState([]);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [isTrxSuccess, setIsTrxSuccess] = useState(false);

  const [sendTokenForm, setSendTokenForm] = useState({
    tokenName: 'Tether USDT',
    receiver: '0xD6C79898A82868E79a1304CceA14521fAe1797Bd',
    amount: 0.01,
  });

  const [sendTrxForm, setSendTrxForm] = useState({
    receiver: '',
    amount: 0.0001,
  });

  const getWalletbyAddress = () => {
    const publicKey = address?.split('&')[0];
    const chainId = address?.split('&')[1];
    const findedWallet = wallets.find((x) => x.address === publicKey && x.chainId === chainId);
    setCurrentWallet(findedWallet);
  };

  const getWalletData = async () => {
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
      }
    } catch (error) {
      console.log(error);
    }
  };

  const clearWallet = () => {
    setTokensByAddress([]);
    setLocalTransactionHistory([]);
  };

  const clearSendTexForm = () => {
    setSendTrxForm({
      receiver: '',
      amount: '',
    });
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
      console.log(currentWallet.privateKey);
      console.log(sendTrxForm.amount);
      console.log(sendTrxForm.receiver);
      const req = await currentWallet.sendMainToken({
        privateKey: currentWallet.privateKey,
        receiverAddress: sendTrxForm.receiver,
        amount: sendTrxForm.amount,
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

  const sendToken = async () => {
    console.log(tokensByAddress);
    const token = tokensByAddress.find((x) => x.tokenName === sendTokenForm.tokenName);
    console.log(token);
    const receiverAddress = sendTokenForm.receiver;
    const cotractAddress = token.contractAddress;
    const amount = sendTokenForm.amount;
    const privateKey = currentWallet.privateKey;
    console.log({ receiverAddress, cotractAddress, amount, privateKey });

    try {
      const req = await currentWallet.send20Token({
        receiverAddress,
        cotractAddress,
        amount,
        privateKey,
      });

      alert(`Transaction ${req} was successfully sended`);
      // this.clearSendTokenForm();
    } catch (error) {
      console.log(error);
      alert(error);
    }
  };

  useEffect(() => {
    getWalletData();
  }, [currentWallet]);

  useEffect(() => {
    getWalletbyAddress();

    console.log(currentWallet);
  }, [getWalletbyAddress]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = (data) => {
    console.log(data);
    data.amount = Number(data.amount);
    handleOpen();
    setSendTrxForm({ amount: data.amount, receiver: data.receiver });

    // dispatch(addArticle({ header: data.header, content: data.content }));
    // dispatch(closeModal());
  };
  console.log(sendTrxForm);

  return (
    <>
      <ModalAccept clearSendTexForm={clearSendTexForm} sendTrx={sendTrx} open={open} handleClose={handleClose} />
      {/* <div>
        <Button variant="contained" onClick={() => sendToken()} sx={{ m: 3 }}>
          sendToken
        </Button>

        <Button variant="contained" onClick={() => clearWallet()}>
          clear
        </Button>
      </div> */}

      <div className="balance">
        <Typography variant="h3">Wallet balance</Typography>
        {tokensByAddress.length === 0 && <div>...Loading</div>}
        {tokensByAddress.map((storyPoint, index = 0) => (
          <div className="balance__content" key={`${index}_${storyPoint?.txId}`}>
            <figure className="balance__figure">
              <img src={storyPoint?.tokenLogo} alt="token pic" />
              <figcaption>{storyPoint?.tokenName}</figcaption>
            </figure>
            <b>amount {storyPoint?.balance}</b>
            <div>amount in USDT: {storyPoint?.balanceInUSD}$</div>
          </div>
        ))}
      </div>

      <div className="form-contaier">
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="h3">Send Transaction</Typography>
          <div>
            <TextField
              className="form__input"
              defaultValue={sendTrxForm.receiver}
              {...register('receiver', { required: true })}
              id="outlined-required"
              label="receiver"
            />

            <label style={{ color: 'red' }}>{errors.header && <span>Пожалуйста заполните поле</span>}</label>
            <TextField
              className="form__input"
              defaultValue={sendTrxForm.amount}
              {...register('amount', { required: true })}
              id="outlined-required"
              label="amount"
              sx={{ color: '#fff' }}
            />
            <div style={{ color: 'red' }}>{errors.content && <span>Пожалуйста заполните поле</span>}</div>

            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" type="submit">
                Send
              </Button>
            </Box>
          </div>
        </form>
      </div>

      <List>
        <Typography variant="h3">Transaction history</Typography>
        {localTransactionHistory.length === 0 && <div>...Loading</div>}
        {localTransactionHistory.map((storyPoint, index = 0) => {
          return index < 10 ? (
            <div key={`${index}_${storyPoint?.txId}`}>
              <hr />
              <figure className="history__picture-box">
                <img className="history__picture" src={storyPoint?.tokenLogo} />
              </figure>
              <h2>{storyPoint?.tokenName}</h2>
              <p>amount: {storyPoint?.amount}</p>
              <div>amount in USDT: {storyPoint?.amountInUSD}$</div>
              <p>{storyPoint?.txId}</p>
              <p>time: {storyPoint?.timestamp}</p>
              <p>From: {storyPoint?.from}</p>
              <p>To: {storyPoint?.to}</p>
            </div>
          ) : (
            ''
          );
        })}
      </List>
    </>
  );
};

export default Wallet;
