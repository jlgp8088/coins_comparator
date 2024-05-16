const Binance = require('node-binance-api');
require('dotenv').config();
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET
});
module.exports = binance;
