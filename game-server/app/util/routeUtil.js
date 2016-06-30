var exp = module.exports;
var dispatcher = require('./dispatcher');

/*exp.chat = function(session, msg, app, cb) {
	var chatServers = app.getServersByType('chat');

	if(!chatServers || chatServers.length === 0) {
		cb(new Error('can not find chat servers.'));
		return;
	}

	var res = dispatcher.dispatch(session.get('rid'), chatServers);

	cb(null, res.id);
};*/

exp.connmgr = function(session, msg, app, cb) {
	var connmgrServers = app.getServersByType('connmgr');

	if(!connmgrServers || connmgrServers.length === 0) {
		cb(new Error('can not find connmgr servers.'));
		return;
	}
    var rand = parseInt("" + (Math.abs(Math.acos(Math.random()) * 180 / Math.PI)));
	var res = dispatcher.dispatch(rand, connmgrServers);

	cb(null, 'connmgr-server-1');
};
