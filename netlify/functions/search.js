const { wrap } = require('./_adapter');
const handler = require('../../api/search.js');

exports.handler = wrap(handler);
