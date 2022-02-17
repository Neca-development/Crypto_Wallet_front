import React, { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import { useForm } from 'react-hook-form';
import { Typography, Box, Select, MenuItem } from '@mui/material';
import TextField from '@mui/material/TextField';

import '../wallet.scss';

const TrxForm = ({
  tokensByAddress,
  sendTrxForm,
  sendTokenForm,
  setSendTrxForm,
  setSendTokenForm,
  handleOpen,
  isSetTokens,
  calcFee,
  fee,
  is20Token,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onChangeReceiver = ({ target: { value } }) => {
    if (is20Token) {
      setSendTokenForm({ ...sendTrxForm, receiver: value });
    } else {
      setSendTrxForm({ ...sendTrxForm, receiver: value });
    }
  };

  const onChangeAmount = ({ target: { value } }) => {
    if (is20Token) {
      setSendTokenForm({ ...sendTrxForm, amount: value });
    } else {
      setSendTrxForm({ ...sendTrxForm, amount: value });
    }
    calcFee();
  };

  const handleSend = (e) => {
    e.preventDefault();
    handleOpen();
  };

  // console.log(tokensByAddress);

  // const onSubmit = (data) => {
  //   console.log(data);
  //   data.amount = Number(data.amount);

  //   if (!data.tokenName) {
  //     setSendTrxForm({ amount: data.amount, receiver: data.receiver });
  //     handleOpen();
  //   }
  //   if (data.tokenName) {
  //     setSendTokenForm({ amount: data.amount, receiver: data.receiver, tokenName: data.tokenName });
  //     handleOpen();
  //   }
  // };

  return (
    <>
      <div className="form-contaier">
        <form className="form" onSubmit={(e) => handleSend(e)}>
          {/* {tokensByAddress && tokensByAddress?.tokens[0]} */}

          <div className="form__header-box">
            <Typography variant="h3"> {isSetTokens ? 'Send tokens' : 'Send main coin'}</Typography>{' '}
            {/* {isSetTokens && (
              <select {...register('tokenName', { required: true })} className="form__select">
                {tokensByAddress &&
                  tokensByAddress?.tokens?.map((storyPoint, index = 0) => (
                    <option key={`${index}_${storyPoint?.txId}2`}>{storyPoint?.tokenName}</option>
                  ))}
              </select>
            )} */}
            {is20Token && <h3>Tether USDT</h3>}
          </div>
          <div>
            {/* <TextField
              className="form__input"
              defaultValue={sendTrxForm.receiver}
              control={control}
              name="receiver"
              {...register('receiver', { required: true })}
              id="outlined-required"
              label="receiver"
            /> */}
            <TextField
              className="form__input"
              name="receiver"
              id="outlined-required"
              label="receiver"
              value={sendTrxForm.receiver}
              onChange={(e) => onChangeReceiver(e)}
            />
            <label style={{ color: 'red' }}>{errors.header && <span>Пожалуйста заполните поле</span>}</label>
            {/* <TextField
              className="form__input"
              defaultValue={sendTrxForm.amount}
              {...register('amount', { required: true })}
              id="outlined-required"
              label="amount"
              sx={{ color: '#fff' }}
              onChange={calcFee}
            /> */}
            <TextField
              className="form__input"
              id="outlined-required"
              label="amount"
              value={sendTrxForm.amount}
              sx={{ color: '#fff' }}
              onChange={(e) => onChangeAmount(e)}
            />
            <div style={{ color: 'red' }}>{errors.content && <span>Пожалуйста заполните поле</span>}</div>

            <div style={{ color: 'red' }}>{errors.content && <span>Пожалуйста заполните поле</span>}</div>
            <Box sx={{ mt: 2 }} className="form__submit-wrapper">
              <Button variant="outlined" type="submit">
                Send
              </Button>
              {!is20Token && (
                <small>
                  Fee is: {fee.value} ({fee.usd}$)
                </small>
              )}
            </Box>
          </div>
        </form>
      </div>
    </>
  );
};

export default TrxForm;
