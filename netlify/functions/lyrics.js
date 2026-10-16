const { wrap } = require('./_adapter');
const handler = require('../../api/lyrics.js');

exports.handler = wrap(handler);
