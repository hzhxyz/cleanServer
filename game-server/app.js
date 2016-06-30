var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
var sync = require('pomelo-sync-plugin');
var fs = require('fs');
var consts = require('./app/util/consts');
var dataplugin = require('pomelo-data-plugin');
var httpProvider = require('./app/components/httpProvider');
var utils = require('./app/util/utils');
var loadData = require('./app/util/loadData');
var userFilter = require('./app/servers/user/filter/userFilter');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'server');

// app configure
app.configure('production|development', function() {
    // route configures
    //app.route('connmgr', routeUtil.connmgr);
    // filter configures
    app.filter(pomelo.timeout());

    app.set('proxyConfig', {
        cacheMsg: true,
        interval: 30,
        lazyConnection: true
        //enableRpcLog: true
    });

    // remote configures
    app.set('remoteConfig', {
        cacheMsg: true,
        interval: 30
    });

    app.use(dataplugin,{
        watcher:{
            dir: app.getBase() + '/../shared/config/template/',
            idx: 'id',
            interval: 3000
        }
    });

    /*
    var f = utils.readTemplate();
    for(var i in f){
        app.set(i,f[i]);
    }
    * */

    app.loadConfig('mysql', app.getBase() + '/../shared/config/mysql.json');
    app.filter(pomelo.filters.timeout());

    var dbclient = require('./app/dao/mysql/mysql').init(app);
    app.set(consts.sys.DBCLIENT, dbclient);
    app.load(httpProvider,{port:9080});
});

// app configuration
app.configure('production|development', 'connector', function(){
    app.set('connectorConfig',{
        connector : pomelo.connectors.hybridconnector,
        heartbeat : 30,
        useDict : true,
        useProtobuf : true
    });
});

app.configure('production|development', 'gate', function(){
    app.set('connectorConfig',{
        connector : pomelo.connectors.hybridconnector,
        heartbeat : 30,
        useDict : true,
        useProtobuf : true
    });
});

app.configure('production|development', 'user', function(){
    app.before(userFilter());
    loadData.loadAll();
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			useProtobuf : true
		});
});

app.configure('production|development', 'web', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			useProtobuf : true
		});
});

// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});