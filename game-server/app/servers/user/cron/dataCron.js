var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var consts = require('../../../util/consts');
var persistData = require('../../../util/persistData');
module.exports = function(app) {
    return new Cron(app);
};
var Cron = function(app) {
    this.app = app;
};
var cron = Cron.prototype;

cron.persist = function(){
    persistData.persist();
};
