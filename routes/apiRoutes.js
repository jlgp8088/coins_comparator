// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const crypto = require('crypto');
const base64url = require('base64url');
const {
  krakenStructure,
  keyRocksStructure,
  binanceStructure
} = require('./../utils/dataStructure');
const binance = require('./../api/binance');

// Manejador de eventos para WebSocket propio del servidor
let serverKeyRocksWebSocket;
let serverKrakenWebSocket;
let serverBinanceWebSocket;
var globalIsWebSocketOpen = false;
// Endpoint para manejar la solicitud de datos
router.get('/keyrock', (req, res) => {
  const api_key = 'KEYFSB7WV4CQ';
  const api_secret = 'ljv7d5klkp51cqcmgrsse8or94e5yltn';
  const host = 'test-otc.keyrock.com'; // Por determinar, por ejemplo
  const path = '/ws/v1';
  const utc_now = new Date().toISOString();
  const utcDateTime = utc_now.slice(0, -5) + '.000000Z';

  const params = ['GET', utcDateTime, host, path].join('\n');

  // Función para calcular la firma
  const hmac = crypto.createHmac('sha256', api_secret);
  hmac.update(params);
  let signature = base64url.encode(hmac.digest());
  if (signature.length % 4 !== 0) {
    signature += '='.repeat(4 - (signature.length % 4));
  }

  // console.log('signature', signature)

  const externalDataProviderCrypto = new WebSocket(`wss://${host}${path}`, {
    headers: {
      ApiKey: api_key,
      ApiSign: signature,
      ApiTimestamp: utcDateTime
    }
  });

  externalDataProviderCrypto.on('open', () => {
    console.log('Conexión establecida con el proveedor externo.');

    // Enviar solicitud de datos al proveedor externo

    externalDataProviderCrypto.send(
      '{"reqid": 5,"type": "subscribe","streams": [{"name": "MarketDataSnapshot","Symbol": "BTC-USDT"}, {"name": "MarketDataSnapshot","Symbol": "BTC-EUR"}, {"name": "MarketDataSnapshot","Symbol": "USDT-EUR"}] }'
    );
  });

  externalDataProviderCrypto.on('message', (data) => {
    const info = keyRocksStructure(data);
    // Enviar datos al WebSocket propio del servidor
    if (serverKeyRocksWebSocket && info) {
      serverKeyRocksWebSocket.send(info);
    }
  });

  externalDataProviderCrypto.on('error', function (error) {
    console.error('Error en la conexión WebSocket:', error);
  });

  externalDataProviderCrypto.on('close', () => {
    console.log('Conexión cerrada con el proveedor externo.');
  });

  res.send('Keyrocks online');
});

router.get('/kraken', (req, res) => {
  var websocketurl = 'wss://ws.kraken.com/';

  //Create the WebSocket object (web socket echo test service provided by websocket.org)
  socket = new WebSocket(websocketurl);

  //This function is called when the websocket connection is opened
  socket.onopen = function () {
    console.log('Connected! :)');
    globalIsWebSocketOpen = true;
    globalCountKraken = 0;
    if (globalIsWebSocketOpen) {
      var message =
        '{"event":"subscribe", "subscription":{"name":"trade"}, "pair":["BTC/USDT", "BTC/EUR", "USDT/EUR"]}';

      if (message !== '') {
        socket.send(message);
      } else {
        alert('You must enter a WebSocket message to be sent!');
      }
    } else {
      alert('Open Socket Connection First!');
    }
  };

  //This function is called when the websocket connection is closed
  socket.onclose = function () {
    console.log('Disconnected from the websocket server at: ' + websocketurl);
    globalIsWebSocketOpen = false;
  };

  //This function is called when the websocket receives a message. It is passed the message object as its only parameter
  socket.onmessage = function (message) {
    globalCountKraken++;
    dataStructure = krakenStructure(message.data, globalCountKraken);
    if (serverKrakenWebSocket && dataStructure) {
      serverKrakenWebSocket.send(dataStructure);
    }
  };
  res.send('kraken online');
});

router.get('/binance', (req, res) => {
  let globalCountBinance = 0;

  binance.websockets.depth(['BTCUSDT', 'BTCEUR', 'EURUSDT'], (depth) => {
    // let { e: eventType, E: eventTime, s: symbol, u: updateId, b: bidDepth, a: askDepth } = depth;
    // console.info(symbol + ' market depth update');
    // console.info(bidDepth, askDepth);
    globalCountBinance++;
    data = binanceStructure(depth, globalCountBinance);
    if (serverBinanceWebSocket) {
      serverBinanceWebSocket.send(data);
    }
  });
  res.send('Binance corriendo');
});

// Función para establecer la conexión WebSocket del servidor
function setServerKeyRocksWebSocket(ws) {
  serverKeyRocksWebSocket = ws;
}

function setServerKrakenWebSocket(ws) {
  serverKrakenWebSocket = ws;
}

function setServerBinanceWebSocket(ws) {
  serverBinanceWebSocket = ws;
}

module.exports = {
  router,
  setServerKeyRocksWebSocket,
  setServerKrakenWebSocket,
  setServerBinanceWebSocket
};
