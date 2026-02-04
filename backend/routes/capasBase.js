const express = require('express');
const router = express.Router();
const capasBase = require('../data/capasBase.json');

router.get('/', (req, res) => {
  res.json(capasBase);
});

module.exports = router;
