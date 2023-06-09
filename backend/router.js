var express = require('express');
var router = express.Router();

const { getProfiles, getNFTs, getTokenInfo } = require('./controller/distributor');
router.get('/NFTs', getNFTs);
router.get('/getProfiles', getProfiles);
router.get('/getTokenInfo/:tokenId', getTokenInfo);
router.get('/test', (req, res) => {res.send('test')});

module.exports = router;

