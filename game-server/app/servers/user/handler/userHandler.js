var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
module.exports = function(app) {
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
        case 'confirmRole':
            self.confirmRole(msg,session,next);
            return;
        case 'init':
            self.init(msg,session,next);
            return;
        case 'consumePass':
            self.consumePass(msg,session,next);
            return;
        case 'recoverPass':
            self.recoverPass(msg,session,next);
            return;
        case 'fillPass':
            self.fillPass(msg,session,next);
            return;
        case 'increasePass':
            self.increasePass(msg,session,next);
            return;
        case 'claimPass':
            self.claimPass(msg,session,next);
            return;
        case 'resPass':
            self.resPass(msg,session,next);
            return;
        case 'getFriends':
            self.getFriends(msg,session,next);
            return;
        case 'addFriend':
            self.addFriend(msg,session,next);
            return;
        case 'ensureFriend':
            self.ensureFriend(msg,session,next);
            return;
        case 'deleteFriend':
            self.deleteFriend(msg,session,next);
            return;
        case 'getFriendInfo':
            self.getFriendInfo(msg,session,next);
            return;
        case 'getUsers':
            self.getUsers(msg,session,next);
            return;
        case 'unlock':
            self.unlock(msg,session,next);
            return;
        case 'sendMsg':
            self.sendMsg(msg,session,next);
            return;
        case 'getEmails':
            self.getEmails(msg,session,next);
            return;
        case 'deleteEmail':
            self.deleteEmail(msg,session,next);
            return;
        case 'getMsgs':
            self.getMsgs(msg,session,next);
            return;
        case 'updateEmail':
            self.updateEmail(msg,session,next);
            return;
        case 'updateMsg':
            self.updateMsg(msg,session,next);
            return;
        case 'buy':
            self.buy(msg,session,next);
            return;
        case 'getRoleInfo':
            self.getRoleInfo(msg,session,next);
            return;
        default:
            next(null,{
                msg:route,
                code:consts.code.E_CHECK,
                data:null
            });
            return;
    }
};

/*
* 选择角色
* */
handler.confirmRole = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var uid = session.uid;
    if(msg.check==0){
        var type = msg.type;
        var rolename = msg.rolename;
        self.app.rpc.user.dataRemote.getRoleByUser('1',uid,function(or){
            if(or){
                next(null,{
                    msg:route,
                    code:consts.code.E_HAS,
                    data:null
                });
                return;
            }
            var uuid = utils.uuidCompact().replace(/-/g,'');
            var initbag = self.app.get(consts.schema.INITBAG);
            var initrole = utils.clone(consts.initrole);
            initrole.id = uuid;
            initrole.userId = uid;
            initrole.res = initbag;
            initrole.role.type = type;
            initrole.role.rolename = rolename;
            for(var i in initbag.stone){
                initrole.fightcfg.stone.push(i);
            }
            self.app.rpc.user.dataRemote.addRole('1',initrole,function(res){
                next(null,{
                    msg:route,
                    code:res,
                    data:null
                });
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 获取用户数据时，检查通行证恢复情况，并计算倒计时
 * */
var checkPass = function(role){
    var pass = role.pass;
    var now = Date.now();
    var diff = now - pass.pnutime;
    var r = parseInt(diff/consts.time.passtime);
    if(5<=r+pass.dressnum){
        pass.dressnum = 5;
    }else{
        pass.dressnum = pass.dressnum+r;
    }
    var pnut = 0;
    if(role.dressnum<5){
        pnut = Math.ceil((consts.time.passtime+r*consts.time.passtime-diff)/consts.time.second);
    }
    pass.pnutime = pass.pnutime+r*consts.time.passtime;
    role.pass = pass;
    role.role.pnut = pnut;
    return role;
};

/*
* 用户数据初始化
* */
handler.init = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            if(role){
                role = checkPass(role);
                var pnut = role.role.pnut;
                delete role.role.pnut;
                self.app.rpc.user.dataRemote.updateRole('1',role,function(res){
                    role.role.pnut = pnut;
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:role
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 用户使用通行证
* */
handler.consumePass = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var num = msg.num||1;
        self.app.rpc.user.dataRemote.changePass('1',rid,consts.changePass.CONSUME,num,function(res){
            next(null,{
                msg:route,
                code:res,
                data:null
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 用户恢复通行证
* */
handler.recoverPass = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var num = msg.num||1;
        self.app.rpc.user.dataRemote.changePass('1',rid,consts.changePass.RECOVER,num,function(res){
            next(null,{
                msg:route,
                code:res,
                data:null
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 用户填充通行证
* */
handler.fillPass = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var num = msg.num||1;
        self.app.rpc.user.dataRemote.changePass('1',rid,consts.changePass.FILL,num,function(res){
            next(null,{
                msg:route,
                code:res,
                data:null
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 用户向仓库添加通行证
* TODO 这个接口可以删除了吧
* */
handler.increasePass = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getRole('',rid,function(role){
            var item = role.res.item;
            item[consts.preid.PASS].num = item[consts.preid.PASS].num+msg.num;
            role.res.item = item;
            self.app.rpc.user.dataRemote.updateRole('1',role,function(res){
                if(res==consts.code.SUCCESS){
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:null
                    });
                }else{
                    next(null,{
                        msg:route,
                        code:res,
                        data:null
                    });
                }
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 用户索要通行证
* */
handler.claimPass = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getFriend('1',rid,msg.fid,function(friend){
            if(friend){
                self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
                    if(role){
                        var comment = {
                            id:rid,
                            rolename:role.role.rolename,
                            type:role.role.type
                        };
                        var inform = {
                            sender:rid,
                            receiver:msg.fid,
                            inform:comment,
                            type:consts.emailType.REQPASS,
                            stime:utils.formatDate(Date.now()),
                            attach:null
                        };
                        self.app.rpc.user.dataRemote.sendInform('1',inform,function(){
                            var obj = {msg:consts.events.REQPASS,code:consts.code.SUCCESS,data:{type:consts.events.REQPASS}};
                            self.app.rpc.user.dataRemote.pushMsg('1',consts.events.NEWEMAIL,obj,friend.userId,function(){
                                next(null,{
                                    msg:route,
                                    code:consts.code.SUCCESS,
                                    data:null
                                });
                            });
                        });
                    }else{
                        next(null,{
                            msg:route,
                            code:consts.code.E_NOTHAS,
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
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 对索要通行证的应答
* */
handler.resPass = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    var now = Date.now();
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getInform('1',msg.informId,rid,function(inform){
            if(inform){
                if(inform.sender==msg.fid&&inform.receiver==rid&&inform.r==consts.ny.N&&inform.type==consts.emailType.RESPASS){
                    self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
                        var item = role.res.item;
                        var it = item[consts.preid.PASS];
                        var inf = {id:rid,rolename:role.rolename,type:role.type,agree:msg.agree};
                        var ni = {sender:rid,receiver:msg.fid,type:consts.emailType.RESPASS,stime:utils.formatDate(now),inform:inf};
                        if(role){
                            var b = false;
                            var attach = [{res:consts.preid.ITEM,num:1,type:consts.preid.PASS}];
                            if(msg.agree){
                                if(it&&it.num>0){
                                    b = true;
                                    it.num = it.num-1;
                                    item[consts.preid.PASS] = it;
                                    role.res.item = item;
                                    self.app.rpc.user.dataRemote.updateRole('1',role,function(res){
                                        if(res==consts.code.SUCCESS){}
                                        else{
                                            logger.error('更新用户通行证信息失败：'+JSON.stringify(role));
                                            next(null,{
                                                msg:route,
                                                code:consts.code.E_DB,
                                                data:null
                                            });
                                            return;
                                        }
                                    });
                                }else{
                                    next(null,{
                                        msg:route,
                                        code:consts.code.E_NOTHAS,
                                        data:null
                                    });
                                    return;
                                }
                            }else{
                                attach = null;
                                b = true;
                            }
                            if(b){
                                inform.r = consts.ny.Y;
                                self.app.rpc.user.dataRemote.updateInform('1',inform,function(){
                                    ni.attach = attach;
                                    self.app.rpc.user.dataRemote.sendInform('1',ni,function(){
                                        self.app.rpc.user.dataRemote.getRole('1',msg.fid,function(friend){
                                            var obj = {msg:consts.events.RESPASS,code:consts.code.SUCCESS,data:{type:consts.events.RESPASS}};
                                            self.app.rpc.user.dataRemote.pushMsg('1',consts.events.NEWEMAIL,obj,friend.userId,function(){
                                                next(null,{
                                                    msg:route,
                                                    code:consts.code.SUCCESS,
                                                    data:null
                                                });
                                            });
                                        });
                                    });
                                });
                            }else{
                                logger.info('发送通行证索要邮件的回复邮件失败！'+JSON.stringify(ni));
                                next(null,{
                                    msg:route,
                                    code:consts.code.E_SERVER,
                                    data:null
                                });
                            }
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_NOTHAS,
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
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 获取好友列表
* */
handler.getFriends = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getFriends('1',rid,null,function(friends){
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:friends
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 添加好友
* */
handler.addFriend = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        if(msg.fid==rid){
            next(null,{
                msg:route,
                code:consts.code.E_DATA,
                data:null
            });
            return;
        }else{
            self.app.rpc.user.dataRemote.getFriend('1',rid,msg.fid,function(friend){
                if(friend){
                    next(null,{
                        msg:route,
                        code:consts.code.E_HAS,
                        data:null
                    });
                    return;
                }else{
                    self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
                        if(role){
                            self.app.rpc.user.dataRemote.getRole('1',msg.fid,function(friend){
                                if(!friend){
                                    next(null,{
                                        msg:route,
                                        code:consts.code.E_NOTHAS,
                                        data:null
                                    });
                                    return;
                                }
                                var inf = {id:role.id,rolename:role.rolename,type:role.type};
                                var inform = {stime:utils.formatDate(now),sender:rid,receiver:msg.fid,type:consts.emailType.REQFRIEND,inform:inf,attach:null};
                                self.app.rpc.user.dataRemote.sendInform('1',inform,function(){
                                    self.app.rpc.user.dataRemote.getRole('1',msg.fid,function(friend){
                                        var obj = {msg:consts.events.REQFRIEND,code:consts.code.SUCCESS,data:{type:consts.events.REQFRIEND}};
                                        self.app.rpc.user.dataRemote.pushMsg('1',consts.events.NEWEMAIL,obj,friend.userId,function(){});
                                    });
                                    next(null,{
                                        msg:route,
                                        code:consts.code.SUCCESS,
                                        data:null
                                    });
                                });
                            });
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_NOTHAS,
                                data:null
                            });
                        }
                    });
                }
            });
        }
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 好友请求应答
* */
handler.ensureFriend = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        var fid = msg.fid;
        var agree = msg.agree;
        var informId = msg.informId;
        self.app.rpc.user.dataRemote.getInform('1',informId,rid,function(inform){
            if(inform){
                if(inform.sender==fid&&inform.receiver==rid&&inform.type==consts.emailType.REQFRIEND&&inform.r==consts.ny.N){
                    if(agree){
                        self.app.rpc.user.dataRemote.getFriend('1',rid,fid,function(f){
                            if(!f){
                                self.app.rpc.user.dataRemote.addFriend('1',fid, rid, function(){
                                    self.app.rpc.user.dataRemote.getRole('1',rid, function(role){
                                        if(role){
                                            var comment = {
                                                id: role.id,
                                                rolename: role.rolename,
                                                type: role.type,
                                                agree: agree
                                            };
                                            var inf = {
                                                stime: utils.formatDate(now),
                                                sender: rid,
                                                receiver: fid,
                                                inform: comment,
                                                type: consts.emailType.RESFRIEND,
                                                attach:null
                                            };
                                            inform.r = consts.ny.Y;
                                            self.app.rpc.user.dataRemote.updateInform('1',inform,function(){
                                                self.app.rpc.user.dataRemote.sendInform('1',inf, function(){
                                                    self.app.rpc.user.dataRemote.getRole('1',fid, function(friend){
                                                        var obj = {
                                                            msg: consts.events.RESFRIEND,
                                                            code: 0,
                                                            data: {type: consts.events.RESFRIEND}
                                                        };
                                                        self.app.rpc.user.dataRemote.pushMsg('1',consts.events.NEWEMAIL,obj,friend.userId,function(){});
                                                        next(null,{
                                                            msg: route,
                                                            code: consts.code.SUCCESS,
                                                            data: null
                                                        });
                                                    });
                                                });
                                            });
                                        } else {
                                            next(null, {
                                                msg: route,
                                                code: consts.code.E_NOTHAS,
                                                data: null
                                            });
                                        }
                                    });
                                });
                            } else {
                                next(null, {
                                    msg: route,
                                    code: consts.code.E_HAS,
                                    data: null
                                });
                            }
                        });
                    }else{
                        self.app.rpc.user.dataRemote.getRole('1',rid, function(role){
                            if(role){
                                var comment = {id: role.id, rolename: role.rolename, type: role.type, agree: agree};
                                var inf = {
                                    stime: utils.invokeCallback(now),
                                    sender: rid,
                                    receiver: fid,
                                    inform: comment,
                                    type: consts.emailType.RESFRIEND,
                                    attach:null
                                };
                                self.app.rpc.user.dataRemote.sendInform('1',inf, function(){
                                    self.app.rpc.user.dataRemote.getRole('1',fid, function(friend){
                                        var obj = {
                                            msg: consts.events.RESFRIEND,
                                            code: 0,
                                            data: {type: consts.events.RESFRIEND}
                                        };
                                        self.app.rpc.user.dataRemote.pushMsg('1',consts.events.NEWEMAIL,obj,friend.userId,function(){});
                                        next(null,{
                                            msg: route,
                                            code: consts.code.SUCCESS,
                                            data: null
                                        });
                                    });
                                });
                            }else{
                                next(null, {
                                    msg: route,
                                    code: consts.code.E_NOTHAS,
                                    data: null
                                });
                            }
                        });
                    }
                }
            }
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 删除好友
* */
handler.deleteFriend = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        self.app.rpc.user.dataRemote.deleteFriend('1',rid,msg.fid,function(){
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:null
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 获取好友信息
* */
handler.getFriendInfo = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getFriend('1',rid,msg.fid,function(friend){
            if(friend){
                var f = {
                    id:friend.id,
                    type:friend.role.type,
                    rolename:friend.role.rolename,
                    grade:friend.role.grade,
                    atk:friend.role.atk,
                    level:friend.role.level,
                    plunder:consts.ny.Y
                };
                var plunder = friend.plunder;
                if(plunder.stime&&utils.timediff(now,plunder.stime)<20*60*1000){
                    f.plunder = consts.ny.N;
                }
                f.friends = [];
                self.app.rpc.user.dataRemote.getFriends('1',msg.fid,rid,function(friends){
                    if(friends){
                        f.friends = friends;
                    }
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:f
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 获取用户列表，如果可能，返回的是好友列表
* */
handler.getUsers = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    if(msg.check==0){
        var users = {
            friends:[],
            roles:[]
        };
        if(utils.isBlank(msg.rolename)){
            self.app.rpc.user.dataRemote.getFriends('1',rid,null,function(friends){
                users.friends = friends;
                next(null,{
                    msg:route,
                    code:consts.code.SUCCESS,
                    data:users
                });
            });
            return;
        }else{
            self.app.rpc.user.dataRemote.getFriends('1',rid,null,function(friends){
                var exist = [rid];
                if(friends){
                    for(var i = 0; i < friends.length; i++){
                        var f = friends[i];
                        if(f.rolename.indexOf(msg.rolename)!=-1){
                            exist.push(f.id);
                            users.friends.push(f);
                        }
                    }
                }
                self.app.rpc.user.dataRemote.getRoleByName('1',msg.rolename,exist,function(roles){
                    users.roles = roles;
                    next(null, {
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:users
                    });
                });
            });
        }
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 添加背包或者宠物园空间
* */
handler.unlock = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        var type = msg.type;
        var num = msg.num;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var item = role.res.item;
            var it = item[type];
            if(it&&it.num>=num){
                it.num = it.num - num;
                if(it.num==0){
                    delete item[type];
                }else{
                    item[msg.type] = it;
                }
                role.res.item = item;
                switch(type){
                    case '0014':
                        role.bag.material = role.bag.material + num;
                        break;
                    case '0016':
                        role.bag.item = role.bag.item + num;
                        break;
                    case '0017':
                        role.bag.rune = role.bag.rune + num;
                        break;
                    case '0015':
                        role.bag.stone = role.bag.stone + num;
                        break;
                    case '0018':
                        role.bag.pet = role.bag.pet + num;
                        break;
                }
                self.app.rpc.user.dataRemote.updateRole('1',role, function(){
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:null
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 发送密信
* */
handler.sendMsg = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        var fid = msg.fid;
        var msg = msg.msg;
        self.app.rpc.user.dataRemote.getRole('1',fid,function(friend){
            if(friend){
                var id = utils.uuidCompact().replace(/-/g,'');
                var message = {id:id,message:msg,sender:rid,receiver:fid,r:consts.ny.N,stime:utils.formatDate(now)};
                self.app.rpc.user.dataRemote.sendMessage('1',message,function(){
                    var obj = {msg:consts.events.MSG,code:consts.code.SUCCESS,data:message};
                    self.app.rpc.user.dataRemote.pushMsg('1',consts.events.MSG,obj,friend.userId,function(){
                        next(null,{
                            msg:route,
                            code:consts.code.SUCCESS,
                            data:null
                        });
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 获取邮件
* */
handler.getEmails = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getInforms('1',rid,function(informs){
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:informs
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 删除邮件
* */
handler.deleteEmail = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    if(msg.check==0){
        self.app.rpc.user.dataRemote.deleteInform('1',msg.informId,rid,function(){
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:null
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 获取所有密信
* */
handler.getMsgs = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getMessages('1',rid,function(messages){
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:messages
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 更新邮件状态
* */
handler.updateEmail = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getInform('1',msg.msgId,rid,function(inform){
            if(inform){
                for(var i in msg){
                    inform[i] = msg[i];
                }
                self.app.rpc.user.dataRemote.updateInform('1',inform,function(){
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:null
                    });
                });
            }
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/*
* 更新消息状态
* //TODO 有逻辑问题需要修正，不建议使用
* */
handler.updateMsg = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var now = Date.now();
    if(msg.check==0){
        self.app.rpc.user.dataRemote.updateMessages('1',rid,msg.fid,function(){
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:null
            });
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 获取角色在资料页的数据
 * */
handler.getRoleInfo = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
        if(role){
            var info = {role:null,pet:null,fightcfg:{stone:[]}};
            info.role = role.role;
            var pet = role.res.pet;
            for(var i in pet){
                if(pet[i].dispatch==consts.ny.Y){
                    info.pet = pet[i];
                    break;
                }
            }
            var fms = role.fightcfg.stone;
            for(var i in fms){
                if(fms[i].isequip==consts.ny.Y){
                    info.fightcfg.stone.push(fms[i]);
                }
            }
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:info
            });
        }else{
            next(null,{
                msg:route,
                code:consts.code.E_DB,
                data:role
            });
        }
    });
};

/**
 * 用户使用元素币购买物品
 * （一次购买一种物品）
 * */
handler.buy = function(msg,session,next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var self = this;
    var res = msg.res;
    var type = msg.type;
    var num = msg.num;
    self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
        var gold = role.role.gold;
        utils.getItem(consts.schema.MALL,res+''+type,self,function(item){
            if(item){
                var sum = num*parseInt(item.realPrice);
                if(sum>gold){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }
                gold = gold - sum;
                role.role.gold = gold;
                self.app.rpc.user.dataRemote.updateRole('1',role,function(res){
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:null
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
            }
        });
    });
};
