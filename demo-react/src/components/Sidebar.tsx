import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import walletPic from '../assets/wallet.png';

import './sidebar.scss';

const Sidebar = ({ wallets, tokens }: any) => {
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

  console.log(tokens);

  return (
    <>
      <div className="sidebar">
        <Typography variant="h5">Your Wallets {tokens?.Binance?.totalBalanceInUSD}</Typography>

        {wallets.map((w: any) => (
          <Link to={`/${w.address}&${w.chainId}`} key={w.data.chainId}>
            <div className="sidebar__list-item">
              <figure>
                <img src={walletPic} />
                <figcaption>{tokens[w.chainId].totalBalanceInUSD}$</figcaption>
              </figure>

              <span>
                <p className="list-item__chain">{w.chainId}</p>
                <p>{w.address}</p>
                <p>{w.chainId}</p>
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
