import React, {useEffect, useState} from 'react';
import {useRouter} from "next/router";
import {Navbar} from "../../modules/Navbar";
import {useSelector} from "react-redux";
import {base16, bech32, contractState} from "../../modules/ZilpaySlice";
import axios from "axios";
import Script from 'next/script'
// import '@google/model-viewer';

import { createTheme, ThemeProvider } from "@mui/material/styles";
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Slide from '@mui/material/Slide';
import {Dialog,DialogTitle} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import {Snipping} from "../../modules/Snipping";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import swal from 'sweetalert';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const theme = createTheme({
  typography: {
    fontFamily: [
      "Panton",
      "PantonItalic"
    ].join(",")
  }
});

const TokenDetail = () => {
  const router = useRouter();
  const { tokenId } = router.query;
  const mintContract = useSelector(contractState);

  const [token, setToken] = useState({});
  console.log('token', token);
  const [metadata, setMetadata] = useState({});
  const [tokenFile, setTokenFile] = useState({});
  const [fieldname, setFieldname] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    backStory: '',
    homeland: ''
  });
  const [openProfile, setOpenProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getField = (name, isMultiline) => (
    <div className={'flex m-5 '}>
      <TextField
        sx={{
          "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": { borderColor:"cyan", boxShadow: "0 0 10px #00fff0" },
            '& fieldset': {borderColor: 'white',opacity:.8, backgroundColor:'rgba(186, 228, 229,.1)'},
          },
        }}
        inputProps={{ style: { color: "white" } }} InputLabelProps={{style : {color : '#C0BFBD'} }}
        id="outlined-multiline-static"
        label={name.toUpperCase()}
        multiline={isMultiline}
        rows={4}
        fullWidth
        onChange={(e) => setProfile({
          ...profile,
          [name]: e.target.value
        })}
        value={profile[name]}
      />
      {
        name !== 'name' && name !== 'backStory' && name !== 'homeland' && (
          <IconButton
            aria-label="toggle password visibility"
            onClick={() => {
              const copy = {...profile}
              delete copy[name];
              setProfile({
                ...copy
              })
            }}
            edge="end"
          >
            <CloseIcon className='text-white' />
          </IconButton>
        )
      }
    </div>
  )

  const getFieldDetails = (name) => (
    <TableBody>
      <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }}}>
        <TableCell  className='!text-white' align="left" style={{ borderBottom:'none'}}>{name.toUpperCase()} </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className='!text-white glowing-text-small' align="left" style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)"}}>{profile[name]}</TableCell>
      </TableRow>
    </TableBody>
  )

  useEffect(() => {
    if(mintContract !== null && tokenId) {
      setIsLoading(true);
      const url = mintContract.base_uri + mintContract.token_uris[tokenId];
      axios.get(url)
        .then(res => {
          setToken(res.data);
          setIsLoading(false);
        })
        .catch(err => {
          console.log('Get JSON Error', err);
          setIsLoading(false);
        })
    }
  }, [mintContract, tokenId])

  const saveProfile = async () => {
    setIsLoading(true);
    // unpin rest profile json fiies
    let oldProfiles = [];
    let loop = true;
    let offset = 0;

    while (loop) {
      const config = {
        method: 'get',
        url: `https://api.pinata.cloud/data/pinList?&metadata[name]=Profile&pageLimit=${1000}&offset=${offset}&status=pinned&metadata[keyvalues]={"contractAddress":{"value":"${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN}","op":"eq"},"tokenId":{"value":"${token.tokenId}","op":"eq"},"tokenAddress":{"value":"${tokenFile.ipfs_pin_hash}","op":"eq"}}`,
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
        }
      };

      const res = await axios(config)

      oldProfiles = [ ...oldProfiles, ...res.data.rows]

      if (res.data.count < 1000) loop = false;
      offset += 1000
    }
    for(const profile of oldProfiles) {
      const unpinConfig = {
        method: 'delete',
        url: `https://api.pinata.cloud/pinning/unpin/${profile.ipfs_pin_hash}`,
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
        }
      };
      await axios(unpinConfig);
    }

    // Edit Backstory json to ipfs
    const data1 = JSON.stringify({
      "pinataOptions": {
        "cidVersion": 1
      },
      "pinataMetadata": {
        "name": `Profile`,
        "keyvalues": {
          "contractAddress": process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN,
          "tokenId": token.tokenId,
          "tokenAddress": mintContract.token_uris[tokenId]
        }
      },
      "pinataContent": profile
    });
    const config1 = {
      method: 'post',
      url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      },
      data: data1
    };
    const res1 = await axios(config1)
    const profileCID = res1.data.IpfsHash;

    console.log('profileCID', profileCID)

    // update token's metadata.profileAddress as profileCID

    const data2 = {
      "ipfsPinHash": tokenFile.ipfs_pin_hash,
      "name": "HHoYM",
      "keyvalues": {
        "contractAddress": process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN,
        "tokenId": token.tokenId,
        "profileAddress": profileCID
      }
    };

    const config2 = {
      method: 'put',
      url: 'https://api.pinata.cloud/pinning/hashMetadata',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      },
      data: data2
    };

    const res2 = await axios(config2);

    setIsLoading(false)
    setOpenProfile(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <div className='w-full h-full bg-color overflow-y-auto '>
        <Navbar/>
        {isLoading &&
        <Snipping></Snipping>
        }
        {
          Object.keys(token).length > 0 && (
            <div className='p-4 h-fit flex m'>
              <Grid container justifyContent="center" spacing={2} sx={{marginTop: 7.5}}>
                <Grid item xs={12} sm={12} md={6} >
                  <div className={'m-auto'}>
                    <div className='m-0 text-white'>
                      <div className='flex w-full justify-between '>
                        <div className={'flex'}>
                          <ArrowBackIcon className='cursor-pointer' onClick={() => router.push('/HHoYM')}></ArrowBackIcon>
                          <p className={'mx-2 glowing-text-small'}>
                            {`Hodly Hero #${tokenId}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <img className='w-3/5 sm:1/5 md:w-7/12 m-auto'
                         src={mintContract.base_uri + token.resources[1].uri}
                         alt={mintContract.base_uri + token.resources[1].uri}
                    />
                  </div>
                  <Accordion className="!bg-transparent navbar-button-mobile-color">
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon style={{ color: '#baf8f8' }} />}
                      aria-controls="panel2a-content"
                      id="panel2a-header"
                    >
                      <Typography sx={{marginTop:'5px'}}>Attributes</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography>
                        <TableContainer component={Paper} className='!bg-cyan-200/10 mb-0 md:mb-4 p-6' >
                          <Table size={'small'} aria-label="simple table">
                            <TableBody >
                              {console.log(token)}
                              {token.attributes.map((attribute, index) => (
                                <TableRow
                                  key={index}
                                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                  <TableCell component="th" scope="row" sx={{
                                    fontSize: "0.8rem",
                                    color: "#f8f8f8"
                                  }} style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)"}}>
                                    {attribute.trait_type}
                                  </TableCell>
                                  <TableCell className='glowing-text-small' align="center" sx={{
                                    fontSize: "0.8rem",
                                    style: "italic",
                                    color: "#baf8f8"
                                  }} style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)"}}>{attribute?.value}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion className="mt-3 !bg-transparent navbar-button-mobile-color">
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon style={{ color: '#baf8f8' }} />}
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                    >
                      <Typography sx={{marginTop:'5px'}}>Backstory</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography>
                        <TableContainer component={Paper} className='!bg-cyan-200/10 mt-6 p-6'>
                          <Table size={'small'} aria-label="simple table">
                            <TableHead>
                              {
                                Object.keys(profile).map((name, index) => (
                                  <Table aria-label="simple table">
                                    {getFieldDetails(name)}
                                  </Table>
                                ))
                              }
                            </TableHead>
                          </Table>
                        </TableContainer>
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>

              <Dialog
                fullScreen
                open={openProfile}
                TransitionComponent={Transition}
              >
                <DialogTitle className='bg-color-backstory h-fit min-h-full text-white'>
                  <AppBar elevation={0} className='glowing-text' sx={{ position: 'relative', bgcolor: 'transparent' }}>
                    <Toolbar>
                      <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => setOpenProfile(false)}
                        aria-label="close"
                      >
                      </IconButton>
                      <Typography sx={{
                        fontSize: {
                          lg: '1.6rem',
                          md: '1.4rem',
                          sm: '1rem',
                          xs: '0.8rem'
                        }, ml:2, flex:1
                      }}  component="div">
                        {token.name}'s Profile
                      </Typography>
                      <Button sx={{
                        fontSize: {
                          lg: '1.2rem',
                          md: '1rem',
                          sm: '0.8rem',
                          xs: '0.6rem'
                        }
                      }} autoFocus color="inherit" onClick={() => setOpenProfile(false)}>
                        <CloseIcon />Cancel
                      </Button>
                      <Button sx={{
                        fontSize: {
                          lg: '1.2rem',
                          md: '1rem',
                          sm: '0.8rem',
                          xs: '0.6rem'
                        }
                      }} autoFocus color="inherit" onClick={saveProfile}>
                        <SaveIcon />{ "Save" }
                      </Button>
                    </Toolbar>
                  </AppBar>
                  <div className="m-5 p-5 text-white p-10 mt-10">
                    <Grid container spacing={2} columns={{ xs: 2, sm: 2, md: 12 }}>
                      <Grid item xs={3}>
                        <img
                          style={{ width: '100%', marginTop: -50 }}
                          src={mintContract.base_uri + token.resources[1].uri}
                          alt={mintContract.base_uri + token.resources[1].uri}
                        />
                        <div className="hidden md:block">
                          <TextField
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                "&.Mui-focused fieldset": { borderColor:"cyan", boxShadow: "0 0 10px #00fff0" },
                                '& fieldset': {border:'2px solid', borderColor: 'cyan',opacity:.8, backgroundColor:'rgba(186, 228, 229,.1)'},
                              },

                            }}
                            inputProps={{ style: { color: "white" } }} InputLabelProps={{style : {color : '#C0BFBD'} }}
                            id="outlined-basic"
                            label="Story Element"
                            variant="outlined"
                            value={fieldname}
                            onChange={e => setFieldname(e.target.value)}
                            fullWidth
                          />
                          <div className='button p-6 mt-6 cursor-pointer' fullWidth onClick={() => {
                            if(fieldname === '') swal('please type field name');
                            else if(Object.keys(profile).length > 5) swal('Sorry, You can create only 3 additional fields');
                            else setProfile({
                                ...profile,
                                [fieldname]: ''
                              })
                            setFieldname('');
                          }}>
                            Add Story Element
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={9}>
                        <Card elevation={0} className='!bg-transparent'>
                          <CardContent>
                            <Typography sx={{fontSize: '1.5rem'}} className='glowing-text' gutterBottom>
                              Hero's Backstory
                            </Typography>
                            {
                              Object.keys(profile).map((name, index) => (
                                <div className="m-5" key={index}>
                                  {getField(name, name==='backStory')}
                                </div>
                              ))
                            }
                          </CardContent>
                        </Card>
                        <div className="block md:hidden m-auto">
                          <TextField
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                "&.Mui-focused fieldset": { borderColor:"cyan", boxShadow: "0 0 10px #00fff0" },
                                '& fieldset': {border:'2px solid', borderColor: 'cyan',opacity:.8, backgroundColor:'rgba(186, 228, 229,.1)'},
                              },

                            }}
                            inputProps={{ style: { color: "white" } }} InputLabelProps={{style : {color : '#C0BFBD'} }}
                            id="outlined-basic"
                            label="Story Element"
                            variant="outlined"
                            value={fieldname}
                            onChange={e => setFieldname(e.target.value)}
                            fullWidth
                          />
                          <div className='button p-6 mt-6 cursor-pointer' fullWidth onClick={() => {
                            if(fieldname === '') swal('please type field name');
                            else if(Object.keys(profile).length > 5) swal('Sorry, You can create only 3 additional fields');
                            else setProfile({
                                ...profile,
                                [fieldname]: ''
                              })
                            setFieldname('');
                          }}>
                            Add Story Element
                          </div>
                        </div>
                      </Grid>
                    </Grid>
                  </div>
                </DialogTitle>
              </Dialog>
            </div>
          )
        }
      </div>
    </ThemeProvider>
  );
};

export default TokenDetail;
