// websocket.js
const assingValue = (id, value, fee) => {
  const elements = document.querySelectorAll(`#${id}`);
  // console.log(elements);
  // Iterar sobre la lista de elementos y actualizar su contenido
  const total = parseFloat(value) * (1 + fee / 100);
  elements.forEach((element) => {
    element.innerHTML = total.toFixed(8);
  });
};

const dynamicRelationCalc = (base, compare) => {
  const cell_base = document.getElementById(base);
  const cell_compare = document.getElementById(compare);
  const cell_result = document.getElementById(`rel_${base}_${compare}`);
  const price1_num = parseFloat(cell_base.innerHTML || 0);
  const price2_num = parseFloat(cell_compare.innerHTML || 0);
  const total = price1_num !== 0 && price2_num !== 0 ? (price2_num / price1_num - 1) * 100 : 0;
  if (cell_result) cell_result.innerHTML = total.toFixed(3);
};
//spread_bids_kraken_BTC-USDT_offers_binance_BTC-USDT
//spread_bids_keyrocks_BTC-USDT_offers_binance_BTC-USDT
//spread_bids_keyrocks_BTC-EUR_offers_binance_BTC-EUR
//spread_bids_kraken_BTC-EUR_offers_binance_BTC-EUR
const dynamicSpreadCalc = (base, compare) => {
  const cell_base = document.getElementById(base);
  const cell_compare = document.getElementById(compare);
  const cell_result = document.getElementById(`spread_${base}_${compare}`);
  const base_value = parseFloat(cell_base.innerHTML || 0);
  const compare_value = parseFloat(cell_compare.innerHTML || 0);
  const spread =
    base_value !== 0 && compare_value !== 0
      ? ((compare_value - base_value) / compare_value) * 100
      : 0;
  if (spread > 0.2) {
    cell_result.classList.add('green');
  } else {
    cell_result.classList.remove('green');
  }
  cell_result.innerHTML = spread.toFixed(3);
};

const updateTable = (data) => {
  const conuntKeyRock = document.getElementById(data.origin);
  conuntKeyRock.innerHTML = `Trx Count ${data.seqNum}`;

  const cell_bids_name = `bids_${data.origin}_${data.pair}`;
  const cell_offer_name = `offers_${data.origin}_${data.pair}`;

  let fee = 0;
  if (data.origin === 'binance') fee = 0.08;
  if (data.origin === 'kraken') fee = 0.08;

  if (data.bids) assingValue(cell_bids_name, data.bids, fee);
  if (data.offers) assingValue(cell_offer_name, data.offers, fee);
  if (data.bids || data.offers) {
    // tabla comparativa principal
    dynamicRelationCalc(`bids_keyrocks_${data.pair}`, cell_bids_name);
    dynamicRelationCalc(`offers_keyrocks_${data.pair}`, cell_offer_name);
    dynamicSpreadCalc(cell_bids_name, cell_offer_name);

    //spred comparativos especificos
    dynamicSpreadCalc(`bids_keyrocks_${data.pair}`, `offers_binance_${data.pair}`);
    dynamicSpreadCalc(`offers_keyrocks_${data.pair}`, `bids_binance_${data.pair}`);

    dynamicSpreadCalc(`bids_keyrocks_${data.pair}`, `offers_kraken_${data.pair}`);
    dynamicSpreadCalc(`offers_keyrocks_${data.pair}`, `bids_kraken_${data.pair}`);

    dynamicSpreadCalc(`bids_binance_${data.pair}`, `offers_kraken_${data.pair}`);
    dynamicSpreadCalc(`offers_binance_${data.pair}`, `bids_kraken_${data.pair}`);
  }
};

function launchWebSocket(path) {
  const options = {
    method: 'GET'
  };
  fetch(`/api/${path}`, options).then((res) => console.log(res));
}

function initWebSocket() {
  const ws = new WebSocket('ws://depacomp.onrender.com');

  ws.onmessage = (response) => {
    try {
      const data = JSON.parse(response.data);
      updateTable(data);
    } catch (error) {
      //console.log('response fail', error.message, response.data);
    }
  };
}
