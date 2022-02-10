import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';

const Sidebar = ({ wallets }: any) => {
  const [totalBalance, setTotalBalance] = useState(0);

  const getTotalBalance = async () => {
    let balance = 0;
    for (const wallet of wallets) {
      balance += await wallet.getTotalBalanceInUSD();
    }
    setTotalBalance(Math.trunc(balance * 100) / 100);
  };

  useEffect(() => {
    getTotalBalance();
  }, [wallets]);

  return (
    <>
      <Typography variant="h3">Your Wallets</Typography>
      <List sx={{ m: 0, p: 0 }}>
        {wallets.map((w: any) => (
          <Link to={`/${w.address}&${w.chainId}`} key={w.data.chainId}>
            <ListItem sx={{ p: 0, m: 0, minWidth: '100%', width: '100%' }} button>
              <ListItemIcon></ListItemIcon>
              <p>{w.chainId}</p>
              <p>{w.address}</p>
            </ListItem>
          </Link>
        ))}
      </List>
      <article>
        Total Balance in : {totalBalance}
        <b> $</b>
      </article>
    </>
  );
};

export default Sidebar;
