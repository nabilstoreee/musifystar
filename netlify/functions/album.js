const { wrap } = require('./_adapter');
const handler = require('../../api/album.js');

exports.handler = wrap(handler);
