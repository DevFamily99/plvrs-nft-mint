import React, {useEffect} from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Navbar } from '../modules/Navbar';
import { Snipping } from '../modules/Snipping';

import { useSelector, useDispatch } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import NoWorkResult from 'postcss/lib/no-work-result';
import {setWalletAddress} from "../modules/ZilpaySlice";
import useStorage from "../modules/hook.ts";
import swal from 'sweetalert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const {getItem, setItem, removeItem} = useStorage();

  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgText, setMsgText] = React.useState('');
  const [isLoding, setIsLoding] = React.useState(false);
  const [walletConnected, setWalletConnected] = React.useState(false);

  const onWallet = async () => {
    if (!walletConnected) {
      if (window.zilPay) {
        const zilPay = window.zilPay;
        const result = await zilPay.wallet.connect();
        if (result) {
          dispatch(setWalletAddress({
            base16: zilPay.wallet.defaultAccount.base16,
            bech32: zilPay.wallet.defaultAccount.bech32
          }));

          setWalletConnected(true);
          setItem('zilpay', zilPay.wallet.defaultAccount.base16);
          router.push('myNFTs');
        }
      } else {
        swal("Please install Zilpay");
      }
    }
    else {
      router.push('myNFTs');
    }
  }

  useEffect(() => {
    onWallet();
  }, [])

  return (
    <div className='w-full h-screen bg-color overflow-y-auto'>
      <Navbar></Navbar>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" />
        <meta name="title" content="Enter the PLVRS" />
        <meta name="description" content="Season 1: The Hodly Heroes of Yestermorrow" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://plvrs.online" />
        <meta property="og:title" content="Enter the PLVRS" />
        <meta property="og:description" content="Season 1: The Hodly Heroes of Yestermorrow" />
        <meta property="og:image" content="https://plvrs.online" />

        <meta name="twitter:title" content="Enter the PLVRS" />
        <meta name="twitter:description" content="Season 1: The Hodly Heroes of Yestermorrow" />
        <meta name="twitter:url" content="https://plvrs.online" />
        <meta name="twitter:site" content="@PLVRS" />
        <meta name="twitter:image" content="https://plvrs.online" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {isLoding &&
      <Snipping></Snipping>
      }
      <div className='pt-20 flex flex-row-reverse'>
      </div>

      <Snackbar
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
        open={msgOpen}
        autoHideDuration={6000}
        onClose={() => { setMsgOpen(false) }}
      >
        <Alert onClose={() => { setMsgOpen(false) }} severity="error" sx={{ width: '100%' }}>{msgText}</Alert>
      </Snackbar>
    </div>


  )
}
