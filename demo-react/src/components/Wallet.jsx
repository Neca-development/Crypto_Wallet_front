import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { Avatar, Card, List, ListItem, MenuItem, Select } from '@mui/material';
import Button from '@mui/material/Button';
import { useForm } from 'react-hook-form';
import { Typography, Box } from '@mui/material';
import TextField from '@mui/material/TextField';
import ModalAccept from './Modal';
import './wallet.scss';
import { id } from 'ethers/lib/utils';
import TrxForm from './form/Form';

const Wallet = () => {
  let { address } = useParams();
  const dispatch = useAppDispatch();
  const wallets = useAppSelector((state) => state.wallets.wallets);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [localTransactionHistory, setLocalTransactionHistory] = useState([]);
  const [tokensByAddress, setTokensByAddress] = useState({});
  const [open, setOpen] = React.useState(false);
  const [openToken, setOpenToken] = React.useState(false);
  const handleOpenToken = () => setOpenToken(true);
  const handleCloseToken = () => setOpenToken(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [isTrxSuccess, setIsTrxSuccess] = useState(false);

  const [sendTokenForm, setSendTokenForm] = useState({
    tokenName: '',
    receiver: '0xD6C79898A82868E79a1304CceA14521fAe1797Bd',
    amount: 0.0001,
  });

  const [sendTrxForm, setSendTrxForm] = useState({
    receiver: '',
    amount: 0.0001,
  });

  const copyPrivateKey = () => {
    navigator.clipboard.writeText(currentWallet.privateKey).then(
      function () {
        console.log('Async: Copying to clipboard was successful!');
      },
      function (err) {
        console.error('Async: Could not copy text: ', err);
      }
    );
  };

  const getWalletbyAddress = () => {
    const publicKey = address?.split('&')[0];
    const chainId = address?.split('&')[1];
    const findedWallet = wallets.find((x) => x.address === publicKey && x.chainId === chainId);
    // getWalletByAddress
    setCurrentWallet(findedWallet);
  };

  const getWalletData = async () => {
    try {
      console.log('getstory');
      clearWallet();
      if (currentWallet) {
        getTransactionWalletHistory();
        getTokensBywalletAdress();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getTransactionWalletHistory = async () => {
    //@ts-ignore
    const transactionsHistory = await currentWallet.getTransactionsHistoryByAddress();
    console.log(transactionsHistory);
    setLocalTransactionHistory(transactionsHistory);
  };
  const getTokensBywalletAdress = async () => {
    //@ts-ignore
    const tokensBalance = await currentWallet.getTokensByAddress();
    console.log(tokensBalance);
    setTokensByAddress(tokensBalance);
  };

  const clearWallet = () => {
    setTokensByAddress({});
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
    // const token = currentWallet.tokens.find((x) => x.tokenName === this.sendTokenForm.tokenName);

    const token = tokensByAddress.tokens.find((x) => x.tokenName === sendTokenForm.tokenName);
    const receiverAddress = sendTokenForm.receiver;
    const contractAddress = token.contractAddress;
    const amount = sendTokenForm.amount;
    const privateKey = currentWallet.privateKey;
    console.log(token);

    try {
      const req = await currentWallet.send20Token({
        receiverAddress: receiverAddress,
        cotractAddress: contractAddress,
        amount: amount,
        privateKey: privateKey,
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

  console.log(tokensByAddress);

  return (
    <>
      <div className="wallet">
        <ModalAccept clearSendTexForm={clearSendTexForm} sendTrx={sendTrx} open={open} handleClose={handleClose} />
        <ModalAccept clearSendTexForm={clearSendTokenForm} sendTrx={sendToken} open={openToken} handleClose={handleCloseToken} />
        <div className="balance">
          <Typography variant="h3">Wallet balance</Typography>
          <br />
          <Typography variant="h4">{currentWallet?.address}</Typography>
          <button className="button" onClick={copyPrivateKey}>
            Copy private key(WIF)
          </button>
          <div className="balance__content-wrap">
            {tokensByAddress &&
              tokensByAddress?.tokens?.map((storyPoint, index = 0) => (
                <div className="balance__content" key={`${index}_${storyPoint?.txId}`}>
                  <figure className="balance__figure">
                    <img src={storyPoint?.tokenLogo} />
                    <figcaption>
                      {storyPoint?.tokenName} <b className="balance__content-amount">{storyPoint?.balance}</b>
                    </figcaption>
                  </figure>

                  <div className="balance__content-amountUSD">in USDT: {storyPoint?.balanceInUSD}$</div>
                </div>
              ))}
          </div>
        </div>
        {tokensByAddress.tokens && (
          <TrxForm
            tokensByAddress={tokensByAddress}
            sendTokenForm={sendTokenForm}
            sendTrxForm={sendTrxForm}
            handleOpen={handleOpen}
            setSendTrxForm={setSendTrxForm}
            setSendTokenForm={setSendTokenForm}
          />
        )}
        {tokensByAddress.tokens && (
          <TrxForm
            tokensByAddress={tokensByAddress}
            sendTokenForm={sendTokenForm}
            sendTrxForm={sendTokenForm}
            handleOpen={handleOpenToken}
            setSendTrxForm={setSendTrxForm}
            setSendTokenForm={setSendTokenForm}
            isSetTokens={true}
          />
        )}

        <div>
          <Typography variant="h3">Transaction history</Typography>
          {localTransactionHistory.length === 0 && <div>...Loading</div>}
          {localTransactionHistory.map((storyPoint, index = 0) => {
            return index > localTransactionHistory.length - 10 ? (
              <div key={`${index}_${storyPoint?.txId}`}>
                <hr />
                <figure className="history__picture-box">
                  <img className="history__picture" src={storyPoint?.tokenLogo} />
                </figure>
                <h2>{storyPoint?.tokenName}</h2>
                <p>amount: {storyPoint?.amount}</p>
                <div>amount in USDT: {storyPoint?.amountInUSD}$</div>
                {/* <p>time: {storyPoint?.timestamp}</p> */}
                <p>From: {storyPoint?.from}</p>
                <p>To: {storyPoint?.to}</p>
              </div>
            ) : (
              ''
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Wallet;
