const { wrap } = require('./_adapter');
const handler = require('../../api/transcribe.js');

exports.handler = wrap(handler);
