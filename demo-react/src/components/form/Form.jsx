import React, { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import { useForm } from 'react-hook-form';
import { Typography, Box, Select, MenuItem } from '@mui/material';
import TextField from '@mui/material/TextField';

import '../wallet.scss';

const TrxForm = ({ tokensByAddress, sendTrxForm, sendTokenForm, setSendTrxForm, setSendTokenForm, handleOpen, isSetTokens }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  console.log(tokensByAddress);
  const onSubmit = (data) => {
    console.log(data);
    data.amount = Number(data.amount);

    if (!data.tokenName) {
      setSendTrxForm({ amount: data.amount, receiver: data.receiver });
      handleOpen();
    }
    if (data.tokenName) {
      setSendTokenForm({ amount: data.amount, receiver: data.receiver, tokenName: data.tokenName });
      handleOpen();
    }
  };
  return (
    <>
      <div className="form-contaier">
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          {/* {tokensByAddress && tokensByAddress?.tokens[0]} */}

          <div className="form__header-box">
            <Typography variant="h3"> {isSetTokens ? 'Send tokens' : 'Send main coin'}</Typography>{' '}
            {isSetTokens && (
              <select {...register('tokenName', { required: true })} className="form__select">
                {tokensByAddress &&
                  tokensByAddress?.tokens?.map((storyPoint, index = 0) => (
                    <option key={`${index}_${storyPoint?.txId}2`}>{storyPoint?.tokenName}</option>
                  ))}
              </select>
            )}
          </div>
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
              defaultValue={sendTokenForm.amount}
              {...register('amount', { required: true })}
              id="outlined-required"
              label="amount"
              sx={{ color: '#fff' }}
            />
            <div style={{ color: 'red' }}>{errors.content && <span>Пожалуйста заполните поле</span>}</div>

            <div style={{ color: 'red' }}>{errors.content && <span>Пожалуйста заполните поле</span>}</div>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" type="submit">
                Send
              </Button>
            </Box>
          </div>
        </form>
      </div>
    </>
  );
};

export default TrxForm;
