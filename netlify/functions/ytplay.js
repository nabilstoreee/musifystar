const { wrap } = require('./_adapter');
const handler = require('../../api/ytplay.js');

exports.handler = wrap(handler);
