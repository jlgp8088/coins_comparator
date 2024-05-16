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
// const suscription = require('./routes/suscription');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar rutas
app.use('/', index);
app.use('/api', apiRoutes);
// app.use('/suscription', suscription);

launchKeyRock();
launchKraken();
launchBinance();

// WebSocket connection handling
wss.on('connection', (ws) => {
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

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor Express y WebSocket corriendo en el puerto ${PORT}`);
});
