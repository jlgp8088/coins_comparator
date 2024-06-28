const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const {
  router: apiRoutes,
  setServerKeyRocksWebSocket,
  setServerKrakenWebSocket,
  setServerBinanceWebSocket,
  launchKeyRock,
  launchKraken,
  launchBinance
} = require('./routes/apiRoutes');
const index = require('./routes/index');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });
const wssPair = new WebSocket.Server({ noServer: true });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar rutas
app.use('/', index);
app.use('/api', apiRoutes);

launchKeyRock();
launchKraken();
launchBinance();

const authenticate = (req, ws) => {
  const apiKey = req.headers['sec-websocket-protocol'];
  if (apiKey !== process.env.API_KEY) {
    ws.close(1008, 'Invalid API Key');
    console.log('Conexión rechazada debido a una API Key inválida.');
    return false;
  }
  return true;
};

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  if (!authenticate(req, ws)) return;
  console.log('Cliente conectado al WebSocket.');

  // Establecer el WebSocket del servidor en el manejador de rutas
  setServerKeyRocksWebSocket(ws);
  setServerKrakenWebSocket(ws);
  setServerBinanceWebSocket(ws);

  ws.on('message', (message) => {
    console.log(`Mensaje recibido: ${message}`);
    ws.send(`Recibí tu mensaje: ${message}`);
  });

  ws.on('close', () => {
    console.log('Cliente desconectado del WebSocket.');
  });
});

// WebSocket connection handling for  /pair
wssPair.on('connection', (ws, req) => {
  if (!authenticate(req, ws)) return;
  console.log('Open Socket Connection in /pair.');

  const krakenWebSocketUrl = process.env.KRAKEN_HOST;
  let krakenSocket = new WebSocket(krakenWebSocketUrl);
  let currentSymbol = null;
  let bids = []
  let offers = []

  const subscribeToKraken = (symbol) => {
    const subscribeMessage = JSON.stringify({
      method: "subscribe",
      params: {
        channel: "book",
        symbol: [symbol],
        snapshot: true
      }
    });
    krakenSocket.send(subscribeMessage);
  };

  const unsubscribeFromKraken = (symbol) => {
    const unsubscribeMessage = JSON.stringify({
      method: "unsubscribe",
      params: {
        channel: "book",
        symbol: [symbol]
      }
    });
    krakenSocket.send(unsubscribeMessage);
  };

  krakenSocket.on('open', () => {
    console.log('Open Socket Connection with provider in /pair.');
    currentSymbol = 'BTC/USDT';
    subscribeToKraken(currentSymbol);
  });

  krakenSocket.on('message', (message) => {
    if (message.toString('utf-8').search('data') > -1) {
      const response = JSON.parse(message.toString('utf-8'));

      if (response && response.channel == 'book' && response.data) {
        response.data.forEach(element => {
          element.bids.forEach(bid => {
            bids.push({
              price: bid.price,
              amount: bid.qty,
              total: bid.price * bid.qty
            });
          });

          element.asks.forEach(ask => {
            offers.push({
              price: ask.price,
              amount: ask.qty,
              total: ask.price * ask.qty
            });
          });
        });

        const order_bids = bids.sort((a, b) => b.total - a.total).slice(0, 5);
        const order_offers = offers.sort((a, b) => b.total - a.total).slice(0, 5);

        const final_response = {
          bids: order_bids,
          offers: order_offers,
        };

        ws.send(JSON.stringify(final_response)); 

      }
    }
  });

  krakenSocket.on('close', () => {
    console.log('Disconnected from websocket provider');
    ws.close(); 
  });

  krakenSocket.on('error', (error) => {
    console.error('Error in provider connection:', error);
    ws.close(); 
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket /pair.');
    krakenSocket.close(); 
  });

  ws.on('message', (message) => {
    try {
      const symbol = message.toString('utf-8');
      if (symbol) {
        
        if (currentSymbol) {
          unsubscribeFromKraken(currentSymbol);
        }
        
        currentSymbol = symbol;
        subscribeToKraken(currentSymbol);
      } else {
        ws.send('Invalid message');
      }
    } catch (error) {
      ws.send('Error to process message.');
    }
  });
});

// Manejo de la actualización del servidor para /pair
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === '/order_book') {
    wssPair.handleUpgrade(request, socket, head, (ws) => {
      wssPair.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor Express y WebSocket corriendo en el puerto ${PORT}`);
});
