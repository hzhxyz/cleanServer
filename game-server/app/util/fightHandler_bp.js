var logger = require('pomelo-logger').getLogger(__filename);
var fightService = require('../../../service/fightService');
var userService = require('../../../service/userService');
var emailService = require('../../../service/emailService');
var utils = require('../../../util/utils');
var consts = require('../../../util/consts');

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
        case 'updatefightcfg':
            self.updatefightcfg(msg,session,next);
            return;
        case 'useItemInFight':
            self.useItemInFight(msg,session,next);
            return;
        case 'fightResult':
            self.fightResult(msg,session,next);
            return;
        case 'sfightResult':
            self.sfightResult(msg,session,next);
            return;
        case 'startPlunder':
            self.startPlunder(msg,session,next);
            return;
        case 'plunderResult':
            self.plunderResult(msg,session,next);
            return;
        case 'useItemOutFight':
            self.useItemOutFight(msg,session,next);
            return;
        case 'startFight':
            self.startFight(msg,session,next);
            return;
        case 'startsFight':
            self.startsFight(msg,session,next);
            return;
    }
};

/**
 * 更新战术台配置
 * */
handler.updatefightcfg = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    fightService.updatefightcfg(msg,rid,function(code,res){
        next(null,{
            msg:route,
            code:code,
            data:res
        });
    });
};

/**
 * 战斗中对道具的消耗
 * */
handler.useItemInFight = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var pos = msg.pos;
    fightService.useItemInFight(pos,rid,function(code,res){
        next(null,{
            msg:route,
            code:code,
            data:res
        });
    });
};

/**
 * 普通关卡战斗结束之后的结算
 * */
handler.fightResult = function(msg, session, next){
    var route = msg.msg;
    var self = this;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    var result = msg.result;
    var levelId = msg.levelId;
    var num = msg.num;
    var items = msg.items;
    fightService.fightResult(result, levelId, items, num, rid, function (code, res) {
        var ret = res.ret;
        if (ret) {
            var attachs = [];
            var results = res.results;
            if (results.mats && results.mats.length > 0) {
                for (var i = 0; i < results.mats.length; i++) {
                    attachs.push({type: '1040', res: results.mats[i].type, num: results.mats[i].num});
                }
            }
            if (results.pets && results.pets.length > 0) {
                for (var i = 0; i < results.pets.length; i++) {
                    attachs.push({type: '0030', res: results.pets[i].type, num: results.pets[i].num});
                }
            }
            var levels = self.app.get(consts.sys.DS).get(consts.schema.LEVEL);
            var level = levels[levelId];
            var inform = '由于仓库已满，您在关卡' + level.name + '中获得的物品临时存放在这里。附件保持15天，请尽快收货哦~~';
            var comment = {id: levelId, type: 'level'};
            emailService.inform(inform, attachs, consts.emailType.FIGHTRESULT, emailService.SYS, rid, JSON.stringify(comment),
                function (code, res) {
                    self.app.rpc.connmgr.connRemote.pushMsg(session, consts.events.NEWEMAIL, 0,
                        {type: consts.events.FIGHTRESULT}, consts.sys.CHANNEL, session.uid, function () {
                            logger.info('战斗结果已推送：', rid);
                        });
                });
            res.ret = undefined;
            next(null, {
                msg: route,
                code: code,
                data: res
            });
        } else {
            next(null, {
                msg: route,
                code: code,
                data: res
            });
        }
    });
    return;
};

handler.startPlunder = function(msg, session, next){
    var route = msg.msg;
    var self = this;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    fightService.startPlunder(msg.fid,function(code,res){
        next(null,{
            msg:route,
            code:code,
            data:{pet:res}
        });
    });
};

handler.plunderResult = function(msg, session, next){
    var route = msg.msg;
    var self = this;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    fightService.plunderResult(rid,msg.fid,msg.result,function(code,res){
        if(res&&res.ret){
            var attachs = [];
            if(res.mats&&res.mats.length>0){
                for(var i = 0; i < res.mats.length; i++){
                    attachs.push({type:'1040',res:res.mats[i].type,num:res.mats[i].num});
                }
            }
            userService.getRoleInfo(msg.fid, function (code, res) {
                var friend = res[0];
                var inform = '由于仓库已满，您在掠夺朋友' + friend.rolename + '家中获得的物品临时存放在这里。附件保持15天，请尽快收货哦~~';
                var comment = {id: friend.id, rolename: friend.rolename, type: friend.type};
                emailService.inform(inform, attachs, consts.emailType.PLUNDERRESULT,
                    emailService.SYS, rid, JSON.stringify(comment), function (code, res) {
                        self.app.rpc.connmgr.connRemote.pushMsg(session, consts.events.NEWEMAIL, 0,
                            {type: consts.events.PLUNDERRESULT}, consts.sys.CHANNEL, session.uid, function () {
                                logger.info('掠夺结果已推送：', rid);
                        });
                });
            });
            res.ret = undefined;
            next(null, {
                msg: route,
                code: code,
                data: res
            });
        }else{
            next(null,{
                msg:route,
                code:code,
                data:res
            });
        }
    });
};

handler.useItemOutFight = function(msg, session, next){
    var route = msg.msg;
    var self = this;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    fightService.useItemOutFight(msg.type,rid,msg.num,function(code,res){
        next(null,{
            msg:route,
            code:code,
            data:res
        });
    });
};

/*
* 普通关卡开始战斗
* */
handler.startFight = function(msg,session,next){
    var route = msg.msg;
    var self = this;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    fightService.startFight(msg.levelId,msg.mapId,rid,function(code,res){
        next(null,{
            msg:route,
            code:code,
            data:{mon4:res}
        });
    });
};

/*
* 特殊关卡开始战斗
* */
handler.startsFight = function(msg,session,next){
    var route = msg.msg;
    var self = this;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    fightService.startsFight(msg.mapId,msg.levelId,msg.actiId,rid,function(code,res){
        next(null,{
            msg:route,
            code:code,
            data:null
        });
    });
};

/*
* 特殊关卡战斗结算
* */
handler.sfightResult = function(msg,session,next){
    var route = msg.msg;
    var self = this;
    msg = msg.data;
    var rid = session.get(consts.sys.RID);
    //fightService.startsFight(msg.mapId,msg.levelId,msg.actiId,rid,function(code,res){});
    fightService.dailyFightResult(msg.result,msg.levelId,msg.items,msg.num,msg.actiId,rid,function(code,res){
        if(res){
            var ret = res.ret;
            if (ret) {
                var attachs = [];
                var results = res.results;
                if (results.mats && results.mats.length > 0) {
                    for (var i = 0; i < results.mats.length; i++) {
                        attachs.push({type: '1040', res: results.mats[i].type, num: results.mats[i].num});
                    }
                }
                if (results.pets && results.pets.length > 0) {
                    for (var i = 0; i < results.pets.length; i++) {
                        attachs.push({type: '0030', res: results.pets[i].type, num: results.pets[i].num});
                    }
                }
                var levels = self.app.get(consts.sys.DS).get(consts.schema.LEVEL);
                var level = levels[levelId];
                var inform = '由于仓库已满，您在特殊关卡' + level.name + '中获得的物品临时存放在这里。附件保持15天，请尽快收货哦~~';
                var comment = {id: levelId, type: 'level'};
                emailService.inform(inform, attachs, consts.emailType.FIGHTRESULT, emailService.SYS, rid, JSON.stringify(comment),
                    function (code, res) {
                        self.app.rpc.connmgr.connRemote.pushMsg(session, consts.events.NEWEMAIL, 0,
                            {type: consts.events.FIGHTRESULT}, consts.sys.CHANNEL, session.uid, function () {
                                logger.info('战斗结果已推送：', rid);
                            });
                    });
                res.ret = undefined;
                next(null, {
                    msg: route,
                    code: code,
                    data: res
                });
            } else {
                next(null, {
                    msg: route,
                    code: code,
                    data: res
                });
            }
        }else{
            next(null, {
                msg: route,
                code: code,
                data: res
            });
        }
    });

};
