var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var dispatcher = require('../../../util/dispatcher');
var dataRemote = require('../../user/remote/dataRemote');
module.exports = function(app){
    return new Handler(app);
};
var Handler = function(app) {
    this.app = app;
    var hp = app.components.__httpProvider__;
    hp.init(this);
    this.hp = hp;
};
var handler = Handler.prototype;

/**
 * 注册
 * */
handler.register = function(msg, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getUser('1',msg.username,0,function(user){
            if(user){
                next({
                    msg:route,
                    code:consts.code.E_HAS,
                    data:null
                });
            }else{
                var u = {username:msg.username,password:msg.password,type:0};
                self.app.rpc.user.dataRemote.register('1',u,function(res){
                    if(res){
                        u.id = res.insertId;
                        var key = u.username+'&'+u.type;
                        self.app.rpc.user.dataRemote.addUser('1',key,u,function(user){
                            next({
                                msg:route,
                                code:consts.code.SUCCESS,
                                data:null
                            });
                        });
                    }else{
                        next({
                            msg:route,
                            code:consts.code.E_DB,
                            data:null
                        });
                    }
                });
            }
        });
    }else{
        next({
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
 * 用户登录
 * */
handler.login = function(msg,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getUser('1',msg.username,msg.type,msg.channelId,function(user){
            if(user){
                if(user.password===msg.password){
                    var token = utils.MD5(Date.now()+''+Math.acos(Math.random())*180/Math.PI+user.id);
                    self.app.rpc.user.dataRemote.addToken('1',user.id,token,function(){});
                    var connectors = self.app.getServersByType("connector");
                    if(!connectors||connectors.length===0){
                        next({
                            msg:route,
                            code:consts.code.E_SERVER,
                            data:null
                        });
                        return;
                    }
                    var con = dispatcher.dispatch(uid,connectors);
                    next({
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:{host:con.host,port:con.clientPort,uid:user.id,token:token}
                    });
                }else{
                    next({
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                }
            }else{
                if(msg.type!=0&&msg.channelId!=0){
                    var u = {username:msg.username,password:'',type:msg.type,channelId:msg.channelId};
                    self.app.rpc.user.dataRemote.register(u,function(res){
                        if(res){
                            u.id = res.insertId;
                            var key = u.username+'&'+u.type;
                            self.app.rpc.user.dataRemote.addUser('1',key,u,function(user){
                                var token = utils.MD5(Date.now()+''+Math.acos(Math.random())*180/Math.PI+user.id);
                                self.app.rpc.user.dataRemote.addToken('1',user.id,token,function(){});
                                var connectors = self.app.getServersByType("connector");
                                if(!connectors||connectors.length===0){
                                    next({
                                        msg:route,
                                        code:consts.code.E_SERVER,
                                        data:null
                                    });
                                    return;
                                }
                                var con = dispatcher.dispatch(uid,connectors);
                                next({
                                    msg:route,
                                    code:consts.code.SUCCESS,
                                    data:{host:con.host,port:con.clientPort,uid:user.id,token:token}
                                });
                            });
                        }else{
                            next({
                                msg:route,
                                code:consts.code.E_DB,
                                data:null
                            });
                        }
                    });
                }else{
                    next({
                        msg:route,
                        code:consts.code.E_NOTHAS,
                        data:null
                    });
                }
            }
        });
    }else{
        next({
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

handler.getCache = function(msg,next){
    var tab = msg.tab;
    var self = this;
    self.app.rpc.user.dataRemote.getCache('1',tab,function(cache){
        next(cache);
    });
};

handler.getUser = function(msg,next){
    var uid = msg.uid;
    var self = this;
    self.app.rpc.user.dataRemote.getUserById('1',uid,function(user){
        next(user);
    });
};

handler.getRole = function(msg,next){
    var uid = msg.uid;
    var self = this;
    self.app.rpc.user.dataRemote.getRoleByUser('1',uid,function(role){
        next(role);
    });
};

//hamdler
