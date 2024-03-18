const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {
  const list_coins = ['BTC-USDT', 'BTC-EUR', 'USDT-EUR'];
  res.render('index', { title: 'Express', list_coins });
});

module.exports = router;
