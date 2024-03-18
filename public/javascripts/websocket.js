// websocket.js
const calcRelation = (price1, price2, fee) => {
  const price1_num = parseFloat(price1.innerHTML || 0);
  const price2_num = parseFloat(price2.innerHTML || 0) * (1 + fee / 100);
  const total = price1_num !== 0 && price2_num !== 0 ? (price2_num / price1_num - 1) * 100 : 0;

  return total.toFixed(3);
};

const calcSpread = (cell_bids, cell_offer) => {
  const bid = parseFloat(cell_bids.innerHTML);
  const offer = parseFloat(cell_offer.innerHTML);
  const spread = bid !== 0 && offer !== 0 ? ((bid - offer) / bid) * 100 : 0;
  return spread.toFixed(3);
};

const updateTable = (data) => {
  const conuntKeyRock = document.getElementById(data.origin);
  conuntKeyRock.innerHTML = `Trx Count ${data.seqNum}`;
  const keyRockPriceBids = document.getElementById(`bids_keyrocks_${data.pair}`);
  const keyRockPriceOffer = document.getElementById(`offers_keyrocks_${data.pair}`);

  const cell_bids_name = `bids_${data.origin}_${data.pair}`;
  const cell_offer_name = `offers_${data.origin}_${data.pair}`;
  const cell_spread_name = `spread_${data.origin}_${data.pair}`;
  const compare_bind = `bids_keyrocks_${data.origin}_${data.pair}`;
  const compare_offer = `offers_keyrocks_${data.origin}_${data.pair}`;
  const cell_bids = document.getElementById(cell_bids_name);
  const cell_offer = document.getElementById(cell_offer_name);
  const cell_spread = document.getElementById(cell_spread_name);
  const cell_compare_bind = document.getElementById(compare_bind);
  const cell_compare_offer = document.getElementById(compare_offer);

  let fee = 0;
  if (data.origin === 'binance') fee = 0.08;
  if (data.origin === 'kraken') fee = 0.08;

  if (data.bids) cell_bids.innerHTML = `<td>${data.bids}</td>`;
  if (data.offers) cell_offer.innerHTML = `<td>${data.offers}</td>`;
  if (cell_spread) cell_spread.innerHTML = calcSpread(cell_bids, cell_offer);
  if (cell_compare_bind)
    cell_compare_bind.innerHTML = calcRelation(keyRockPriceBids, cell_bids, fee);
  if (cell_compare_offer)
    cell_compare_offer.innerHTML = calcRelation(keyRockPriceOffer, cell_offer, fee);
};

function launchWebSocket(path) {
  const options = {
    method: 'GET'
  };
  fetch(`/api/${path}`, options).then((res) => console.log(res));
}

function initWebSocket() {
  const ws = new WebSocket('ws://localhost:3000');

  ws.onmessage = (response) => {
    try {
      const data = JSON.parse(response.data);
      updateTable(data);
    } catch (error) {
      console.log('response fail', error.message, response.data);
    }
  };
}
