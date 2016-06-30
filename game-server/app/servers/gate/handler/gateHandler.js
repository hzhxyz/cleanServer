var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var dispatcher = require('../../../util/dispatcher');
module.exports = function(app){
    return new Handler(app);
};
var Handler = function(app) {
    this.app = app;
};
var handler = Handler.prototype;

handler.on = function(msg,session,next){
    var route = msg.msg;
    var self = this;
    switch(route){
        case 'register':
            self.register(msg,session,next);
            return;
        case 'login':
            self.login(msg,session,next);
            return;
    }
};

/**
 * 注册
 * */
handler.register = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    self.app.rpc.user.dataRemote.getUser('1',msg.username,1,1,function(user){
        if(user){
            next(null,{
                msg:route,
                code:consts.code.E_HAS,
                data:null
            });
        }else{
            var u = {username:msg.username,password:msg.password,type:1};
            self.app.rpc.user.dataRemote.register('1',u,function(res){
                if(res){
                    u.id = res.insertId;
                    var key = u.username+'&'+u.type+'&'+ u.channelId;
                    self.app.rpc.user.dataRemote.addUser('1',key,u,function(user){
                        next(null,{
                            msg:route,
                            code:consts.code.SUCCESS,
                            data:null
                        });
                    });
                }else{
                    next(null,{
                        msg:route,
                        code:consts.code.E_DB,
                        data:null
                    });
                }
            });
        }
    });
};

/*
 * 用户登录
 * */
handler.login = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    self.app.rpc.user.dataRemote.getUser('1',msg.username,msg.type,msg.channelId,function(user){
        if(user){
            if(user.password===msg.password){
                var token = utils.MD5(Date.now()+''+Math.acos(Math.random())*180/Math.PI+user.id);
                self.app.rpc.user.dataRemote.addToken('1',user.id,token,function(){
                    var connectors = self.app.getServersByType("connector");
                    if(!connectors||connectors.length===0){
                        next(null,{
                            msg:route,
                            code:consts.code.E_SERVER,
                            data:null
                        });
                        return;
                    }
                    var con = dispatcher.dispatch(user.id,connectors);
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:{host:con.host,port:con.clientPort,uid:user.id,token:token}
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
            }
        }else{
            if(msg.type!=1&&msg.channelId!=1){
                var u = {username:msg.username,password:'',type:msg.type,channelId:msg.channelId};
                self.app.rpc.user.dataRemote.register('1',u,function(res){
                    if(res){
                        u.id = res.insertId;
                        var key = u.username+'&'+u.type+'&'+ u.channelId;
                        self.app.rpc.user.dataRemote.addUser('1',key,u,function(user){
                            var token = utils.MD5(Date.now()+''+Math.acos(Math.random())*180/Math.PI+user.id);
                            self.app.rpc.user.dataRemote.addToken('1',user.id,token,function(){
                                var connectors = self.app.getServersByType("connector");
                                if(!connectors||connectors.length===0){
                                    next(null,{
                                        msg:route,
                                        code:consts.code.E_SERVER,
                                        data:null
                                    });
                                    return;
                                }
                                var con = dispatcher.dispatch(uid,connectors);
                                next(null,{
                                    msg:route,
                                    code:consts.code.SUCCESS,
                                    data:{host:con.host,port:con.clientPort,uid:user.id,token:token}
                                });
                            });
                        });
                    }else{
                        next(null,{
                            msg:route,
                            code:consts.code.E_DB,
                            data:null
                        });
                    }
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
        }
    });
};
