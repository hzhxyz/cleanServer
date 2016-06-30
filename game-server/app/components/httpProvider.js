var logger = require('pomelo-logger').getLogger(__filename);
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var utils = require('../util/utils');

module.exports = function(app,opts){
    return new httpProvider(app,opts);
};

var httpProvider = function(app,opts){
    this.app = app;
    this.opts = opts;
    this.server = new express();
    //this.client = http.createClient();
};

util.inherits(httpProvider, EventEmitter);
httpProvider.prototype.name = '__httpProvider__';

httpProvider.prototype.start = function(cb){
    logger.info('httpProvider start!');
    process.nextTick(cb);
};

httpProvider.prototype.afterStart = function(cb){
    logger.info('httpProvider afterStart!');
    process.nextTick(cb);
};

httpProvider.prototype.init = function(handler,cb){
    var self = this;
    self.handler = handler;
    self.server.use(bodyParser());
    self.server.listen(self.opts.port);
    handle(self);
    utils.invokeCallback(cb);
};

var handle = function(provider,cb){
    provider.server.post('/register',function(req,res,next){
        var body = req.body;
        res.set('Access-Control-Allow-Origin','*');
        res.set('content-Type','text/plain');
        res.status(200).send({});
        /*provider.handler.register(body,function(data){
            res.set('content-Type','text/plain');
            res.status(200).send(data);
        });*/
    });
    provider.server.post('/login',function(req,res,next){
        var body = req.body;
        res.set('Access-Control-Allow-Origin','*');
        res.set('content-Type','text/plain');
        res.status(200).send({});
        /*provider.handler.login(body,function(data){
            res.set('content-Type','text/plain');
            res.status(200).send(data);
        });*/
    });
    provider.server.use('/getCache',function(req,res,next){
        var query = utils.isBlank(req.query)?null:req.query;
        var params = utils.isBlank(req.params)?null:req.params;
        var body = utils.isBlank(req.body)?null:req.body;
        var args = query||params||body;
        res.set('Access-Control-Allow-Origin','*');
        provider.handler.getCache(args,function(data){
            res.set('content-Type','text/plain');
            res.status(200).send(data);
        });
    });
    provider.server.use('/getUser',function(req,res,next){
        var query = utils.isBlank(req.query)?null:req.query;
        var params = utils.isBlank(req.params)?null:req.params;
        var body = utils.isBlank(req.body)?null:req.body;
        var args = query||params||body;
        res.set('Access-Control-Allow-Origin','*');
        provider.handler.getUser(args,function(data){
            res.set('content-Type','text/plain');
            res.status(200).send(data);
        });
    });
    provider.server.use('/getRole',function(req,res,next){
        var query = utils.isBlank(req.query)?null:req.query;
        var params = utils.isBlank(req.params)?null:req.params;
        var body = utils.isBlank(req.body)?null:req.body;
        var args = query||params||body;
        res.set('Access-Control-Allow-Origin','*');
        provider.handler.getRole(args,function(data){
            res.set('content-Type','text/plain');
            res.status(200).send(data);
        });
    });
};
/*
* sanshengshi@shenhuo.co
 SSStlcABY
* */
httpProvider.prototype.request = function(host,hostname,port,route,data,cb){
    var self = this;
    if(data)
        data = qs.stringify(data);
    else
        data = [];
    var opt = {
        port:port,
        host:host,
        hostname:hostname,
        method:'POST',
        path:route,
        headers:{
            'Content-Type':'application/x-www-form-urlencoded',
            'Content-Length':data.length
        }
    };
    var req = http.request(opt,function(res){
        var d = null;
        res.on('data',function(data){
            d = data;
        });
        res.on('end',function(){
            utils.invokeCallback(cb,new String(d));
        });
    });
    req.write(data+'\n');
    req.end();
};

httpProvider.prototype.stop = function(force,cb){
    logger.info('httpProvider stop!');
    process.nextTick(cb);
};
