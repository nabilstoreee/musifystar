const { wrap } = require('./_adapter');
const handler = require('../../api/artist.js');

exports.handler = wrap(handler);
