'use strict';
module.exports = {
  ...require('./coordinator'),
  ...require('./contracts/result-codes'),
  ...require('./contracts/event'),
  intentEngine: require('./intent-engine'),
  content: require('./content/stage1-synthetic'),
};
