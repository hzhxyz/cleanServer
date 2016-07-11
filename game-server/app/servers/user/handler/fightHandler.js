var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../util/consts');
var serviceDao = require('../../../dao/serviceDao');
var utils = require('../../../util/utils');
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
        default:
            next(null,{
                msg:route,
                code:consts.code.E_CHECK,
                data:null
            });
            return;
    }
};

/**
 * 更新战术台
 * */
handler.updatefightcfg = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
        var fcfg = msg.fightcfg;
        var stone = fcfg.stone;
        var item = fcfg.item;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var fightcfg = role.fightcfg;
            var res = role.res;
            //战术台校验开始
            var colors = [];
            for(var i = 0; i < stone.length; i++){
                var stoneId = stone[i];
                if(!stoneId){
                    continue;
                }
                var color = res.stone[stoneId].type.substr(0,2);
                color = parseInt(color);
                if(colors[color]){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }else{
                    colors[color] = color;
                }
            }
            for(var i = 0; i < fightcfg.stone.length; i++){
                var stoneId = fightcfg.stone[i];
                if(!stoneId){
                    continue;
                }
                res.stone[stoneId].isequip = 0;
                fightcfg.stone[i] = 0;
            }
            for(var i = 0; i < fightcfg.item.length; i++){
                var type = fightcfg.item[i];
                if(!type){
                    continue;
                }
                if(!res.item[type]){
                    res.item[type] = {type:type,num:0,isequip:0,protected:0};
                }
                fightcfg.item[i] = 0;
                res.item[type].num = res.item[type].num + 1;
            }
            //战术台校验结束
            for(var i = 0; i < stone.length; i++){
                var stoneId = stone[i];
                if(stoneId){
                    if(res.stone[stoneId]){
                        res.stone[stoneId].isequip = 1;
                    }else{
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }
                }
                fightcfg.stone[i] = stoneId;
            }
            for(var i = 0; i < item.length; i++){
                var type = item[i];
                if(!type){
                    continue;
                }
                if(res.item[type]&&res.item[type].num>0){
                    res.item[type].num = res.item[type].num -1;
                    if(res.item[type].num==0){
                        res.item[type] = undefined;
                    }
                    fightcfg.item[i] = type;
                }else{
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }
            }
            role.res = res;
            role.fightcfg = fightcfg;
            self.app.rpc.user.dataRemote.updateRole('1',role,function(){
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
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 创建战斗数据
 * */
var createFight = function(role,self,cb){
    self.app.rpc.user.dataRemote.getRoleInfo('1',role.id,function(roleInfo){
        if(!roleInfo){
            utils.invokeCallback(cb,null);
            return;
        }
        roleInfo.fight = utils.clone(consts.fightInfo);
        var fight = roleInfo.fight;
        fight.role = role.role;
        fight.startTime = Date.now();
        var stone = role.res.stone;
        var fightcfg = {
            stone:[0,0,0,0,0],
            item:[0,0,0,0]
        };
        for(var i = 0; i < role.fightcfg.stone.length; i++){
            var stoneId = role.fightcfg.stone[i];
            if(!stoneId){
                utils.invokeCallback(cb,null);
                return;
            }else{
                fightcfg.stone.push(stone[stoneId]);
            }
        }
        fightcfg.item = role.fightcfg.item;
        fight.fightcfg = fightcfg;
        var list = [],matrix = [];
        /*for(var i = 0; i < 300; i++){
            var index = utils.getRand()%5;
            var type = fightcfg.stone[index];
            list.push(type.type);
        }
        for(var y = 0; y < 7; y++){
            for(var x = 0; x < 6; x++){
                var index = x*6+y*7;
                var e = {x:x,y:y,type:list[index]};
                matrix.push(e);
            }
        }*/
        fight.list = list;
        fight.matrix = matrix;
        roleInfo.fight = fight;
        utils.invokeCallback(cb,roleInfo);
        return;
    });
};

var getType4 = function(mapId,self,cb){
    utils.getTemplate(consts.schema.ACTIVITY,self,function(activity){
        utils.getTemplate(consts.schema.TYPE4,self,function(type4){
            var now = new Date();
            var time = now.getTime();
            var w = now.getDay();//5,6,0会出现神兽
            var type4s = [];
            for(var i in activity){
                var act = activity[i];
                if(act.closed==1&&act.type==4){
                    var st = utils.formatDate(act.startDate+' '+act.startTime);
                    var et = utils.formatDate(act.endDate+' '+act.endTime);
                    var t4 = type4[act.typeDID];
                    if(act.loopType==0) {//无重复活动
                        if(Date.parse(st)<time&&Date.parse(et)>time){
                            if (t4.mapid == mapId) {
                                type4s.push({actId: act.id, t4: t4});
                            }
                        }
                    }else if(act.loopType==1){//每日重复
                        var stt = utils.formatDate(now).split(' ')[0]+' '+st.split(' ')[1];
                        var ett = utils.formatDate(now).split(' ')[0]+' '+et.split(' ')[1];
                        if(Date.parse(stt)<time&&Date.parse(ett)>time) {
                            if (t4.mapid == mapId) {
                                type4s.push({actId: act.id, t4: t4});
                            }
                        }
                    }else if(act.loopType==2){//每周重复
                        var ws = [];
                        var tmp = Date.parse(st);
                        while(tmp<Date.parse(et)){
                            var nw = new Date(tmp).getDay();
                            ws.push(nw);
                            tmp = tmp+consts.time.date;
                        }
                        var wss = [];
                        for(var j = 0; j < ws.length; j++){
                            var b = false;
                            for(var k = 0; k < wss.length; k++){
                                if(ws[j]==wss[k]){
                                    b = true;
                                    break;
                                }
                            }
                            if(!b){
                                wss.push(ws[j]);
                            }
                        }
                        for(var j = 0; j < wss.length; j++){
                            if(w==wss[j]){
                                type4s.push({actId: act.id, t4: t4});
                                break;
                            }
                        }
                    }else if(act.loopType==3){//每月重复
                        var sd = utils.formatDate(now,'yyyy-MM-dd').substr(0,8)+
                            utils.formatDate(act.startDate,'yyyy-MM-dd').substr(8,2);
                        sd = sd+' '+act.startTime;//本月的开始时间
                        var ed = utils.formatDate(now,'yyyy-MM-dd').substr(0,8)+
                            utils.formatDate(act.endDate,'yyyy-MM-dd').substr(8,2);
                        ed = ed+' '+act.endTime;//本月的结束时间
                        if(Date.parse(sd)<time&&Date.parse(ed)>time) {
                            if (t4.mapid == mapId) {
                                type4s.push({actId: act.id, t4: t4});
                            }
                        }
                    }
                }
            }
            utils.invokeCallback(cb,type4s);
        });
    });
};

/**
 * 普通关卡战斗开始
 * */
handler.startFight = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var levelId = msg.levelId;
        var level = utils.getItem(consts.schema.LEVEL,levelId,self,null);
        if(level){
            var role = self.app.rpc.user.dataRemote.getRole(rid,null);
            for(var i = 0; i < role.fightcfg.stone.length;i++){
                if(!role.fightcfg.stone[i]){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }
            }
            createFight(role,self,function(roleInfo){
                if(!roleInfo){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }
                roleInfo.fight.levelType = consts.levelType.COM;
                roleInfo.fight.level = level;
                //TODO 神兽如何遇见需要策划更详细的文档
                getType4(level.mapid,self,function(type4s){
                    var rand = Math.random();
                    var mon = {};
                    if(type4s&&type4s.length>0){
                        serviceDao.selectSmon(rid,function(res){
                            if(res&&res.length>0){
                                for(var i = 0; i < res.length; i++){
                                    for(var j = 0; j < type4s.length; j++){
                                        if(res[i].actiId==type4s[j].actId&&res[i].mapId==level.mapid&&res[i].type==type4s[j].t4.p1&&res[i].capture==1){
                                            type4s[j].has = 1;
                                            continue;
                                        }
                                    }
                                }
                                for(var i = 0; i < type4s.length; i++){
                                    if(type4s[i].has&&rand*100<=type4s.t4.prob){
                                        mon = type4s[i];
                                        break;
                                    }
                                }
                            }
                        });
                    }
                    //------------------------僵尸判断开始
                    if(utils.isBlank(mon)){//没有遇到神兽
                        if(rand<=0.3){
                            var diff = Date.now()-consts.time.date*1;
                            self.app.rpc.user.dataRemote.getFriendOut(rid,diff,function(friends){
                                if(friends&&friends.length>0){
                                    rand = Math.random();
                                    var index = Math.floor(friends.length*rand);
                                    var friend = friends[index];
                                    roleInfo.fight.special = consts.specialMonType.ZOM;
                                    roleInfo.fight.specialMon = {roleId:friend.id,level:friend.level,type:friend.type};
                                }else{
                                    //什么都没有遇到，special和specialMon都是null
                                }
                            });
                        }else{
                            //什么都没有遇到，special和specialMon都是null
                        }
                    }else{
                        roleInfo.fight.special = consts.specialMonType.MON;
                        roleInfo.fight.specialMon = mon;
                    }
                    //-----------------------僵尸判断结束
                    self.app.rpc.user.dataRemote.saveRoleInfo(roleInfo,function(){
                        var data = roleInfo.fight.special?roleInfo.fight.special==consts.specialMonType.MON?{id:roleInfo.fight.specialMon.id}:roleInfo.fight.specialMon:null;
                        next(null,{
                            msg:route,
                            code:consts.code.SUCCESS,
                            data:{type:roleInfo.fight.special,data:data}
                        });
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
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 普通关卡战斗结算
 * */
handler.fightResult = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var result = msg.result;
        var levelId = msg.levelId;
        var num = msg.num;
        var items = msg.items;
        self.app.rpc.user.dataRemote.getRoleInfo('1',rid,function(roleInfo){
            if(roleInfo){
                var fight = roleInfo.fight;
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

/**
 * 开始掠夺
 * */
handler.startPlunder = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 掠夺结算
 * */
handler.plunderResult = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 特殊关卡战斗开始
 * */
handler.startsFight = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 特殊关卡战斗结算
 * */
handler.sfightResult = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};
