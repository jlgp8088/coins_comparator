const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {
  const url_websocket = process.env.WEBSOCKET_DNS
  const api_key =  process.env.API_KEY
  const list_coins = ['BTC-USDT', 'BTC-EUR', 'USDT-EUR'];
  res.render('index', { title: 'Coins Comparator', url_websocket: url_websocket, list_coins, api_key });
});

module.exports = router;
