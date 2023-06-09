import React from 'react';
import {Navbar} from "../modules/Navbar";
import {Snipping} from "../modules/Snipping";
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Head from 'next/head';

import { createTheme, ThemeProvider } from "@mui/material/styles";
import Typography from '@mui/material/Typography';
import TwitterIcon from '@mui/icons-material/Twitter';
import TelegramIcon from '@mui/icons-material/Telegram';

import axios from "axios";
import {useSelector} from 'react-redux';
import {bech32, base16, version, contract} from '../modules/ZilpaySlice';
import {Zilliqa} from '@zilliqa-js/zilliqa';
import swal from 'sweetalert';

const {MessageType} = require('@zilliqa-js/subscriptions');
const {toBech32Address, fromBech32Address} = require('@zilliqa-js/crypto')
const {BN, Long, bytes, units} = require('@zilliqa-js/util');
let offset = 0
let offset1 = 0
let zilliqa
const min = 1;

{/* TODO: For sample TableContainer only. Will delete if updated Createdata function and const rows */}

function createData(name, value) {
  return { name, value };
}

const rows = [
  createData('Original Lost Heroes', 10),
  createData('Heroes of Yestermorrow', 3333),
  createData('Total Attributes', 77),
  createData('Mint Price Here', '666 ZIL'),
  createData('Buy Price Elsewhere', '888 ZIL'),
];

const rows2 = [
  createData('Species', '10 colors'),
  createData('Strength', '17 weapons'),
  createData('Clothing', '15 options'),
  createData('Head/Eyewear', '12 pieces'),
  createData('Accessories', '11 pieces'),
  createData('Facial Hair & Look', '11 styles'),
];

const theme = createTheme({
  typography: {
    fontFamily: [
      "Panton",
      "PantonItalic"
    ].join(",")
  }
});

const Mint = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [stateMessage, setStateMessage] = React.useState('');
  const [amount, setAmount] = React.useState(1);
  const [payTransactionId, setPayTransactionId] = React.useState('');
  const [mintTransactionId, setMintTransactionId] = React.useState('');

  const rdxbech32 = useSelector(bech32);
  const rdxbase16 = useSelector(base16);
  const rdxversion = useSelector(version);

  React.useEffect(() => {
    let rpc = process.env.NEXT_PUBLIC_RPC_MAIN;
    if (process.env.NEXT_PUBLIC_NETWORK_TYPE == 'test') {
      rpc = process.env.NEXT_PUBLIC_RPC_TEST;
    }
    zilliqa = new Zilliqa(rpc);
    // unpinFiles();
  }, [])

  const addZero = (originName) => {
    originName = originName.toString();
    return ("0000").slice(0, 4 - originName.length) + originName;
  }

  const getUnmintedTokenIds = async (amount, unminted = []) => {
    const contract = zilliqa.contracts.at(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN);
    const state = await contract.getState();
    const token_id_count = state.token_id_count;

    let index = parseInt(token_id_count) + 1;
    while(unminted.length < amount) {
      unminted.push(index++);
    }

    return unminted;
  }

  const payToOwner = async (amount) => {
    setStateMessage('Sending payment to the Portal of Yestermorrow...')
    setIsLoading(true);

    const zilliqa = window.zilPay;
    const {result} = await zilliqa.blockchain.getBalance(rdxbech32);
    const { balance } = result;
    const myGasPrice = units.toQa('2000', units.Units.Li);
    const rawTx = zilliqa.transactions.new(
      {
        version,
        toAddr: process.env.NEXT_PUBLIC_MINTER_ADDRESS_MAIN,
        amount: new BN(units.toQa(parseInt(process.env.NEXT_PUBLIC_MINT_PRICE) * amount, units.Units.Zil)),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(50),
      },
      false,
    );

    let tx;
    try{
      tx = await zilliqa.blockchain.createTransaction(
        rawTx
      )
    }
    catch(err) {
      swal(`Transaction have been failed! ${err}`);
      return setIsLoading(false);
    }
    setPayTransactionId(tx.ID);

    setStateMessage('Waiting for payment to be confirmed by Zilliqa blockchain on planet Earth...')
    waitUntil(tx.ID)
      .then((res) => {
        setIsLoading(false);
        console.log('payment success', res, tx.ID)
        mint(amount);
      })
      .catch(() => {
        setIsLoading(false);
        console.log('payment error')
      });
  }

  const waitUntil = (transactionId) => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const txn = await zilliqa.blockchain.getTransaction(
            transactionId
          );
          if (txn?.receipt.success === true) {
            resolve(transactionId);
            clearInterval(interval);
          }
          else if(txn?.receipt.success === false) {
            reject(false);
            clearInterval(interval);
          }
        } catch (e) {

        }
      }, 5000);
    });
  }

  const mint = async (amount) => {
    if(swal(`Are you ready to bring ${amount} Hodlies into your imagination?`)) {
      setIsLoading(true);
      setStateMessage(`Contacting the Portal of Yestermorrow about ${amount} Hodly NFTs...`);
      const data = JSON.stringify({
        "timeoutSeconds": 3600,
        "contentIds": [
          `${process.env.NEXT_PUBLIC_PINATA_JSON_DIRECTORY_FILE_ID}`
        ]
      });

      const config = {
        method: 'post',
        url: 'https://managed.mypinata.cloud/api/v1/auth/content/jwt',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_PININA_SUBMARINE_KEY,
          'Content-Type': 'application/json'
        },
        data: data
      };

      setStateMessage(`Generating resonant frequency for Hodly multiverse...`);
      axios(config)
        .then(async res => {
          const token = res.data;

          setStateMessage(`Frequency transmitted!`);
          console.log('token generated', token)
          offset = 0
          const hashs = []

          setStateMessage(`Portal of Yestermorrow is now broadcasting the frequency for us...`);

          const items = await getUnmintedTokenIds(amount);
          console.log('minting items id:', items);

          setStateMessage(`A wild Hodly Hero has responded!`);

          for (let i = 0; i < items.length; i++) {
            const filename = `${items[i]}.json`;
            const config = {
              method: 'get',
              url: `https://ipfs.pelenia.online/ipfs/${process.env.NEXT_PUBLIC_PINATA_JSON_DIRECTORY_CID}/${filename}?accessToken=${token}`
            };

            try {
              const res = await axios(config)
              console.log('get item\'s JSON data content', res.data)
              let glbCID, pngCID;
              if(items[i]<334) {
                glbCID = process.env.NEXT_PUBLIC_1_333_DIRECTORY_GLB;
                pngCID = process.env.NEXT_PUBLIC_1_333_DIRECTORY_PNG;
              }
              else if(items[i]<667) {
                glbCID = process.env.NEXT_PUBLIC_334_666_DIRECTORY_GLB;
                pngCID = process.env.NEXT_PUBLIC_334_666_DIRECTORY_PNG;
              }
              else {
                glbCID = process.env.NEXT_PUBLIC_667_3333_DIRECTORY_GLB;
                pngCID = process.env.NEXT_PUBLIC_667_3333_DIRECTORY_PNG;
              }

              const jsonData = {
                ...res.data,
                "resources": [
                  {
                    "uri": `${glbCID}/${items[i]}.glb`,
                    "mime_type": "model/glb"
                  },
                  {
                    "uri": `${pngCID}/${addZero(items[i])}.png`,
                    "mime_type": "image/png"
                  }
                ],
                "animation_url": `https://ipfs.pelenia.online/ipfs/${glbCID}/${items[i]}.glb`,
                "external_url": `https://plvrs.online/HHoYM/${items[i]}`,
              };

              const data = JSON.stringify({
                "pinataOptions": {
                  "cidVersion": 1
                },
                "pinataMetadata": {
                  "name": `HHoYM`,
                  "keyvalues": {
                    "contractAddress": process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN,
                    "tokenId": res.data.tokenId ? res.data.tokenId : items[i],
                    "profileAddress": "empty"
                  }
                },
                "pinataContent": jsonData
              });
              const config1 = {
                method: 'post',
                url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
                headers: {
                  'Content-Type': 'application/json',
                  pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                  pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
                },
                data: data
              };
              try {
                console.log('pinning item\'s JSON data to pinata', data)
                const res = await axios(config1)

                const {IpfsHash} = res.data;

                hashs.push({IpfsHash})

              } catch (err) {
                console.log('JSON Pin Error', err)
              }
            } catch (err) {
              console.log('Get Submarine JSON Data Error', err)
            }
          }

          console.log(hashs.map((individualHash, index) => {
            return {
              "constructor":"Pair",
              "argtypes": [
                "ByStr20",
                "String"
              ],
              "arguments": [
                rdxbase16,
                individualHash.IpfsHash
              ]
            }
          }))

          const myGasPrice = units.toQa('2000', units.Units.Li);

          zilliqa.wallet.addByPrivateKey(process.env.NEXT_PUBLIC_MINTER_PRIVATE_KEY)
          const contract = zilliqa.contracts.at(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN);
          try {
            setStateMessage(`Asking Hodly if it would like its life force to become an NFT in our universe...`);
            console.log('send transaction for batchMint');
            const callTx = await contract.call(
              'BatchMint',
              [
                {
                  vname: 'to_token_uri_pair_list',
                  type: 'List (Pair (ByStr20) (String))',
                  value: hashs.map((individualHash, index) => {
                    return {
                      "constructor":"Pair",
                      "argtypes": [
                        "ByStr20",
                        "String"
                      ],
                      "arguments": [
                        rdxbase16,
                        individualHash.IpfsHash
                      ]
                    }
                  })
                }
              ],
              {
                version: rdxversion,
                amount: new BN(0),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(50000),
              }
            );
            setStateMessage(`Hodly has accepted your offer!`);
            setMintTransactionId(callTx.id);

            setStateMessage(`Waiting for Hodly's essence to mint...`);
            // const confirmedTxn = await callTx.confirm(callTx.id);

            console.log(`The transaction status is:`, callTx.id);
            console.log(callTx.receipt);

            swal(`You have successfully minted ${amount} Hodly NFTs! Please see transaction receipts below and head over to the My NFTs page to see the new member of your #HodlySquad!`);
            setIsLoading(false);
          } catch (err) {
            // TODO error alert
            setStateMessage(`Reverting JSON data setting--this is an error!`);
            console.log('mint error-final:', err)
            for (const each of hashs) {
              console.log(each.IpfsHash);
              const unpinConfig = {
                method: 'delete',
                url: `https://api.pinata.cloud/pinning/unpin/${each.IpfsHash}`,
                headers: {
                  pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                  pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
                }
              };
              await axios(unpinConfig);
            }
            setStateMessage(`JSON data setting has been reverted`);
            setIsLoading(false);
          }
        })
    }
  }

  const unpinFiles = async () => {
    let toUnpinTokenIds = [];
    let allTokens = [];
    let loop = true;

    while (loop) {
      const config = {
        method: 'get',
        url: `https://api.pinata.cloud/data/pinList?&metadata[name]=HHoYM&pageLimit=${1000}&offset=${offset}&status=pinned`,
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
        }
      };

      const res = await axios(config)

      allTokens = [ ...allTokens, ...res.data.rows.filter(file => file.metadata.keyvalues?.contractAddress === 'zil17lnncpjzjqtshg30p42dasvuh2npwxkkf066sx')]

      if (res.data.count < 1000) loop = false;
      offset += 1000
    }

    console.log('allTokens:', allTokens.map(token => token.metadata.keyvalues.tokenId));

    for (const token of allTokens) {
      if(toUnpinTokenIds.includes(token.metadata.keyvalues.tokenId)) {
        if(confirm('are you sure unpill #'+token.metadata.keyvalues.tokenId)) {
          const unpinConfig = {
            method: 'delete',
            url: `https://api.pinata.cloud/pinning/unpin/${token.ipfs_pin_hash}`,
            headers: {
              pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
              pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
            }
          };
          await axios(unpinConfig);
        }
      }
    }
  }


  return (
    <ThemeProvider theme={theme}>
      <div className='w-full h-screen bg-color overflow-y-auto'>
        <Navbar></Navbar>
        <Head>
          <title>Hodly Heroes of Yestermorrow - Mint Page</title>
        </Head>
        <div className='m-auto pt-24 pb-2 p-10 '>
          <div className={'flex-grow '}>
            <Grid container className='justify-center items-center' spacing={{ xs: 2, md: 3 }}>
              <Grid item xs={24} sm={12} md={6}>
                <div className='mb-4 p-4 rounded bg-cyan-200/10'>
                  {
                    isLoading && (
                      <div className="mb-5 justify-center items-center m-auto p-auto text-center">
                        <Alert
                          icon={false}
                          variant="outlined"
                          sx={{ display: "flex", alignItems: "center",textAlign: "center", color: '#fff', borderColor: '#fff' }}
                        >
                          <p className="font-black text-white text-red-300/90 text-xl text-center">MINT IN PROGRESS. DO NOT LEAVE THIS PAGE!</p>
                        </Alert>
                      </div>
                    )
                  }
                  {
                    isLoading && stateMessage!== '' && (
                      <div className="mb-5">
                        <Alert
                          variant="outlined"
                          severity="info"
                          icon={<CircularProgress sx={{ color: '#fff' }}/>}
                          sx={{ display: "flex", alignItems: "center", color: '#fff', borderColor: '#fff' }}
                        >
                          {stateMessage}
                        </Alert>
                      </div>
                    )
                  }
                  <div className="flex mb-3 items-center justify-center">
                    <img className="gif-filter" src="Hodly.gif" alt="Hodlies!" width="200px" height="200px"/>
                  </div>
                  <div className="row flex justify-between form-group mb-2">
                    <Paper
                      component="form"
                      sx={{ m: '2px 4px', p: '5px', display: 'flex', alignItems: 'center', width: '100%', backgroundColor:'rgba(186, 228, 229,.1)' }}
                    >
                      <InputBase
                        type="number"
                        sx={{ ml: 1, flex: 1 , color:'white'}}
                        placeholder="How many Hodlies?"
                        value={amount}
                        inputProps={{ min }}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            setAmount(e.target.value);
                            return;
                          }
                          const value = +e.target.value;
                          if (value < min) {
                            setAmount(min);
                          } else {
                            setAmount(value);
                          }
                        }}
                      />
                    </Paper>
                  </div>
                  <div className="flex form-group mb-2 mt-4">
                    <div className="button cursor-pointer" style={{ margin: 5 }} variant="contained" onClick={() => payToOwner(amount)}>Mint for 666 ZIL</div>
                  </div>
                  <div className='text-xs ml-2'><p>By sending payment, you agree to our <i><a className="glowing-href-hover" href="https://guides.pelenia.online/terms-and-conditions">Terms of Service</a></i></p></div>
                  {
                    !!payTransactionId && (
                      <div className="flex !text-white border-2 border-solid rounded-md p-2 items-center">
                        <p>
                          Payment Tx:
                        </p>
                        <a className="elliptxt elliptxt-mint italic glowing-text-supersmall hover:text-white p-2" href={`https://viewblock.io/zilliqa/tx/${payTransactionId}`} target={'_blank'} rel="noreferrer">{`0x${payTransactionId}`}</a>
                      </div>
                    )
                  }
                  {
                    !!mintTransactionId && (
                      <div className="flex !text-white border-2 border-solid rounded-md p-2 items-center">
                        <p>
                          Mint Tx:
                        </p>
                        <a className="elliptxt elliptxt-mint italic glowing-text-supersmall hover:text-white p-2" href={`https://viewblock.io/zilliqa/tx/${mintTransactionId}`} target={'_blank'} rel="noreferrer">{`0x${mintTransactionId}`}</a>
                      </div>
                    )
                  }
                </div>
              </Grid>
              <Grid item xs={24} sm={12} md={6}>
                <TableContainer component={Paper} className='!bg-cyan-200/10 mb-0 md:mb-4 p-6 '>
                  <Table aria-label="simple table">
                    <TableBody>
                      <h2>{"Let's Mint You a Hodly Hero!"}</h2>
                      <p>{"1. Choose how many you'd like; send your payment."}</p>
                      <p>{`2. When transaction has confirmed, choose "Yes/OK" at the pop-up to begin the minting process. If you cancel, your NFT will not mint (please contact the Pelenia community on Telegram or Twitter if this happens)`}</p>
                      <p>{`3. Wait.`}</p>
                      <p>{`4. You will be notified when the minting process has completed. See the`} <i><a className="glowing-href-hover" href="/myNFTs">My NFTs</a></i> {`page to start having some fun.`}</p>
                      <TwitterIcon className='absolute m-auto align-bottom cursor-pointer !fill-cyan-500 hover:fill-cyan-100 mt-6' aria-label="Twitter.com" onClick={() => window.open('https://www.twitter.com/entertheplvrs')}> </TwitterIcon>
                      <TelegramIcon className='absolute m-auto align-bottom cursor-pointer !fill-cyan-500 hover:fill-cyan-100 mt-6 ml-8' aria-label="Twitter.com" onClick={() => window.open('https://www.twitter.com/entertheplvrs')}> </TelegramIcon>
                      <p className='text-xs mt-6 text-right'>© 2022 <i><a className='glowing-href-hover' href="https://pelenia.online">Pelenia DAO</a></i></p>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={24} sm={12} md={6}>
                <TableContainer component={Paper} className='!bg-cyan-200/10 mb-0 md:mb-4 p-6 '>
                  <Table aria-label="simple table">
                    <TableBody>
                      <h2>NFT-Fueled Stories YOU Create!</h2>
                      <p className='indent-6'>The 10 Lost Heroes have disappeared through the Portal of Yestermorrow! 3,333 new Hodlies seem to have emerged out the other end, their traits & accessories vaguely familiar...</p>

                      <p className='indent-6'>There's only one problem: these Hodly Heroes of Yestermorrow need your help to remember where they came from.</p>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={24} sm={12} md={6}>
                <TableContainer component={Paper} className='!bg-cyan-200/10 mb-0 md:mb-4 p-6 '>
                  <Table aria-label="simple table">
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.name}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row" sx={{
                            fontSize: "1rem",
                            color: "#f8f8f8"
                          }} style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)"}}>
                            {row.name}
                          </TableCell>
                          <TableCell className='glowing-text-small' component="th" scope="row" sx={{
                            fontSize: "1rem",
                            style: "italic",
                            color: "#baf8f8"
                          }} style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)"}}>{row.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={24} sm={12} md={6}>
                <TableContainer component={Paper} className='!bg-cyan-200/10 mb-0 md:mb-4 p-6 '>
                  <Table aria-label="simple table">
                    <TableBody>

                      <iframe className='m-auto w-full iframe-height' src="https://www.youtube.com/embed/H6E2Cp5uR8k" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={24} sm={12} md={6}>

                <TableContainer component={Paper} className='!bg-cyan-200/10 mb-0 md:mb-4 p-6 '>
                  <h3><a href="https://peledao.app/539a0e08304c4250af2ef0a6379207a7?v=a1e08650ebb448e18c7610fbcfa89062" target="blank">Explore All Attributes & Rarity</a></h3>
                  <Table aria-label="simple table">
                    <TableBody>
                      {rows2.map((row) => (
                        <TableRow
                          key={row.name}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row" sx={{
                            fontSize: "1rem",
                            color: "#f8f8f8"
                          }} style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)"}}>
                            {row.name}
                          </TableCell>
                          <TableCell className='glowing-text-small' component="th" scope="row" sx={{
                            fontSize: "1rem",
                            style: "italic",
                            color: "#baf8f8"
                          }} style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)"}}>{row.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={24} sm={12} md={6}>
                <TableContainer component={Paper} className='!bg-cyan-200/10 mb-0 md:mb-4 p-6 '>
                  <Table aria-label="simple table">
                    <TableBody className="text-white">
                      <h2>Roadmap: What's In Store?</h2>
                      <p className='indent-6'>
                        As an experiment in community storytelling, all software & tools built will be shared with and available for other projects within Pelenia DAO.
                        3D Interaction Platform
                        View your Hodly and put it inside custom 3D environments! Use it as a tool to get inspired and start writing stories.</p>

                      <strong><i>Collab Networking Dapp</i></strong><br></br>
                      <p className='indent-6'>
                        Pitch ideas & premises to NFT owners. Maybe your Hodlies know eachother from the reality bend last summer.</p>

                      <strong><i>Multiverse Megapacks</i></strong><br></br>
                      <p className='indent-6'>
                        Asset libraries such as sound effects, animation presets, facial expressions, and more--available only to NFT holders.</p>

                      <strong><i>Media Bits & Pieces</i></strong><br></br>
                      <p className='indent-6'>
                        We start producing quality media telling the stories of our Hodlies and their plight for decentralization.</p>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Mint;
