import React, {useEffect, useState} from 'react';

import { Navbar } from '../modules/Navbar';
import Head from 'next/head';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';

import axios from "axios";
import {Snipping} from "../modules/Snipping";
import {Zilliqa} from "@zilliqa-js/zilliqa";

export default function Mycollection() {
  const [mintContract, setMintContract] = useState({});
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadTokenData = async () => {
    setIsLoading(true);

    const tokenData = [];
    let count = 0;
    for(let i=offset; i<offset+6; i++) {
      count++;
      let tokenOrder = Object.keys(mintContract.token_uris)[i];
      const url = mintContract.base_uri + mintContract.token_uris[tokenOrder];
      let tokenItem;
      try {
        const res = await axios.get(url)
        tokenItem = res.data;
      }
      catch(err) {
        continue;
      }
      let tokenItemData = {order: tokenOrder, ...tokenItem};

      await tokenData.push(tokenItemData);
    }
    setOffset(offset+count);

    setTokens([...tokens, ...tokenData]);
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
    const run = async () => {
      var rpc = process.env.NEXT_PUBLIC_RPC_MAIN;
      var contract_address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN;
      if (process.env.NEXT_PUBLIC_NETWORK_TYPE == 'test') {
        rpc = process.env.NEXT_PUBLIC_RPC_TEST;
        contract_address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TEST;
      }
      var zilliqa = new Zilliqa(rpc);
      const contract = zilliqa.contracts.at(contract_address);
      const state = await contract.getState();
      setMintContract(state);
    };
    run();
  }, [])

  useEffect(() => {
    if(Object.keys(mintContract).length > 0) loadTokenData();
  }, [mintContract])

  return (
    <div className='w-full h-screen bg-color-mynft overflow-y-auto'>
      <Navbar/>
      <Head>
        <title>Hodly Heroes of Yestermorrow - All Hodly NFTs</title>
      </Head>
      <div className='pt-24 pb-2 p-10 flex'>
        <div className={'flex-grow'}>
          {isLoading &&
          <Snipping />
          }
          <div className='mb-4 p-4 rounded-3xl bg-cyan-200/10 text-white'>
            {
              tokens.length === 0 && (
                <div className="row p-5 m-5 text-center" style={{fontSize: 40}}>
                  {
                    isLoading ? 'Loading' : 'No Hodly NFTs found!'
                  }
                </div>
              )
            }
            <Grid container spacing={2}>
              {
                tokens.sort((a,b) => a.tokenId-b.tokenId).map((token, index) => (
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
                      <CardContent style={{ minHeight: 200 }} sx={{ color:'#baf8f8' }}>
                        <div className={'mt-3'}>
                          <p className={'italic text-center'}>
                            Add a backstory!
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              }
            </Grid>
            {
              mintContract.token_uris && Object.keys(mintContract.token_uris).length > offset && (
                <div className="flex text-center justify-center items-center m-auto mt-6">
                  <div className="button cursor-pointer" onClick={() => loadTokenData()}>Load more</div>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}

