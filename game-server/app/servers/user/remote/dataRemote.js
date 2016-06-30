var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var dao = require('../../../dao/dao');
var scheduler = require('pomelo-scheduler');
var loadData = require('../../../util/loadData');
module.exports = function(app){
    return new dataRemote(app);
};

var dataRemote = function(app) {
    this.app = app;
};

var remote = dataRemote.prototype;

/*
* 注册
* */
remote.register = function(user,cb){
    dao.insert(consts.table.USER,user,function(res){
        if(res){
            utils.invokeCallback(cb,res);
        }else{
            utils.invokeCallback(cb,null);
        }
    });
};

/*
* 获取用户
* */
remote.getUser = function(name,type,channelId,cb){
    var users = this.app.get(consts.cache.USER);
    var tmp = null;
    for(var i in users){
        var user = users[i];
        if(user.username==name&&user.type==type&&user.channelId==channelId&&user.status!=consts.crud.D){
            tmp = utils.clone(user);
            break;
        }
    }
    if(cb){
        utils.invokeCallback(cb,user);
    }else{
        return user;
    }
};

/*
* 更新用户
* */
remote.addUser = function(key,user,cb){
    user.status = consts.crud.R;
    var users = this.app.get(consts.cache.USER);
    users[key] = user;
    this.app.set(consts.cache.USER,users);
    utils.invokeCallback(cb,user);
};

/*
* 根据用户获取角色
* */
remote.getRoleByUser = function(uid,cb){
    var roles = this.app.get(consts.cache.ROLE);
    var tmp = null;
    for(var i in roles){
        if(roles[i].userId==uid&&roles[i].status!=consts.crud.D){
            tmp = utils.clone(roles[i]);
            if(cb){
                utils.invokeCallback(cb,roles[i]);
                return;
            }else{
                return roles[i];
            }
        }
    }
    if(cb){
        utils.invokeCallback(cb,null);
        return;
    }else{
        return null;
    }
};

/*
* 根据角色名获取角色
* */
remote.getRoleByName = function(rolename,exist,cb){
    var roles = this.app.get(consts.cache.ROLE);
    var tmp = [];
    if(exist){
        for(var i in roles){
            var b = false;
            if(roles[i].status!=consts.crud.D&&roles[i].role.rolename.indexOf(rolename)!=-1){
                for(var j = 0; j < exist.length; j++){
                    if(exist[j]==roles[i].id){
                        b = true;
                        break;
                    }
                }
                if(b){
                    continue;
                }
                var r = getFriendInfo(roles[i]);
                tmp.push(r);
            }
        }
    }else{
        for(var i in roles){
            if(roles[i].status!=consts.crud.D&&roles[i].role.rolename.indexOf(rolename)!=-1){
                var r = getFriendInfo(roles[i]);
                tmp.push(r);
            }
        }
    }
    utils.invokeCallback(cb,tmp);
};

/*
* 添加角色
* */
remote.addRole = function(role,cb){
    var self = this;
    var r = utils.clone(role);
    for(var i in r){
        if(i=='id'||i=='userId'){
            continue;
        }
        r[i] = JSON.stringify(r[i]);
    }
    dao.insert(consts.table.ROLE,r,function(res){
        if(res){
            var roles = self.app.get(consts.cache.ROLE);
            roles[role.id] = role;
            self.app.set(consts.cache.ROLE,roles);
            utils.invokeCallback(cb,consts.code.SUCCESS);
        }else{
            utils.invokeCallback(cb,consts.code.E_DB);
        }
    });
};

var getRole = function(rid,thisobj){
    var roles = thisobj.app.get(consts.cache.ROLE);
    var role = roles[rid];
    if(role.status!=consts.crud.D){
        var tmp = utils.clone(role);
        return role;
    }
    return role;
};

/*
* 获取角色信息
* */
remote.getRole = function(rid,cb){
    var roles = this.app.get(consts.cache.ROLE);
    var role = roles[rid];
    var tmp = null;
    if(role&&role.status!=consts.crud.D){
        tmp = utils.clone(role);
    }
    if(cb){
        utils.invokeCallback(cb,tmp);
    }else{
        return tmp;
    }
};

/*
* 更新角色信息
* */
remote.updateRole = function(role,cb){
    role.status = consts.crud.U;
    var roles = this.app.get(consts.cache.ROLE);
    var r = roles[role.id];
    if(r){
        for(var i in role){
            r[i] = role[i];
        }
        roles[role.id] = r;
        this.app.set(consts.cache.ROLE,roles);
        logger.info('更新角色信息：'+JSON.stringify(role));
        if(cb){
            utils.invokeCallback(cb,consts.code.SUCCESS);
        }else{
            return consts.code.SUCCESS;
        }
    }else{
        logger.info('更新角色信息失败：'+JSON.stringify(role));
        if(cb){
            utils.invokeCallback(cb,consts.code.E_NOTHAS);
        }else{
            return consts.code.E_NOTHAS;
        }
    }
};

/**
 * 通行证变更
 * type:
 * 1,消耗；2,恢复；3,填充
 * */
remote.changePass = function(rid,type,num,cb){
    var roles = this.app.get(consts.cache.ROLE);
    var role = roles[rid];
    var pass = role.pass;
    if(type==consts.changePass.CONSUME){//消耗
        if(pass.dressnum<1){
            if(cb){
                utils.invokeCallback(cb,consts.code.E_DATA);
                return;
            }else{
                return consts.code.E_DATA;
            }
        }else{
            var pnutime = pass.pnutime;
            if(pass.dressnum==5){
                pass.pnutime = Date.now();
            }
            pass.dressnum = pass.dressnum - 1;
            role.pass = pass;
            roles[rid] = role;
            role.status = consts.crud.U;
            this.app.set(consts.cache.ROLE,roles);
            if(cb){
                utils.invokeCallback(cb,consts.code.SUCCESS);
                return;
            }else{
                return consts.code.SUCCESS;
            }
        }
    }else if(type==consts.changePass.RECOVER){
        var now = Date.now();
        if(pass.dressnum==5){
            if(cb){
                utils.invokeCallback(cb,consts.code.E_DATA);
                return;
            }else{
                return consts.code.E_DATA;
            }
        }else{
            var pnutime = pass.pnutime;
            if(now-new Date(pnutime).getTime()<consts.sys.PT*consts.time.minute-1000){
                if(cb){
                    utils.invokeCallback(cb,consts.code.E_DATA);
                    return;
                }else{
                    return consts.code.E_DATA;
                }
            }
            pass.dressnum = pass.dressnum+1;
            pass.pnutime = now;
            role.pass = pass;
            roles[rid] = role;
            role.status = consts.crud.U;
            this.app.set(consts.code.ROLE,roles);
            if(cb){
                utils.invokeCallback(cb,consts.code.SUCCESS);
                return;
            }else{
                return consts.code.SUCCESS;
            }
        }
    }else if(type==consts.changePass.FILL){
        var item = role.res.item;
        item[consts.preid.PASS].num = item[consts.preid.PASS].num-num;
        if(!item[consts.preid.PASS]||item[consts.preid.PASS].num<0){
            item[consts.preid.PASS].num = item[consts.preid.PASS].num+num;
            if(cb){
                utils.invokeCallback(cb,consts.code.E_DATA);
                return;
            }else{
                return consts.code.E_DATA;
            }
        }
        pass.dressnum = pass.dressnum+num;
        if(pass.dressnum>5){
            pass.dressnum = pass.dressnum-num;
            if(cb){
                utils.invokeCallback(cb,consts.code.E_DATA);
                return;
            }else{
                return consts.code.E_DATA;
            }
        }else{
            if(pass.dressnum==5){
                pass.pnutime = Date.now();
            }
            if(item[consts.preid.PASS].num==0){
                delete item[consts.preid.PASS];
            }
            role.res.item = item;
            role.pass = pass;
            role.status = consts.crud.U;
            roles[rid] = role;
            this.app.set(consts.code.ROLE,roles);
            if(cb){
                utils.invokeCallback(cb,consts.code.SUCCESS);
                return;
            }else{
                return consts.code.SUCCESS;
            }
        }
    }
};

var getFriendInfo = function(friend){
    var b = consts.ny.N;
    var plunder = friend.plunder;
    if(plunder.stime&&utils.timediff(Date.now(),plunder.stime)>20*60*1000){
        b = consts.ny.Y;
    }
    var r = {
        id:friend.id,
        type:friend.role.type,
        rolename:friend.role.rolename,
        level:friend.role.level,
        grade:friend.role.grade,
        atk:friend.role.atk,
        plunder:b
    };
    return r;
};

/*
* 获取好友信息
* */
remote.getFriend = function(rid,fid,cb){
    var friends = this.app.get(consts.cache.FRIENDS);
    var f = friends[rid];
    if(!utils.isBlank(f)){
        for(var i in f){
            if(i==fid){
                this.getRole(fid,function(role){
                    var r = getFriendInfo(role);
                    utils.invokeCallback(cb,r);
                });
                return;
            }
        }
    }
    utils.invokeCallback(cb,null);
};

/*
* 删除好友
* */
remote.deleteFriend = function(rid,fid,cb){
    var friends = this.app.get(consts.cache.FRIENDS);
    var friend = this.app.get(consts.cache.FRIEND);
    var f1 = friends[rid];
    var f2 = friends[fid];
    var id = null;
    if(f1[fid]&&f2[rid]){
        id = f1[fid].id;
        delete f1[fid];
        delete f2[rid];
        friends[rid] = f1;
        friends[fid] = f2;
    }else{}
    if(id){
        friend[id].status = consts.crud.D;
        this.app.set(consts.cache.FRIEND,friend);
    }
    utils.invokeCallback(cb);
};

/*
* 获取好友列表
* */
remote.getFriends = function(rid,fid,cb){
    var friends = this.app.get(consts.cache.FRIENDS);
    var f = friends[rid];
    if(!utils.isBlank(f)){
        var fs = [];
        for(var i in f){
            if(i==fid){
                continue;
            }
            var role = this.getRole(i);
            var r = getFriendInfo(role);
            fs.push(r);
        }
        utils.invokeCallback(cb,fs);
    }else{
        utils.invokeCallback(cb,null);
    }
};

/*
* 保存通知
* */
remote.sendInform = function(inform,cb){
    var self = this;
    inform.stime = utils.formatDate(inform.stime);
    var informs = this.app.get(consts.cache.INFORMS);
    var infs = this.app.get(consts.cache.INFORM);
    inform.status = consts.crud.C;
    var uuid = utils.uuidCompact().replace(/-/g,'');
    inform.id = uuid;
    infs[inform.id] = inform;
    var receivers = informs[inform.receiver];
    if(!receivers){
        receivers = {};
    }
    receivers[inform.id] = inform;
    informs[inform.receiver] = receivers;
    this.app.set(consts.cache.INFORMS,informs);
    this.app.set(consts.cache.INFORM,infs);
    utils.invokeCallback(cb);
};

/*
* 获取一封通知
* */
remote.getInform = function(id,receiver,cb){
    var informs = this.app.get(consts.cache.INFORMS);
    var infs = informs[receiver];
    var tmp = null;
    if(infs){
        var inf = infs[id];
        tmp = utils.clone(inf);
    }
    if(cb){
        utils.invokeCallback(cb,tmp);
        return;
    }else{
        return tmp;
    }
};

/*
* 更新通知状态
* */
remote.updateInform = function(inf,cb){
    inf.status = consts.crud.U;
    inf.stime = utils.formatDate(inf.stime);
    var informs = this.app.get(consts.cache.INFORMS);
    var inform = this.app.get(consts.cache.INFORM);
    var infs = informs[inf.receiver];
    infs[inf.id] = inf;
    informs[inf.receiver] = infs;
    inform[inf.id] = inf;
    this.app.set(consts.cache.INFORM,inform);
    this.app.set(consts.cache.INFORMS,informs);
    if(cb){
        utils.invokeCallback(cb);
    }else{
        return;
    }
};

/*
* 获取用户的通知
* */
remote.getInforms = function(rid,cb){
    var informs = this.app.get(consts.cache.INFORMS);
    var infs = informs[rid];
    if(infs){
        var tmp = utils.clone(infs);
        tmp.stime = utils.formatDate(tmp.stime);
        utils.invokeCallback(cb,tmp);
    }else{
        utils.invokeCallback(cb,null);
    }
};

/*
* 删除邮件
* */
remote.deleteInform = function(id,rid,cb){
    var informs = this.app.get(consts.cache.INFORMS);
    var infs = informs[rid];
    if(infs){
        var inf = infs[id];
        if(inf){
            delete infs[id];
            var inform = this.app.get(consts.cache.INFORM);
            var info = inform[id];
            if(info){
                info.status = consts.crud.D;
                inform[id] = info;
                this.app.set(consts.cache.INFORM,inform);
            }
        }
    }else{}
    utils.invokeCallback(cb);
};

/*
* 获取所有密信
* */
remote.getMessages = function(rid,cb){
    var messages = this.app.get(consts.cache.MESSAGES);
    var msgs = messages[rid];
    var tmp = utils.clone(msgs);
    utils.invokeCallback(cb,msgs);
};

/*
* 更新消息状态
* */
remote.updateMessages = function(rid,fid,cb){
    var messages = this.app.get(consts.cache.MESSAGES);
    var ids = [];
    var receiver = messages[fid];
    if(receiver){
        var tmp = receiver[rid];
        if(tmp){
            for(var i = 0; i < tmp.length; i++){
                tmp[i].r = consts.ny.Y;
            }
        }
        receiver[fid] = tmp;
        messages[rid] = receiver;
    }
    var message = this.app.get(consts.cache.MESSAGE);
    for(var i = 0; i < ids.length; i++){
        message[ids[i]].status = consts.crud.U;
    }
    this.app.set(consts.cache.MESSAGE,message);
    utils.invokeCallback(cb);
};

/*
* 添加好友
* */
remote.addFriend = function(rid,fid,cb){
    var uuid = utils.uuidCompact().replace(/-/g,'');
    var obj = {stime:utils.formatDate(Date.now()),role1:rid,role2:fid,id:uuid};
    obj.status = consts.crud.C;
    var friends = this.app.get(consts.cache.FRIENDS);
    var friend = this.app.get(consts.cache.FRIEND);
    friend[uuid] = obj;
    var r1 = friends[rid];
    if(!r1){
        r1 = {};
    }
    r1[fid] = obj;
    friends[rid] = r1;
    var r2 = friends[fid];
    if(!r2){
        r2 = {};
    }
    r2[rid] = obj;
    friends[fid] = r2;
    this.app.set(consts.cache.FRIEND,friend);
    this.app.set(consts.cache.FRIENDS,friends);
    utils.invokeCallback(cb);
};

/*
* 保存密信
* */
remote.sendMessage = function(msg,cb){
    msg.status = consts.crud.C;
    var messages = this.app.get(consts.cache.MESSAGES);
    var message = this.app.get(consts.cache.MESSAGE);
    message[msg.id] = msg;
    var sender = messages[msg.sender];
    if(sender){
        var tmp = sender[msg.receiver];
        if(!tmp){
            tmp = [];
            sender[msg.receiver] = tmp;
        }
    }else{
        sender = {};
        sender[msg.receiver] = [];
    }
    sender[msg.receiver].push(msg);
    messages[msg.sender] = sender;
    var receiver = messages[msg.receiver];
    if(receiver){
        var tmp = receiver[msg.receiver];
        if(!tmp){
            tmp = [];
            receiver[msg.sender] = tmp;
        }
    }else{
        receiver = {};
        receiver[msg.sender] = [];
    }
    receiver[msg.sender].push(msg);
    messages[msg.receiver] = receiver;
    this.app.set(consts.cache.MESSAGE,message);
    this.app.set(consts.cache.MESSAGES,messages);
    utils.invokeCallback(cb);
};

//--------------------缓存数据

remote.addToken = function(uid,token,cb){
    var tokens = this.app.get(consts.cache.TOKEN);
    tokens[uid] = {uid:uid,token:token};
    utils.invokeCallback(cb,tokens[uid]);
};

remote.getToken = function(uid,cb){
    var tokens = this.app.get(consts.cache.TOKEN);
    var token = tokens[uid];
    utils.invokeCallback(cb,token.token);
};

/**
 * kick原来的连接
 * 被动
 */
remote.kick = function(uid,frontendId,sessionId,cb) {
    var self = this;
    var onlines = this.app.get(consts.cache.ONLINE);
    var online = onlines[uid];
    if(online&&sessionId==online.sessionId) {
        self.pushMsg(consts.events.CLOSE, {msg: '您已经在别的地方登录，此处帐号被强制退出'}, uid, function () {
            self.app.get(consts.sys.BCS).kickBySid(frontendId, sessionId, function () {
                delete onlines[uid];
                utils.invokeCallback(cb);
            });
        });
    }else{
        logger.info('无效的断开socket的请求');
        utils.invokeCallback(cb);
    }
};

/**
 * kick原来的连接，添加新的连接
 * 主动
 */
remote.cick = function(uid,frontendId,sessionId,cb) {
    var self = this;
    var onlines = this.app.get(consts.cache.ONLINE);
    var online = onlines[uid];
    if(online) {
        self.pushMsg(consts.events.CLOSE, {msg: '帐号异常退出，请重新登录'}, uid, function () {
            self.app.get(consts.sys.BCS).kickBySid(online.frontendId, online.sessionId, function () {
                online = {
                    uid:uid,
                    frontendId:frontendId,
                    sessionId:sessionId,
                    time:Date.now()
                };
                onlines[uid] = online;
                utils.invokeCallback(cb);
            });
        });
    }else{
        online = {
            uid:uid,
            frontendId:frontendId,
            sessionId:sessionId,
            time:Date.now()
        };
        onlines[uid] = online;
        utils.invokeCallback(cb);
    }
};

/*
* 将用户踢出channel
* */
remote.leave = function(uid,cb){
    var self = this;
    var channel = self.app.get(consts.sys.CS).getChannel(consts.sys.CHANNEL,false);
    var record = channel.getMember(uid);
    if(record) {
        channel.leave(record.uid, record.sid);
    }
    utils.invokeCallback(cb,record);
};

/*
* 将用户加入到channel
* */
remote.addToChannel = function(uid,serverId,cb){
    var self = this;
    var cs = self.app.get(consts.sys.CS);
    var channel = cs.getChannel(consts.sys.CHANNEL,true);
    var ok = channel.add(uid,serverId);
    utils.invokeCallback(cb,ok);
};

/*
* 向指定用户推送消息
* */
remote.pushMsg = function(route,obj,uid,cb){
    var uids = this.app.get(consts.sys.CS).getChannel(consts.sys.CHANNEL,false).getMember(uid);
    if(uids){
        this.app.get(consts.sys.CS).pushMessageByUids(route,obj,[uids],null,function(){
            logger.info('消息推送成功：'+JSON.stringify(obj));
            utils.invokeCallback(cb,consts.code.SUCCESS);
        });
    }else{
        logger.info('用户未登录，消息推送失败：'+uid);
        utils.invokeCallback(cb,consts.code.E_NOTHAS);
    }
};

/*
* 广播消息
* */
remote.broadcast = function(){};

/*
* 获取当前连接数
* */
remote.getConnectionCount = function(cb){
    var c1 = this.app.get(consts.sys.SS).getSessionsCount();
    var c2 = utils.getLength(this.app.get(consts.cache.ONLINE));
    if(cb){
        utils.invokeCallback(cb,[c1,c2]);
    }else{
        return [c1,c2];
    }
};

/**
 * 添加或者修改用户的实时在线信息
 * */
remote.saveRoleInfo = function(roleInfo,cb){
    var ris = this.app.get(consts.cache.ROLEINFO);
    ris[roleInfo.id] = roleInfo;
    if(cb){
        utils.invokeCallback(cb);
    }else{
        return;
    }
};

/**
 * 获取用户的实时在线信息
 * */
remote.getRoleInfo = function(rid,cb){
    var ris = this.app.get(consts.cache.ROLEINFO);
    var roleInfo = ris[rid];
    var tmp = utils.clone(roleInfo);
    if(cb){
        utils.invokeCallback(cb,roleInfo);
    }else{
        return tmp;
    }
};

//----------------------配置文件数据-------------

/**
 * 获取某张配置表
 * */
remote.getTemplate = function(tab,cb){
    var cfg = this.app.get(tab);
    if(cb){
        utils.invokeCallback(cb,cfg);
    }else{
        return cfg;
    }
};

/*
* 获取配置表中某条数据
* */
remote.getItem = function(tab,id,cb){
    var cfg = this.app.get(tab);
    var item = cfg[id];
    if(cb){
        utils.invokeCallback(cb,item);
    }else{
        return item;
    }
};


//--------------------------------------

remote.getCache = function(tab,cb){
    var cache = this.app.get(tab);
    if(cb){
        utils.invokeCallback(cb,cache);
    }else{
        return cache;
    }
};

remote.getUserById = function(uid,cb){
    var users = this.app.get(consts.cache.USER);
    var tmp = null;
    for(var i in users){
        if(users[i].id==uid){
            tmp = utils.clone(users[i]);
            if(cb){
                utils.invokeCallback(cb,users[i]);
                return;
            }else{
                return users[i];
            }
        }
    }
};
