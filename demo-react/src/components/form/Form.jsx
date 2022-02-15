import React, { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import { useForm } from 'react-hook-form';
import { Typography, Box } from '@mui/material';
import TextField from '@mui/material/TextField';

import '../wallet.scss';

const TrxForm = ({ tokensByAddress, sendTrxForm, sendTokenForm, setSendTrxForm, setSendTokenForm, handleOpen }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = (data) => {
    console.log(data);
    data.amount = Number(data.amount);

    if (!data.tokenName) {
      setSendTrxForm({ amount: data.amount, receiver: data.receiver });
      handleOpen();
    }
    if (data.tokenName) setSendTokenForm({ amount: data.amount, receiver: data.receiver, tokenName: data.tokenName });
  };
  return (
    <>
      <div className="form-contaier">
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="h3">Send tokens</Typography>
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

            <select {...register('tokenName', { required: true })} className="balance__content">
              {tokensByAddress &&
                tokensByAddress?.tokens?.map((storyPoint, index = 0) => (
                  <option key={`${index}_${storyPoint?.txId}2`}>{storyPoint?.tokenName}</option>
                ))}
            </select>
            <div style={{ color: 'red' }}>{errors.content && <span>Пожалуйста заполните поле</span>}</div>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" type="submit">
                Send
              </Button>
            </Box>
          </div>
        </form>
      </div>

      {/* <div className="form-contaier">
          <form className="form" onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="h3">Send other tokens</Typography>
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
        </div> */}
    </>
  );
};

export default TrxForm;
