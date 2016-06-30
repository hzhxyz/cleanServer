var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var md5 = require('../../../util/md5');
module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;

handler.on = function(msg, session, next){
    var route = msg.msg;
    var self = this;
    switch(route){
        case 'connect':
            self.connect(msg,session,next);
            return;
    }
};

handler.connect = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    session.on(consts.events.CLOSED, onUserLeave.bind(null, self.app, session));
    self.app.rpc.user.dataRemote.getToken('1',msg.uid, function(token){
        if(token == msg.token){
            session.on(consts.events.CLOSED, onUserLeave.bind(null, self.app, session));
            self.app.rpc.user.dataRemote.addToChannel('1',msg.uid,self.app.get('serverId'),function(ok){
                if(ok){
                    self.app.rpc.user.dataRemote.cick('1',msg.uid,session.frontendId,session.id,function(){
                        self.app.rpc.user.dataRemote.getRoleByUser('1',msg.uid,function(role){
                            session.bind(msg.uid);
                            if(role){
                                session.set(consts.sys.RID,role.id);
                                session.push(consts.sys.RID);
                                next(null,{
                                    msg:route,
                                    code:consts.code.SUCCESS,
                                    data:{rid:role.id}
                                });
                            }else{
                                next(null,{
                                    msg:route,
                                    code:consts.code.SUCCESS,
                                    data:{rid:null}
                                });
                            }
                        });
                    });
                }else{
                    next(null,{
                        msg:route,
                        code:consts.code.E_SERVER,
                        data:null
                    });
                }
            });
        }else{
            next(null,{
                msg:route,
                code:consts.code.E_DATA,
                data:null
            });
        }
    });
};

/**
 * 用户断开长连接
 */
var onUserLeave = function(app, session){
    if(!session || !session.uid) {
        return;
    }
    var rid = session.get(consts.sys.RID);
    if(!!rid) {//TODO 移除用户的在线数据需要分别考虑
        /*dbRemote.removeRid(session,rid,function(){
         logger.info('从rids中删除角色id：',rid);
         });*/
    }
    app.rpc.user.dataRemote.leave('1',session.uid,function(){
        logger.info('用户退出频道成功！',session.uid);
        app.rpc.user.dataRemote.kick('1',session.uid,session.frontendId,session.id, null);
    });
};
