const { wrap } = require('./_adapter');
const handler = require('../../api/translate.js');

exports.handler = wrap(handler);
