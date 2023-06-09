import React, {useEffect, useState} from 'react';

import { Navbar } from '../modules/Navbar';
import Head from 'next/head';

import { createTheme, ThemeProvider } from "@mui/material/styles";
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import useStorage from '../modules/hook.ts';

import {useDispatch, useSelector} from 'react-redux';
import {
  base16,
  bech32,
  setWalletAddress
} from '../modules/ZilpaySlice';
import {useRouter} from "next/router";
import axios from "axios";
import {Snipping} from "../modules/Snipping";
import swal from 'sweetalert';
import {Zilliqa} from "@zilliqa-js/zilliqa";

export default function Mycollection() {
  const dispatch = useDispatch();
  const router = useRouter();
  const {getItem, setItem, removeItem} = useStorage();
  const rdxbech32 = useSelector(bech32);
  const rdxbase16 = useSelector(base16);
  const [mintContract, setMintContract] = useState({});
  const [profiles, setProfiles] = useState([]);
  const [myProfiles, setMyProfiles] = useState([]);
  const [myTokens, setMyTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnected, setWalletConnected] = React.useState(false);

  const theme = createTheme({
    typography: {
      fontFamily: [
        "Panton",
        "PantonItalic"
      ].join(",")
    }
  });

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
        }
      } else {
        swal("Please install Zilpay");
      }
    }
  }

  const loadTokenData = async () => {
    setIsLoading(true);

    const tokenData = [];
    for(let tokenOrder in mintContract.token_uris) {
      if(mintContract.token_owners[tokenOrder].toUpperCase() !== rdxbase16.toUpperCase()) continue;
      const url = mintContract.base_uri + mintContract.token_uris[tokenOrder];
      let tokenItem;
      try {
        const res = await axios.get(url)
        tokenItem = res.data;
      }
      catch(err) {
        continue;
      }
      let tokenItemData = {...tokenItem, order: tokenOrder};

      await tokenData.push(tokenItemData);
    }

    setMyTokens(tokenData);
    setIsLoading(false);
  }

  const loadProfiles = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_ENDPOINT}/getProfiles`);
      setProfiles(res.data);
      console.log("profileData:", res.data)
    }
    catch(err) {
      console.log('get profiles data error:', err);
    }
  }

  useEffect(() => {
    loadProfiles()
    onWallet()
  }, [])

  useEffect(() => {
    const run = async () => {
      var rpc = process.env.NEXT_PUBLIC_RPC_MAIN;
      var contract_address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN;
      if (process.env.NEXT_PUBLIC_NETWORK_TYPE == 'test') {
        rpc = process.env.NEXT_PUBLIC_RPC_TEST;
        contract_address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TEST;
      }
      var zilliqa = new Zilliqa(rpc);
      if (walletConnected) {
        const zilPay = window.zilPay;
        const result = await zilPay.wallet.connect();
        if (result) {
          zilliqa = zilPay;
        }
      }
      const contract = zilliqa.contracts.at(contract_address);
      const state = await contract.getState();
      setMintContract(state);
    };
    if(walletConnected) run();
  }, [walletConnected]);

  useEffect(() => {
    if(Object.keys(mintContract).length > 0) loadTokenData();
  }, [mintContract])

  useEffect(() => {
    const getProfileData = async () => {
      let mine = profiles.filter(profile => myTokens.map(token => token.tokenId).includes(profile.metadata.keyvalues.tokenId));
      const fn = function getProfileData(profile){ // sample async action
        return axios.get(mintContract.base_uri + profile.ipfs_pin_hash)
          .then(res => ({
            ...res.data,
            tokenId: profile.metadata.keyvalues.tokenId
          }));
      };
      Promise.all(mine.map(fn))
        .then(values => {
          setMyProfiles(values);
        })
    }
    getProfileData();
  }, [profiles, myTokens])

  return (
    <ThemeProvider theme={theme}>
      <div className='w-full h-screen bg-color-mynft overflow-y-auto'>
        <Navbar/>
        <Head>
          <title>Hodly Heroes of Yestermorrow - My Hodly Squad</title>
        </Head>
        <div className='pt-24 pb-2 p-10 flex'>
          <div className={'flex-grow'}>
            {isLoading &&
            <Snipping />
            }
            <div className='mb-4 p-4 rounded-3xl bg-cyan-200/10 text-white'>
              {
                myTokens.length === 0 && (
                  <div className="row p-5 m-5 text-center" style={{fontSize: 40}}>
                    {
                      isLoading ? 'Loading' : 'No Hodly NFTs found! Are you connected with the correct wallet?'
                    }
                  </div>
                )
              }
              <Grid container spacing={2}>
                {
                  myTokens.sort((a,b) => a.tokenId-b.tokenId).map((token, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <Card className='!bg-cyan-200/10 !text-white' sx={{ display:'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <CardHeader
                          className='glowing-text-small'
                          avatar={
                            <Avatar className='circle-number !bg-transparent' aria-label="recipe">
                              {++index}
                            </Avatar>
                          }
                          titleTypographyProps={{variant:'display1'}}
                          title={`Hodly Hero #${token.order}`}
                        />
                        <CardMedia
                          component="img"
                          image={mintContract.base_uri + token.resources[1].uri}
                          alt={mintContract.base_uri + token.resources[1].uri}
                        />
                        <CardActions disableSpacing style={{ flex: 1, justifyContent: 'center' }}>
                          <div className="button w-3/4 cursor-pointer"  onClick={() => { router.push(`/myNFTs/${token.order}`) }}>Details</div>
                        </CardActions>
                        <CardContent style={{ minHeight: 200 }} sx={{ color:'#baf8f8' }}>
                          {
                            myProfiles.find(profile => profile.tokenId === token.tokenId) ? (
                              <div className={'mt-3'}>
                                <h1 style={{
                                  fontSize: 26,
                                  fontWeight: "bold"
                                }}>{myProfiles.find(profile => profile.tokenId === token.tokenId).name}</h1>
                                {
                                  <p className={''}>
                                    <span style={{fontWeight: 'bold'}}>PROFILE: </span>
                                    {
                                      Object.keys(myProfiles.find(profile => profile.tokenId === token.tokenId)).filter(key => key !== 'tokenId').map(key => (
                                        <span key={key}
                                              style={{fontStyle: 'italic'}}>{key.toString().toUpperCase()}, </span>
                                      ))
                                    }
                                  </p>
                                }
                              </div>
                            ) : (
                              <div className={'mt-3'}>
                                <p className={'italic text-center'}>
                                  Add a backstory!
                                </p>
                              </div>
                            )
                          }
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                }
              </Grid>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
