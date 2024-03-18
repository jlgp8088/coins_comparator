const Binance = require('node-binance-api');
require('dotenv').config();
const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET
});
module.exports = binance;
