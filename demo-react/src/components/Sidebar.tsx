import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';

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
    <Drawer variant="permanent" anchor="left">
      <p>Your Wallets</p>
      <List>
        {wallets.map((w: any) => (
          <Link to={`/${w.address}&${w.chainId}`} key={w.data.chainId}>
            <ListItem button>
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
    </Drawer>
  );
};

export default Sidebar;
