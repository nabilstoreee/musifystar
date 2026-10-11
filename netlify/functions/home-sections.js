const { wrap } = require('./_adapter');
const handler = require('../../api/home-sections.js');

exports.handler = wrap(handler);
