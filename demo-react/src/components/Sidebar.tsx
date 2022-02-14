import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import wallet from '../assets/wallet.png';

import './sidebar.scss';

const Sidebar = ({ wallets }: any) => {
  const [totalBalance, setTotalBalance] = useState(0);

  const getTotalBalance = async () => {
    let balance = 0;
    for (const wallet of wallets) {
      // balance += await wallet.getTotalBalanceInUSD();
      balance += (await wallet.getTokensByAddress()).totalBalanceInUSD;
    }
    setTotalBalance(Math.trunc(balance * 100) / 100);
  };

  useEffect(() => {
    getTotalBalance();
  }, [wallets]);

  return (
    <>
      <div className="sidebar">
        <Typography variant="h5">Your Wallets</Typography>

        {wallets.map((w: any) => (
          <Link to={`/${w.address}&${w.chainId}`} key={w.data.chainId}>
            <div className="sidabar__list-item">
              <img src={wallet} />
              <span>
                <p className="list-item__chain">{w.chainId}</p>
                <p>{w.address}</p>
              </span>
            </div>
          </Link>
        ))}
        <article>
          Total Balance in : {totalBalance}
          <b> $</b>
        </article>
      </div>
    </>
  );
};

export default Sidebar;
