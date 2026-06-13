const express = require('express');
const { getSharedDocument } = require('../controllers/share.controller');

const router = express.Router();

router.get('/:token', getSharedDocument);

module.exports = router;
