const { kraken, binance, keyrock } = require('./dictionary');

const krakenStructure = (message, seqNum) => {
  try {
    const response = message.toString('utf-8');
    const data = JSON.parse(response);
    if (data && data.data) {
      const wsdata = data.data
      const dataStructure =  wsdata.map((element)=>{
        const bids = element.side === 'buy' ? element.price : null;
        const offers = element.side === 'sell' ? element.price : null;
        return {
          origin: 'kraken',
          pair: kraken[element.symbol],
          bids, //b
          offers, //s
          seqNum
        };
      })

      return dataStructure;
    }
    return null;
  } catch (error) {
    console.log(error.message);
    return null;
  }
};

const keyRocksStructure = (data) => {
  try {
    const response = data.toString('utf-8');
    const jsonObject = JSON.parse(response);
    const info = jsonObject.data;
    if (jsonObject.reqid && info[0].Bids.length > 0) {
      dataStructure = {
        origin: 'keyrocks',
        pair: keyrock[info[0].Symbol],
        bids: info[0].Bids[0].Price,
        offers: info[0].Offers[0].Price,
        seqNum: jsonObject.seqNum,
        size: {
          bids: info[0].Bids,
          offers: info[0].Offers
        }
      };
      return JSON.stringify(dataStructure);
    }
    return null;
  } catch (error) {
    console.log(error.message);
    return null;
  }
};

const binanceStructure = (data, seqNum) => {
  let { e: eventType, E: eventTime, s: symbol, u: updateId, b: bidDepth, a: askDepth } = data;
  if (bidDepth.length > 0) {
    const bids = bidDepth[0] ? bidDepth[0][0] : null;
    const offers = askDepth[0] ? askDepth[0][0] : null;
    dataStructure = {
      origin: 'binance',
      pair: binance[data.s],
      bids,
      offers,
      seqNum
    };
    return JSON.stringify(dataStructure);
  }
  return null;
};

module.exports = {
  krakenStructure,
  keyRocksStructure,
  binanceStructure
};
