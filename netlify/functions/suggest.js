const { wrap } = require('./_adapter');
const handler = require('../../api/suggest.js');

exports.handler = wrap(handler);
