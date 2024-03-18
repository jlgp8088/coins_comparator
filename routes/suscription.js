const express = require('express');
const router = express.Router();
const { addWebSocket, getWebSocket } = require('./../db/dbMethods');

router.post('/suscribe', async (req, res) => {
  console.log(JSON.stringify(req));
  const { coinpair } = req.body;
  const payload = {
    id: 'id_webhook',
    state: true,
    client: 1
  };
  const response = await addWebSocket({ coinpair, payload });
  res.send(response);
});

router.get('/:coinPair', async (req, res) => {
  const coinPair = req.params.coinPair;
  const response = await getWebSocket(coinPair);
  res.send(response);
});

module.exports = router;
