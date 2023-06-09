require("dotenv").config();
const { Zilliqa } = require('@zilliqa-js/zilliqa');

const axios = require("axios");

var net_url = process.env.RPC_TEST;
if (process.env.NETWORK_TYPE === 'main') {
  net_url = process.env.RPC_MAIN;
}
const zilliqa = new Zilliqa(net_url);

exports.getNFTs = async (req, res) => {
  let loop = true;
  let offset = 0;
  let profiles = []

  try {
    while(loop) {
      const config = {
        method: 'get',
        url: `https://api.pinata.cloud/data/pinList?metadata[name]=Profile&status=pinned&pageLimit=1000&pageOffset=${offset}`,
        headers: {
          pinata_api_key: process.env.PINATA_KEY,
          pinata_secret_api_key: process.env.PINATA_SEC
        }
      };
      const res = await axios(config);
      profiles = [ ...profiles, ...res.data.rows ];
      if(res.data.rows.length < 1000) loop = false;
      offset += 1000
    }
  }
  catch(err) {
    res.send('get profile error');
  }
  // console.log('profiles:', profiles);

  const contract = zilliqa.contracts.at(process.env.CONTRACT_ADDRESS_MAIN);
  const contractState = await contract.getState();
  // console.log('contract state:', contractState);

  const tokenData = [];

  try {
    for(let tokenOrder in contractState.token_uris) {
      const url = contractState.base_uri + contractState.token_uris[tokenOrder];
      let tokenItem;
      try {
        const res = await axios.get(url)
        tokenItem = res.data;
      }
      catch(err) {
        continue;
      }
      console.log('get ipfs data:', tokenItem)
      let tokenItemData = {...tokenItem, order: tokenOrder};

      if(profiles.find(profile => profile.metadata.keyvalues.tokenAddress == contractState.token_uris[tokenOrder])) {
        const url2 = contractState.base_uri + profiles.find(profile => profile.metadata.keyvalues.tokenAddress == contractState.token_uris[tokenOrder]).ipfs_pin_hash;
        const res2 = await axios.get(url2);
        tokenItemData = { ...tokenItemData, profile: res2.data };
      }
      await tokenData.push(tokenItemData);
    }
  }
  catch(err) {
    console.log('get token error:', err);
    res.send('get token error');
  }

  console.log(tokenData);

  res.send(tokenData);
}

exports.getTokenInfo = async (req, res) => {
  const { tokenId } = req.params;
  let profile = {};
  let tokenInfo;
  try {
    const config = {
      method: 'get',
      url: `https://api.pinata.cloud/data/pinList?metadata[name]=HHoYM&metadata[keyvalues]={"tokenId":{"value":"${tokenId}","op":"eq"},"contractAddress":{"value":"${process.env.CONTRACT_ADDRESS_MAIN}","op":"eq"}}`,
      headers: {
        pinata_api_key: process.env.PINATA_KEY,
        pinata_secret_api_key: process.env.PINATA_SEC
      }
    };
    const result = await axios(config);
    const { ipfs_pin_hash, metadata } = result.data.rows[0];
    const result1 = await axios(process.env.PINATA_GATEWAY+ipfs_pin_hash);
    tokenInfo = result1.data;
    if(metadata.keyvalues.profileAddress !== 'empty') {
      try {
        const result2 = await axios.get(process.env.PINATA_GATEWAY + metadata.keyvalues.profileAddress);
        profile = result2.data;
      }
      catch(err) {
        console.log('get profile error:', err);
        res.send(err);
      }
    }
    res.send({tokenInfo, profile});
  }
  catch(err) {
    console.log('get token error:', err);
    res.send('get token error');
  }
}

exports.getProfiles = async (req, res) => {
  let loop = true;
  let offset = 0;
  let profiles = []
  let profileData = []

  try {
    while(loop) {
      const config = {
        method: 'get',
        url: `https://api.pinata.cloud/data/pinList?metadata[name]=Profile&status=pinned&pageLimit=1000&pageOffset=${offset}`,
        headers: {
          pinata_api_key: process.env.PINATA_KEY,
          pinata_secret_api_key: process.env.PINATA_SEC
        }
      };
      const res = await axios(config);
      profiles = [ ...profiles, ...res.data.rows ];
      if(res.data.rows.length < 1000) loop = false;
      offset += 1000
    }
    res.send(profiles);
  }
  catch(err) {
    res.send('get profile error');
  }

  // console.log('profiles:', profiles);
  return;

  const contract = zilliqa.contracts.at(process.env.CONTRACT_ADDRESS_MAIN);
  const contractState = await contract.getState();
  // console.log('contract state:', contractState);

  const tokenData = [];

  try {
    for(let tokenOrder in contractState.token_uris) {
      if(base16Address.toString().toUpperCase() === contractState.token_owners[tokenOrder].toString().toUpperCase()) {
        const url = contractState.base_uri + contractState.token_uris[tokenOrder];
        let tokenItem;
        try {
          const res = await axios.get(url)
          tokenItem = res.data;
        }
        catch(err) {
          continue;
        }
        console.log('get ipfs data:', tokenItem)
        let tokenItemData = {...tokenItem, order: tokenOrder};

        if(profiles.find(profile => profile.metadata.keyvalues.tokenAddress == contractState.token_uris[tokenOrder])) {
          const url2 = contractState.base_uri + profiles.find(profile => profile.metadata.keyvalues.tokenAddress == contractState.token_uris[tokenOrder]).ipfs_pin_hash;
          const res2 = await axios.get(url2);
          tokenItemData = { ...tokenItemData, profile: res2.data };
        }
        await tokenData.push(tokenItemData);
      }
    }
  }
  catch(err) {
    console.log('get token error:', err);
    res.send('get token error');
  }

  console.log(tokenData);

  res.send(tokenData);
}

